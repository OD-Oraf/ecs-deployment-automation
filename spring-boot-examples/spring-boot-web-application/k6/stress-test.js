import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import encoding from 'k6/encoding';

// --- Configuration ---
const BASE_URL = __ENV.BASE_URL || 'http://rest-service-dev-alb-456898945.us-east-1.elb.amazonaws.com';

const STUDENT_AUTH = `Basic ${encoding.b64encode('ranga:password123')}`;
const ADMIN_AUTH = `Basic ${encoding.b64encode('admin:admin123')}`;

// --- Custom Metrics ---
const errorCount = new Counter('custom_errors');
const healthDuration = new Trend('health_check_duration');
const coursesDuration = new Trend('list_courses_duration');
const studentsDuration = new Trend('list_students_duration');
const profileDuration = new Trend('view_profile_duration');

// --- Stress Test Stages ---
//
//  VUs
//  50 |            ┌────────┐
//     |           /          \
//  30 |     ┌────┘            └────┐
//     |    /                        \
//  10 |───┘                          └───
//     └──────────────────────────────────── time
//       warm   ramp  sustain  ramp  cool
//        up     up    peak    down  down
//
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // warm up
    { duration: '2m', target: 30 },   // ramp to moderate load
    { duration: '3m', target: 50 },   // ramp to peak stress
    { duration: '3m', target: 50 },   // sustain peak
    { duration: '2m', target: 30 },   // scale back
    { duration: '1m', target: 10 },   // cool down
    { duration: '1m', target: 0 },    // drain
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],          // <5% error rate under stress
    http_req_duration: ['p(95)<3000'],       // 95th percentile < 3s
    http_req_duration: ['p(99)<5000'],       // 99th percentile < 5s
    health_check_duration: ['p(95)<1000'],   // health checks stay fast
    custom_errors: ['count<100'],            // total custom errors < 100
  },
};

// --- Helpers ---
function jsonHeaders(authHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;
  return { headers };
}

function authHeaders(authHeader) {
  return { headers: { Authorization: authHeader } };
}

function trackError(res, name) {
  if (res.status >= 500) {
    errorCount.add(1);
    console.error(`${name}: status=${res.status} body=${res.body}`);
  }
}

