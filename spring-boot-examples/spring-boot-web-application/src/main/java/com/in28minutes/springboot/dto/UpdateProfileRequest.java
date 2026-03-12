package com.in28minutes.springboot.dto;

import jakarta.validation.constraints.*;

public record UpdateProfileRequest(
        @Size(min = 2, max = 100) String name,
        @Min(16) @Max(120) Integer age,
        @Email String email,
        @Size(max = 1000) String bio
) {}
