package com.in28minutes.springboot.dto;

public record CourseDTO(
        Long id,
        String name,
        String description,
        int credits,
        int enrolledCount
) {}
