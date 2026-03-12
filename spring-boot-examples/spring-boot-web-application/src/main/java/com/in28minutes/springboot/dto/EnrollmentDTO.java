package com.in28minutes.springboot.dto;

import java.time.LocalDateTime;

public record EnrollmentDTO(
        Long id,
        Long courseId,
        String courseName,
        int credits,
        Double grade,
        String status,
        LocalDateTime enrolledAt
) {}
