# Student Services API

A Spring Boot REST API for managing students, courses, and enrollments with an H2 in-memory database and role-based security.

## Tech Stack

- **Spring Boot 4.0.0-M1** (Java 21)
- **Spring Data JPA** with **H2** in-memory database
- **Spring Security** with BCrypt password hashing
- **Bean Validation** (Jakarta)

## Running the Application

```bash
mvn spring-boot:run
```

The app starts on `http://localhost:8080`.

## Seed Data

The application ships with pre-loaded data:

| Username | Password   | Role    |
|----------|------------|---------|
| admin    | admin123   | ADMIN   |
| ranga    | password123| STUDENT |
| alice    | password123| STUDENT |
| bob      | password123| STUDENT |
| carol    | password123| STUDENT |

Pre-loaded with 6 courses and 12 enrollments (some with grades).

## API Endpoints

All authenticated endpoints use **HTTP Basic Auth**.

### Public (no auth required)

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/api/auth/register`      | Register a new student   |
| GET    | `/api/courses`            | List all courses         |
| GET    | `/api/courses/{id}`       | Get course details       |
| GET    | `/api/courses/search?name=` | Search courses by name |
| GET    | `/health`                 | Health check             |
| -      | `/h2-console`             | H2 database console      |

### Authenticated (any student)

| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| GET    | `/api/students`                   | List all students            |
| GET    | `/api/students/{id}`              | Get student by ID            |
| GET    | `/api/students/search?name=`      | Search students by name      |
| GET    | `/api/students/me`                | View own profile             |
| PUT    | `/api/students/me`                | Update own profile           |
| POST   | `/api/enrollments/enroll/{courseId}` | Enroll in a course        |
| GET    | `/api/enrollments/my-courses`     | View own enrollments         |
| PUT    | `/api/enrollments/drop/{courseId}` | Drop a course               |

### Admin only

| Method | Endpoint                              | Description             |
|--------|---------------------------------------|-------------------------|
| POST   | `/api/courses`                        | Create a course         |
| PUT    | `/api/courses/{id}`                   | Update a course         |
| DELETE | `/api/courses/{id}`                   | Delete a course         |
| DELETE | `/api/students/{id}`                  | Delete a student        |
| PUT    | `/api/enrollments/grade/{courseId}?studentId=` | Assign a grade |

## Example Requests

### Register a new student

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 20,
    "email": "john@university.edu",
    "username": "john",
    "password": "mypassword"
  }'
```

### View your profile

```bash
curl -u ranga:password123 http://localhost:8080/api/students/me
```

### Update your profile

```bash
curl -X PUT -u ranga:password123 http://localhost:8080/api/students/me \
  -H "Content-Type: application/json" \
  -d '{"bio": "Updated bio", "age": 26}'
```

### Enroll in a course

```bash
curl -X POST -u ranga:password123 http://localhost:8080/api/enrollments/enroll/4
```

### Assign a grade (admin)

```bash
curl -X PUT -u admin:admin123 \
  "http://localhost:8080/api/enrollments/grade/1?studentId=2" \
  -H "Content-Type: application/json" \
  -d '{"grade": 3.9}'
```

### Browse courses (no auth)

```bash
curl http://localhost:8080/api/courses
```

## Key Features

- **H2 In-Memory Database** with JPA entities and relationships
- **Student self-service** - register, login, update profile, enroll/drop courses
- **Role-based access control** - ADMIN vs STUDENT permissions
- **Weighted GPA calculation** - auto-recalculated when grades are assigned or courses dropped
- **Search** - find students and courses by name
- **Validation** - age range (16-120), email format, unique username/email, grade bounds (0.0-4.0)
- **Enrollment tracking** - status (ENROLLED, COMPLETED, DROPPED) with timestamps
- **H2 Console** - available at `/h2-console` (JDBC URL: `jdbc:h2:mem:studentdb`, user: `sa`, no password)

## Project Structure

```
src/main/java/com/in28minutes/springboot/
├── StudentServicesApplication.java
├── config/
│   └── DataInitializer.java
├── controller/
│   ├── AuthController.java
│   ├── CourseController.java
│   ├── EnrollmentController.java
│   ├── HealthCheckController.java
│   ├── LoginController.java
│   └── StudentController.java
├── dto/
│   ├── CourseDTO.java
│   ├── EnrollmentDTO.java
│   ├── RegisterRequest.java
│   ├── StudentDTO.java
│   └── UpdateProfileRequest.java
├── model/
│   ├── Course.java
│   ├── Enrollment.java
│   └── Student.java
├── repository/
│   ├── CourseRepository.java
│   ├── EnrollmentRepository.java
│   └── StudentRepository.java
├── security/
│   └── SecurityConfig.java
└── service/
    ├── CourseService.java
    ├── EnrollmentService.java
    ├── StudentDetailsService.java
    └── StudentService.java
```