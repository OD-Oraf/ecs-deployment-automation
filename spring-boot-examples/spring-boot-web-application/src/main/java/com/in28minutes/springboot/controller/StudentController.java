package com.in28minutes.springboot.controller;

import com.in28minutes.springboot.dto.StudentDTO;
import com.in28minutes.springboot.dto.UpdateProfileRequest;
import com.in28minutes.springboot.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public List<StudentDTO> getAllStudents() {
        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public StudentDTO getStudent(@PathVariable Long id) {
        return studentService.getStudentById(id);
    }

    @GetMapping("/search")
    public List<StudentDTO> searchStudents(@RequestParam String name) {
        return studentService.searchStudents(name);
    }

    @GetMapping("/me")
    public StudentDTO getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return studentService.getStudentByUsername(userDetails.getUsername());
    }

    @PutMapping("/me")
    public StudentDTO updateMyProfile(@AuthenticationPrincipal UserDetails userDetails,
                                      @Valid @RequestBody UpdateProfileRequest request) {
        return studentService.updateProfile(userDetails.getUsername(), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
