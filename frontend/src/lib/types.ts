export interface StudentDTO {
  id: number;
  name: string;
  age: number;
  email: string;
  username: string;
  bio: string | null;
  gpa: number;
  role: string;
  enrollments: EnrollmentDTO[];
}

export interface CourseDTO {
  id: number;
  name: string;
  description: string;
  credits: number;
  enrolledCount: number;
}

export interface EnrollmentDTO {
  id: number;
  courseId: number;
  courseName: string;
  credits: number;
  grade: number | null;
  status: string;
  enrolledAt: string;
}

export interface RegisterRequest {
  name: string;
  age: number;
  email: string;
  username: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  age?: number;
  email?: string;
  bio?: string;
}

export interface CreateCourseRequest {
  name: string;
  description: string;
  credits: number;
}
