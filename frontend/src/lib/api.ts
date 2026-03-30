import {
  StudentDTO,
  CourseDTO,
  EnrollmentDTO,
  RegisterRequest,
  UpdateProfileRequest,
  CreateCourseRequest,
} from "./types";

function authHeaders(username: string, password: string): HeadersInit {
  return {
    Authorization: "Basic " + btoa(`${username}:${password}`),
    "Content-Type": "application/json",
  };
}

function getStoredCredentials(): { username: string; password: string } | null {
  if (typeof window === "undefined") return null;
  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");
  if (username && password) return { username, password };
  return null;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const creds = getStoredCredentials();
  if (!creds) throw new Error("Not authenticated");
  const headers = {
    ...authHeaders(creds.username, creds.password),
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}

// Public endpoints
export async function healthCheck(): Promise<string> {
  const res = await fetch("/health");
  return res.text();
}

export async function getCourses(): Promise<CourseDTO[]> {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export async function getCourseById(id: number): Promise<CourseDTO> {
  const res = await fetch(`/api/courses/${id}`);
  if (!res.ok) throw new Error("Course not found");
  return res.json();
}

export async function searchCourses(name: string): Promise<CourseDTO[]> {
  const res = await fetch(`/api/courses/search?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function register(data: RegisterRequest): Promise<StudentDTO> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Registration failed");
  }
  return res.json();
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: authHeaders(username, password),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  localStorage.setItem("username", username);
  localStorage.setItem("password", password);
}

// Authenticated endpoints
export async function getStudents(): Promise<StudentDTO[]> {
  const res = await authFetch("/api/students");
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function getStudentById(id: number): Promise<StudentDTO> {
  const res = await authFetch(`/api/students/${id}`);
  if (!res.ok) throw new Error("Student not found");
  return res.json();
}

export async function searchStudents(name: string): Promise<StudentDTO[]> {
  const res = await authFetch(`/api/students/search?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function getMyProfile(): Promise<StudentDTO> {
  const res = await authFetch("/api/students/me");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateMyProfile(data: UpdateProfileRequest): Promise<StudentDTO> {
  const res = await authFetch("/api/students/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function enrollInCourse(courseId: number): Promise<EnrollmentDTO> {
  const res = await authFetch(`/api/enrollments/enroll/${courseId}`, {
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Enrollment failed");
  }
  return res.json();
}

export async function getMyEnrollments(): Promise<EnrollmentDTO[]> {
  const res = await authFetch("/api/enrollments/my-courses");
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  return res.json();
}

export async function dropCourse(courseId: number): Promise<void> {
  const res = await authFetch(`/api/enrollments/drop/${courseId}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Failed to drop course");
}

// Admin endpoints
export async function createCourse(data: CreateCourseRequest): Promise<CourseDTO> {
  const res = await authFetch("/api/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create course");
  return res.json();
}

export async function updateCourse(id: number, data: CreateCourseRequest): Promise<CourseDTO> {
  const res = await authFetch(`/api/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update course");
  return res.json();
}

export async function deleteCourse(id: number): Promise<void> {
  const res = await authFetch(`/api/courses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete course");
}

export async function assignGrade(
  courseId: number,
  studentId: number,
  grade: number
): Promise<EnrollmentDTO> {
  const res = await authFetch(`/api/enrollments/grade/${courseId}?studentId=${studentId}`, {
    method: "PUT",
    body: JSON.stringify({ grade }),
  });
  if (!res.ok) throw new Error("Failed to assign grade");
  return res.json();
}

export async function deleteStudent(id: number): Promise<void> {
  const res = await authFetch(`/api/students/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete student");
}

export async function getStudentsInCourse(courseId: number): Promise<EnrollmentDTO[]> {
  const res = await authFetch(`/api/courses/${courseId}/students`);
  if (!res.ok) throw new Error("Failed to fetch students in course");
  return res.json();
}
