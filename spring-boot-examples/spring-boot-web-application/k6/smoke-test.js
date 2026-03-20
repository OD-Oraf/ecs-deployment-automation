import http from 'k6/http';
import { check, group, sleep } from 'k6';
import encoding from 'k6/encoding';

// --- Configuration ---
const BASE_URL = __ENV.BASE_URL || 'http://rest-service-dev-alb-456898945.us-east-1.elb.amazonaws.com';

const STUDENT_AUTH = `Basic ${encoding.b64encode('ranga:password123')}`;
const ADMIN_AUTH = `Basic ${encoding.b64encode('admin:admin123')}`;

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],   // <1% errors
    http_req_duration: ['p(95)<2000'], // 95th percentile < 2s
  },
  scenarios: {
    smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '60s',
    },
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

// --- Smoke Test ---
export default function () {

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================
  group('Public - Health Check', function () {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health returns 200': (r) => r.status === 200,
    });
  });

  group('Public - List Courses', function () {
    const res = http.get(`${BASE_URL}/api/courses`);
    check(res, {
      'courses returns 200': (r) => r.status === 200,
      'courses is an array': (r) => Array.isArray(r.json()),
      'at least 6 pre-loaded courses': (r) => r.json().length >= 6,
    });
  });

  group('Public - Get Course By ID', function () {
    const res = http.get(`${BASE_URL}/api/courses/1`);
    check(res, {
      'course 1 returns 200': (r) => r.status === 200,
      'course has id field': (r) => r.json().id === 1,
      'course has name field': (r) => r.json().name !== undefined,
    });
  });

  group('Public - Get Course Not Found', function () {
    const res = http.get(`${BASE_URL}/api/courses/9999`);
    check(res, {
      'missing course returns 404': (r) => r.status === 404,
    });
  });

  group('Public - Search Courses', function () {
    const res = http.get(`${BASE_URL}/api/courses/search?name=Spring`);
    check(res, {
      'search returns 200': (r) => r.status === 200,
      'search result is an array': (r) => Array.isArray(r.json()),
    });
  });

  group('Public - Register Student', function () {
    const uniqueId = Date.now();
    const payload = JSON.stringify({
      name: `Smoke Test User ${uniqueId}`,
      age: 21,
      email: `smoketest${uniqueId}@university.edu`,
      username: `smokeuser${uniqueId}`,
      password: 'testpassword',
    });
    const res = http.post(`${BASE_URL}/api/auth/register`, payload, jsonHeaders());
    check(res, {
      'register returns 200 or 201': (r) => [200, 201].includes(r.status),
      'response has username': (r) => r.json().username !== undefined,
      'password not in response': (r) => r.json().password === undefined,
    });
  });

  group('Public - Register Invalid Data', function () {
    const payload = JSON.stringify({
      name: '',
      age: 10,
      email: 'invalid',
      username: '',
      password: '',
    });
    const res = http.post(`${BASE_URL}/api/auth/register`, payload, jsonHeaders());
    check(res, {
      'invalid register returns 400': (r) => r.status === 400,
    });
  });

  // ==========================================
  // SECURITY CHECKS
  // ==========================================
  group('Security - Unauthenticated access blocked', function () {
    const res = http.get(`${BASE_URL}/api/students`);
    check(res, {
      'students without auth returns 401': (r) => r.status === 401,
    });
  });

  group('Security - Student cannot access admin endpoints', function () {
    const payload = JSON.stringify({
      name: 'Forbidden Course',
      description: 'Should fail',
      credits: 3,
    });
    const res = http.post(`${BASE_URL}/api/courses`, payload, jsonHeaders(STUDENT_AUTH));
    check(res, {
      'student create course returns 403': (r) => r.status === 403,
    });
  });

  // ==========================================
  // AUTHENTICATED (STUDENT) ENDPOINTS
  // ==========================================
  group('Student - List Students', function () {
    const res = http.get(`${BASE_URL}/api/students`, authHeaders(STUDENT_AUTH));
    check(res, {
      'students returns 200': (r) => r.status === 200,
      'students is an array': (r) => Array.isArray(r.json()),
      'at least 4 pre-loaded students': (r) => r.json().length >= 4,
    });
  });

  group('Student - Get Student By ID', function () {
    const res = http.get(`${BASE_URL}/api/students/2`, authHeaders(STUDENT_AUTH));
    check(res, {
      'student 2 returns 200': (r) => r.status === 200,
      'student has id': (r) => r.json().id !== undefined,
      'student has name': (r) => r.json().name !== undefined,
    });
  });

  group('Student - Search Students', function () {
    const res = http.get(`${BASE_URL}/api/students/search?name=ranga`, authHeaders(STUDENT_AUTH));
    check(res, {
      'search students returns 200': (r) => r.status === 200,
      'search result is an array': (r) => Array.isArray(r.json()),
    });
  });

  group('Student - View Own Profile', function () {
    const res = http.get(`${BASE_URL}/api/students/me`, authHeaders(STUDENT_AUTH));
    check(res, {
      'my profile returns 200': (r) => r.status === 200,
      'profile has username': (r) => r.json().username === 'ranga',
      'profile has email': (r) => r.json().email !== undefined,
    });
  });

  group('Student - Update Own Profile', function () {
    const payload = JSON.stringify({ bio: 'k6 smoke test', age: 26 });
    const res = http.put(`${BASE_URL}/api/students/me`, payload, jsonHeaders(STUDENT_AUTH));
    check(res, {
      'update profile returns 200': (r) => r.status === 200,
      'bio was updated': (r) => r.json().bio === 'k6 smoke test',
      'age was updated': (r) => r.json().age === 26,
    });
  });

  group('Student - View My Enrollments', function () {
    const res = http.get(`${BASE_URL}/api/enrollments/my-courses`, authHeaders(STUDENT_AUTH));
    check(res, {
      'my enrollments returns 200': (r) => r.status === 200,
      'enrollments is an array': (r) => Array.isArray(r.json()),
    });
  });

  group('Student - Enroll In Course', function () {
    const res = http.post(`${BASE_URL}/api/enrollments/enroll/5`, null, authHeaders(STUDENT_AUTH));
    check(res, {
      'enroll returns 200 or 201': (r) => [200, 201].includes(r.status),
    });
  });

  group('Student - Drop Course', function () {
    const res = http.put(`${BASE_URL}/api/enrollments/drop/5`, null, authHeaders(STUDENT_AUTH));
    check(res, {
      'drop returns 200': (r) => r.status === 200,
    });
  });

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================
  let createdCourseId;

  group('Admin - Create Course', function () {
    const payload = JSON.stringify({
      name: 'k6 Smoke Test Course',
      description: 'Created by k6 smoke test',
      credits: 3,
    });
    const res = http.post(`${BASE_URL}/api/courses`, payload, jsonHeaders(ADMIN_AUTH));
    check(res, {
      'create course returns 200 or 201': (r) => [200, 201].includes(r.status),
      'course name matches': (r) => r.json().name === 'k6 Smoke Test Course',
    });
    if ([200, 201].includes(res.status)) {
      createdCourseId = res.json().id;
    }
  });

  if (createdCourseId) {
    group('Admin - Update Course', function () {
      const payload = JSON.stringify({
        name: 'k6 Updated Course',
        description: 'Updated by k6',
        credits: 4,
      });
      const res = http.put(`${BASE_URL}/api/courses/${createdCourseId}`, payload, jsonHeaders(ADMIN_AUTH));
      check(res, {
        'update course returns 200': (r) => r.status === 200,
        'course name updated': (r) => r.json().name === 'k6 Updated Course',
      });
    });

    group('Admin - Delete Course', function () {
      const res = http.del(`${BASE_URL}/api/courses/${createdCourseId}`, null, authHeaders(ADMIN_AUTH));
      check(res, {
        'delete course returns 200 or 204': (r) => [200, 204].includes(r.status),
      });
    });

    group('Admin - Verify Course Deleted', function () {
      const res = http.get(`${BASE_URL}/api/courses/${createdCourseId}`);
      check(res, {
        'deleted course returns 404': (r) => r.status === 404,
      });
    });
  }

  group('Admin - Assign Grade', function () {
    const payload = JSON.stringify({ grade: 3.9 });
    const res = http.put(
      `${BASE_URL}/api/enrollments/grade/1?studentId=2`,
      payload,
      jsonHeaders(ADMIN_AUTH)
    );
    check(res, {
      'assign grade returns 200': (r) => r.status === 200,
    });
  });

  group('Admin - Assign Invalid Grade', function () {
    const payload = JSON.stringify({ grade: 5.0 });
    const res = http.put(
      `${BASE_URL}/api/enrollments/grade/1?studentId=2`,
      payload,
      jsonHeaders(ADMIN_AUTH)
    );
    check(res, {
      'invalid grade returns 400': (r) => r.status === 400,
    });
  });

  group('Admin - Delete Student', function () {
    const res = http.del(`${BASE_URL}/api/students/5`, null, authHeaders(ADMIN_AUTH));
    check(res, {
      'delete student returns 200 or 204': (r) => [200, 204].includes(r.status),
    });
  });

  sleep(1);
}
