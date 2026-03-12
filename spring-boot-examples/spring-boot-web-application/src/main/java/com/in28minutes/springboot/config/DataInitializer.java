package com.in28minutes.springboot.config;

import com.in28minutes.springboot.model.Course;
import com.in28minutes.springboot.model.Enrollment;
import com.in28minutes.springboot.model.Student;
import com.in28minutes.springboot.repository.CourseRepository;
import com.in28minutes.springboot.repository.EnrollmentRepository;
import com.in28minutes.springboot.repository.StudentRepository;
import com.in28minutes.springboot.service.StudentService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentService studentService;

    public DataInitializer(StudentRepository studentRepository,
                           CourseRepository courseRepository,
                           EnrollmentRepository enrollmentRepository,
                           PasswordEncoder passwordEncoder,
                           StudentService studentService) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentService = studentService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (studentRepository.count() > 0) {
            return;
        }

        // Students
        var admin = new Student("Admin User", 30, "admin@university.edu", "admin", passwordEncoder.encode("admin123"));
        admin.setRole(Student.Role.ADMIN);
        admin.setBio("System Administrator");
        admin = studentRepository.save(admin);

        var ranga = new Student("Ranga Karanam", 25, "ranga@university.edu", "ranga", passwordEncoder.encode("password123"));
        ranga.setBio("Hiker, Programmer and Architect");
        ranga = studentRepository.save(ranga);

        var alice = new Student("Alice Johnson", 22, "alice@university.edu", "alice", passwordEncoder.encode("password123"));
        alice.setBio("Computer Science major, loves algorithms");
        alice = studentRepository.save(alice);

        var bob = new Student("Bob Smith", 24, "bob@university.edu", "bob", passwordEncoder.encode("password123"));
        bob.setBio("Full-stack developer and coffee enthusiast");
        bob = studentRepository.save(bob);

        var carol = new Student("Carol Williams", 21, "carol@university.edu", "carol", passwordEncoder.encode("password123"));
        carol.setBio("Data Science enthusiast");
        carol = studentRepository.save(carol);

        // Courses
        var springBoot = courseRepository.save(new Course("Spring Boot Fundamentals", "Learn the fundamentals of Spring Boot including auto-configuration, dependency injection, and REST APIs.", 4));
        var springMvc = courseRepository.save(new Course("Spring MVC Advanced", "Advanced Spring MVC concepts including interceptors, exception handling, and content negotiation.", 3));
        var microservices = courseRepository.save(new Course("Microservices Architecture", "Design and build microservices using Spring Cloud, Docker, and Kubernetes.", 4));
        var dsa = courseRepository.save(new Course("Data Structures & Algorithms", "Core computer science concepts: arrays, trees, graphs, sorting, and dynamic programming.", 4));
        var databases = courseRepository.save(new Course("Database Systems", "Relational databases, SQL, indexing, transactions, and NoSQL fundamentals.", 3));
        var aws = courseRepository.save(new Course("Cloud Computing with AWS", "AWS services including EC2, ECS, S3, RDS, Lambda, and infrastructure as code.", 3));

        // Enrollments
        saveEnrollment(ranga, springBoot, 3.8, Enrollment.Status.COMPLETED);
        saveEnrollment(ranga, springMvc, 3.5, Enrollment.Status.COMPLETED);
        saveEnrollment(ranga, microservices, null, Enrollment.Status.ENROLLED);

        saveEnrollment(alice, springBoot, 3.9, Enrollment.Status.COMPLETED);
        saveEnrollment(alice, dsa, null, Enrollment.Status.ENROLLED);
        saveEnrollment(alice, databases, null, Enrollment.Status.ENROLLED);

        saveEnrollment(bob, springBoot, 3.2, Enrollment.Status.COMPLETED);
        saveEnrollment(bob, microservices, null, Enrollment.Status.ENROLLED);
        saveEnrollment(bob, aws, null, Enrollment.Status.ENROLLED);

        saveEnrollment(carol, dsa, 3.7, Enrollment.Status.COMPLETED);
        saveEnrollment(carol, databases, 3.5, Enrollment.Status.COMPLETED);
        saveEnrollment(carol, aws, null, Enrollment.Status.ENROLLED);

        // Recalculate GPAs
        for (var student : studentRepository.findAll()) {
            if (!student.getEnrollments().isEmpty()) {
                studentService.recalculateGpa(student.getId());
            }
        }
    }

    private void saveEnrollment(Student student, Course course, Double grade, Enrollment.Status status) {
        var enrollment = new Enrollment(student, course);
        enrollment.setGrade(grade);
        enrollment.setStatus(status);
        enrollmentRepository.save(enrollment);
    }
}
