package com.in28minutes.springboot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.in28minutes.springboot.model.Course;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllCoursesWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(6)));
    }

    @Test
    void getCourseById() throws Exception {
        mockMvc.perform(get("/api/courses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Spring Boot Fundamentals"))
                .andExpect(jsonPath("$.credits").value(4))
                .andExpect(jsonPath("$.enrolledCount").isNumber());
    }

    @Test
    void getCourseByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/courses/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchCoursesByName() throws Exception {
        mockMvc.perform(get("/api/courses/search").param("name", "Spring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    void createCourseAsAdmin() throws Exception {
        var course = new Course("Kubernetes 101", "Intro to container orchestration", 3);

        mockMvc.perform(post("/api/courses")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(course)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Kubernetes 101"))
                .andExpect(jsonPath("$.credits").value(3));
    }

    @Test
    void createCourseAsStudentForbidden() throws Exception {
        var course = new Course("Forbidden Course", "Should not be created", 2);

        mockMvc.perform(post("/api/courses")
                        .with(httpBasic("ranga", "password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(course)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createCourseWithoutAuthUnauthorized() throws Exception {
        var course = new Course("No Auth Course", "Should fail", 2);

        mockMvc.perform(post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(course)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateCourseAsAdmin() throws Exception {
        var course = new Course("Spring MVC Updated", "Updated description", 4);

        mockMvc.perform(put("/api/courses/2")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(course)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Spring MVC Updated"))
                .andExpect(jsonPath("$.credits").value(4));
    }

    @Test
    void deleteCourseAsStudentForbidden() throws Exception {
        mockMvc.perform(delete("/api/courses/6")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getStudentsInCourse() throws Exception {
        mockMvc.perform(get("/api/courses/1/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }
}
