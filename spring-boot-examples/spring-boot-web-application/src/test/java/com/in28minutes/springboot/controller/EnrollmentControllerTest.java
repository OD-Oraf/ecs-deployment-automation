package com.in28minutes.springboot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EnrollmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void enrollInCourse() throws Exception {
        // ranga (id=2) enrolls in course 4 (DSA) - not already enrolled
        mockMvc.perform(post("/api/enrollments/enroll/4")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courseName").value("Data Structures & Algorithms"))
                .andExpect(jsonPath("$.status").value("ENROLLED"));
    }

    @Test
    void enrollInCourseAlreadyEnrolledFails() throws Exception {
        // ranga (id=2) is already enrolled in course 1
        mockMvc.perform(post("/api/enrollments/enroll/1")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isConflict());
    }

    @Test
    void enrollWithoutAuthUnauthorized() throws Exception {
        mockMvc.perform(post("/api/enrollments/enroll/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMyCourses() throws Exception {
        mockMvc.perform(get("/api/enrollments/my-courses")
                        .with(httpBasic("alice", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void assignGradeAsAdmin() throws Exception {
        // Admin assigns grade to alice (id=3) for course 4
        mockMvc.perform(put("/api/enrollments/grade/4")
                        .param("studentId", "3")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("grade", 3.6))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grade").value(3.6))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void assignGradeAsStudentForbidden() throws Exception {
        mockMvc.perform(put("/api/enrollments/grade/1")
                        .param("studentId", "2")
                        .with(httpBasic("ranga", "password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("grade", 3.5))))
                .andExpect(status().isForbidden());
    }

    @Test
    void assignInvalidGradeFails() throws Exception {
        mockMvc.perform(put("/api/enrollments/grade/5")
                        .param("studentId", "3")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("grade", 5.0))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dropCourse() throws Exception {
        // bob (id=4) drops course 6
        mockMvc.perform(put("/api/enrollments/drop/6")
                        .with(httpBasic("bob", "password123")))
                .andExpect(status().isNoContent());
    }

    @Test
    void dropCourseNotEnrolledFails() throws Exception {
        // bob (id=4) is not enrolled in course 2
        mockMvc.perform(put("/api/enrollments/drop/2")
                        .with(httpBasic("bob", "password123")))
                .andExpect(status().isNotFound());
    }

    @Test
    void gpaRecalculatedAfterGrade() throws Exception {
        // Assign a grade, then check the student's GPA was updated
        mockMvc.perform(put("/api/enrollments/grade/5")
                        .param("studentId", "3")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("grade", 4.0))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/students/me")
                        .with(httpBasic("alice", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gpa").value(org.hamcrest.Matchers.greaterThan(0.0)));
    }
}
