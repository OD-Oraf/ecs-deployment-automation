package com.in28minutes.springboot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.in28minutes.springboot.dto.UpdateProfileRequest;
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
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllStudentsRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllStudentsWithAuth() throws Exception {
        mockMvc.perform(get("/api/students")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(4)));
    }

    @Test
    void getStudentById() throws Exception {
        mockMvc.perform(get("/api/students/2")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ranga"))
                .andExpect(jsonPath("$.name").value("Ranga Karanam"));
    }

    @Test
    void getStudentByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/students/999")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isNotFound());
    }

    @Test
    void getMyProfile() throws Exception {
        mockMvc.perform(get("/api/students/me")
                        .with(httpBasic("alice", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.name").value("Alice Johnson"))
                .andExpect(jsonPath("$.age").value(22))
                .andExpect(jsonPath("$.email").value("alice@university.edu"));
    }

    @Test
    void updateMyProfile() throws Exception {
        var update = new UpdateProfileRequest(null, null, null, "Updated bio for Bob");

        mockMvc.perform(put("/api/students/me")
                        .with(httpBasic("bob", "password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Updated bio for Bob"));
    }

    @Test
    void updateMyProfileNameAndAge() throws Exception {
        var update = new UpdateProfileRequest("Alice Updated", 23, null, null);

        mockMvc.perform(put("/api/students/me")
                        .with(httpBasic("alice", "password123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice Updated"))
                .andExpect(jsonPath("$.age").value(23));
    }

    @Test
    void searchStudentsByName() throws Exception {
        mockMvc.perform(get("/api/students/search")
                        .param("name", "Ranga")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].username").value("ranga"));
    }

    @Test
    void searchStudentsNoResults() throws Exception {
        mockMvc.perform(get("/api/students/search")
                        .param("name", "NonExistent")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void deleteStudentAsAdminSucceeds() throws Exception {
        mockMvc.perform(delete("/api/students/5")
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteStudentAsStudentForbidden() throws Exception {
        mockMvc.perform(delete("/api/students/3")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentProfileIncludesEnrollments() throws Exception {
        mockMvc.perform(get("/api/students/me")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrollments").isArray())
                .andExpect(jsonPath("$.enrollments.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void studentProfileIncludesGpa() throws Exception {
        mockMvc.perform(get("/api/students/me")
                        .with(httpBasic("ranga", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gpa").isNumber());
    }
}
