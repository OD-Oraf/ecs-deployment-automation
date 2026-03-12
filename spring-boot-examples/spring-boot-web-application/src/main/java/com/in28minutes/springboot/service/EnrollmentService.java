package com.in28minutes.springboot.service;

import com.in28minutes.springboot.dto.EnrollmentDTO;
import com.in28minutes.springboot.model.Enrollment;
import com.in28minutes.springboot.repository.EnrollmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentService studentService;
    private final CourseService courseService;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             StudentService studentService,
                             CourseService courseService) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentService = studentService;
        this.courseService = courseService;
    }

    @Transactional
    public EnrollmentDTO enroll(Long studentId, Long courseId) {
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already enrolled in this course");
        }

        var student = studentService.findById(studentId);
        var course = courseService.findById(courseId);

        var enrollment = new Enrollment(student, course);
        enrollment = enrollmentRepository.save(enrollment);
        return toDTO(enrollment);
    }

    public List<EnrollmentDTO> getEnrollmentsForStudent(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(this::toDTO)
                .toList();
    }

    public List<EnrollmentDTO> getEnrollmentsForCourse(Long courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public EnrollmentDTO updateGrade(Long studentId, Long courseId, Double grade) {
        var enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        if (grade < 0.0 || grade > 4.0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grade must be between 0.0 and 4.0");
        }

        enrollment.setGrade(grade);
        enrollment.setStatus(Enrollment.Status.COMPLETED);
        enrollment = enrollmentRepository.save(enrollment);

        studentService.recalculateGpa(studentId);

        return toDTO(enrollment);
    }

    @Transactional
    public void drop(Long studentId, Long courseId) {
        var enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        enrollment.setStatus(Enrollment.Status.DROPPED);
        enrollmentRepository.save(enrollment);

        studentService.recalculateGpa(studentId);
    }

    private EnrollmentDTO toDTO(Enrollment e) {
        return new EnrollmentDTO(
                e.getId(),
                e.getCourse().getId(),
                e.getCourse().getName(),
                e.getCourse().getCredits(),
                e.getGrade(),
                e.getStatus().name(),
                e.getEnrolledAt()
        );
    }
}
