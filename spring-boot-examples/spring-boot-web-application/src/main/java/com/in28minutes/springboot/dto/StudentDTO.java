package com.in28minutes.springboot.dto;

import java.util.List;

public record StudentDTO(
        Long id,
        String name,
        int age,
        String email,
        String username,
        String bio,
        double gpa,
        String role,
        List<EnrollmentDTO> enrollments
) {}
