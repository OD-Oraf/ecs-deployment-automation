package com.in28minutes.springboot.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        @Min(16) @Max(120) int age,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Size(min = 6) String password
) {}
