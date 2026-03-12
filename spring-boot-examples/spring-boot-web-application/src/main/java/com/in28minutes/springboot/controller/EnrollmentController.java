package com.in28minutes.springboot.controller;

import com.in28minutes.springboot.dto.EnrollmentDTO;
import com.in28minutes.springboot.service.EnrollmentService;
import com.in28minutes.springboot.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final StudentService studentService;

    public EnrollmentController(EnrollmentService enrollmentService, StudentService studentService) {
        this.enrollmentService = enrollmentService;
        this.studentService = studentService;
    }

    @PostMapping("/enroll/{courseId}")
    public ResponseEntity<EnrollmentDTO> enroll(@AuthenticationPrincipal UserDetails userDetails,
                                                 @PathVariable Long courseId) {
        var student = studentService.getStudentByUsername(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enroll(student.id(), courseId));
    }

    @GetMapping("/my-courses")
    public List<EnrollmentDTO> getMyCourses(@AuthenticationPrincipal UserDetails userDetails) {
        var student = studentService.getStudentByUsername(userDetails.getUsername());
        return enrollmentService.getEnrollmentsForStudent(student.id());
    }

    @PutMapping("/grade/{courseId}")
    public EnrollmentDTO updateGrade(@RequestParam Long studentId,
                                     @PathVariable Long courseId,
                                     @RequestBody Map<String, Double> body) {
        return enrollmentService.updateGrade(studentId, courseId, body.get("grade"));
    }

    @PutMapping("/drop/{courseId}")
    public ResponseEntity<Void> dropCourse(@AuthenticationPrincipal UserDetails userDetails,
                                            @PathVariable Long courseId) {
        var student = studentService.getStudentByUsername(userDetails.getUsername());
        enrollmentService.drop(student.id(), courseId);
        return ResponseEntity.noContent().build();
    }
}