// --- Stress Test ---
export default function () {
  const vu = __VU;
  const iter = __ITER;

  // ==========================================
  // PUBLIC - High frequency read endpoints
  // ==========================================
  group('Health Check', function () {
    const res = http.get(`${BASE_URL}/health`);
    healthDuration.add(res.timings.duration);
    check(res, {
      'health 200': (r) => r.status === 200,
    });
    trackError(res, 'health');
  });

  group('List Courses', function () {
    const res = http.get(`${BASE_URL}/api/courses`);
    coursesDuration.add(res.timings.duration);
    check(res, {
      'courses 200': (r) => r.status === 200,
      'courses is array': (r) => Array.isArray(r.json()),
    });
    trackError(res, 'list-courses');
  });

  group('Get Course By ID', function () {
    const courseId = (iter % 6) + 1;
    const res = http.get(`${BASE_URL}/api/courses/${courseId}`);
    check(res, {
      'course 200': (r) => r.status === 200,
    });
    trackError(res, 'get-course');
  });

  group('Search Courses', function () {
    const terms = ['Spring', 'Java', 'Data', 'Web', 'Cloud', 'Boot'];
    const term = terms[iter % terms.length];
    const res = http.get(`${BASE_URL}/api/courses/search?name=${term}`);
    check(res, {
      'search courses 200': (r) => r.status === 200,
    });
    trackError(res, 'search-courses');
  });

  // ==========================================
  // AUTHENTICATED - Student read traffic
  // ==========================================
  group('List Students', function () {
    const res = http.get(`${BASE_URL}/api/students`, authHeaders(STUDENT_AUTH));
    studentsDuration.add(res.timings.duration);
    check(res, {
      'students 200': (r) => r.status === 200,
    });
    trackError(res, 'list-students');
  });

  group('View Profile', function () {
    const res = http.get(`${BASE_URL}/api/students/me`, authHeaders(STUDENT_AUTH));
    profileDuration.add(res.timings.duration);
    check(res, {
      'profile 200': (r) => r.status === 200,
    });
    trackError(res, 'view-profile');
  });

  group('Search Students', function () {
    const names = ['ranga', 'alice', 'bob', 'carol'];
    const name = names[iter % names.length];
    const res = http.get(`${BASE_URL}/api/students/search?name=${name}`, authHeaders(STUDENT_AUTH));
    check(res, {
      'search students 200': (r) => r.status === 200,
    });
    trackError(res, 'search-students');
  });

  group('View Enrollments', function () {
    const res = http.get(`${BASE_URL}/api/enrollments/my-courses`, authHeaders(STUDENT_AUTH));
    check(res, {
      'enrollments 200': (r) => r.status === 200,
    });
    trackError(res, 'view-enrollments');
  });

  // ==========================================
  // WRITE OPERATIONS - Lower frequency
  // Every 5th iteration to avoid overwhelming
  // the H2 in-memory database
  // ==========================================
  if (iter % 5 === 0) {
    group('Register Student', function () {
      const uniqueId = `${vu}-${iter}-${Date.now()}`;
      const payload = JSON.stringify({
        name: `Stress User ${uniqueId}`,
        age: 21,
        email: `stress${uniqueId}@test.edu`,
        username: `stressuser${uniqueId}`,
        password: 'testpassword',
      });
      const res = http.post(`${BASE_URL}/api/auth/register`, payload, jsonHeaders());
      check(res, {
        'register 200 or 201': (r) => [200, 201].includes(r.status),
      });
      trackError(res, 'register');
    });

    group('Update Profile', function () {
      const payload = JSON.stringify({ bio: `Stress test VU${vu} iter${iter}`, age: 26 });
      const res = http.put(`${BASE_URL}/api/students/me`, payload, jsonHeaders(STUDENT_AUTH));
      check(res, {
        'update profile 200': (r) => r.status === 200,
      });
      trackError(res, 'update-profile');
    });
  }

  // ==========================================
  // ADMIN OPERATIONS - Occasional
  // Every 10th iteration
  // ==========================================
  if (iter % 10 === 0) {
    group('Admin - Create and Delete Course', function () {
      const payload = JSON.stringify({
        name: `Stress Course VU${vu}-${iter}`,
        description: 'Created during stress test',
        credits: 3,
      });
      const createRes = http.post(`${BASE_URL}/api/courses`, payload, jsonHeaders(ADMIN_AUTH));
      check(createRes, {
        'admin create 200 or 201': (r) => [200, 201].includes(r.status),
      });
      trackError(createRes, 'admin-create-course');

      if ([200, 201].includes(createRes.status)) {
        const courseId = createRes.json().id;
        const delRes = http.del(`${BASE_URL}/api/courses/${courseId}`, null, authHeaders(ADMIN_AUTH));
        check(delRes, {
          'admin delete 200 or 204': (r) => [200, 204].includes(r.status),
        });
        trackError(delRes, 'admin-delete-course');
      }
    });
  }

  sleep(Math.random() * 2 + 0.5); // 0.5–2.5s think time
}

// --- Summary Handler ---
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    vus_max: data.metrics.vus_max ? data.metrics.vus_max.values.max : 'N/A',
    total_requests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
    failed_requests: data.metrics.http_req_failed ? data.metrics.http_req_failed.values.passes : 0,
    avg_duration_ms: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 'N/A',
    p95_duration_ms: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 'N/A',
    p99_duration_ms: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'].toFixed(2) : 'N/A',
  };

  console.log('\n========== STRESS TEST SUMMARY ==========');
  console.log(`Timestamp:        ${summary.timestamp}`);
  console.log(`Max VUs:          ${summary.vus_max}`);
  console.log(`Total Requests:   ${summary.total_requests}`);
  console.log(`Failed Requests:  ${summary.failed_requests}`);
  console.log(`Avg Duration:     ${summary.avg_duration_ms} ms`);
  console.log(`P95 Duration:     ${summary.p95_duration_ms} ms`);
  console.log(`P99 Duration:     ${summary.p99_duration_ms} ms`);
  console.log('==========================================\n');

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'stress-test-results.json': JSON.stringify(data, null, 2),
  };
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
