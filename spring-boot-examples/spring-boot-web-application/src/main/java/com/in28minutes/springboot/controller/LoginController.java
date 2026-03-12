package com.in28minutes.springboot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class LoginController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        return ResponseEntity.ok(Map.of(
                "application", "Student Services API",
                "version", "2.0",
                "endpoints", Map.of(
                        "auth", "/api/auth/register, /api/auth/login",
                        "students", "/api/students, /api/students/me, /api/students/search?name=",
                        "courses", "/api/courses, /api/courses/search?name=",
                        "enrollments", "/api/enrollments/enroll/{courseId}, /api/enrollments/my-courses",
                        "health", "/health",
                        "h2Console", "/h2-console"
                )
        ));
    }
}