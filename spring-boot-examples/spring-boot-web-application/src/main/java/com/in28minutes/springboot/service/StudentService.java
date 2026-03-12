package com.in28minutes.springboot.service;

import com.in28minutes.springboot.dto.*;
import com.in28minutes.springboot.model.Student;
import com.in28minutes.springboot.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public StudentDTO getStudentById(Long id) {
        return toDTO(findById(id));
    }

    public StudentDTO getStudentByUsername(String username) {
        var student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        return toDTO(student);
    }

    public List<StudentDTO> searchStudents(String name) {
        return studentRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public StudentDTO register(RegisterRequest request) {
        if (studentRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (studentRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        var student = new Student(
                request.name(),
                request.age(),
                request.email(),
                request.username(),
                passwordEncoder.encode(request.password())
        );
        return toDTO(studentRepository.save(student));
    }

    @Transactional
    public StudentDTO updateProfile(String username, UpdateProfileRequest request) {
        var student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        if (request.name() != null) student.setName(request.name());
        if (request.age() != null) student.setAge(request.age());
        if (request.email() != null) {
            if (!student.getEmail().equals(request.email()) && studentRepository.existsByEmail(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }
            student.setEmail(request.email());
        }
        if (request.bio() != null) student.setBio(request.bio());

        return toDTO(studentRepository.save(student));
    }

    @Transactional
    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }
        studentRepository.deleteById(id);
    }

    public Student findById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }

    @Transactional
    public void recalculateGpa(Long studentId) {
        var student = findById(studentId);
        var graded = student.getEnrollments().stream()
                .filter(e -> e.getGrade() != null)
                .toList();

        if (graded.isEmpty()) {
            student.setGpa(0.0);
        } else {
            double totalPoints = 0;
            int totalCredits = 0;
            for (var enrollment : graded) {
                totalPoints += enrollment.getGrade() * enrollment.getCourse().getCredits();
                totalCredits += enrollment.getCourse().getCredits();
            }
            student.setGpa(Math.round((totalPoints / totalCredits) * 100.0) / 100.0);
        }
        studentRepository.save(student);
    }

    private StudentDTO toDTO(Student s) {
        var enrollments = s.getEnrollments().stream()
                .map(e -> new EnrollmentDTO(
                        e.getId(),
                        e.getCourse().getId(),
                        e.getCourse().getName(),
                        e.getCourse().getCredits(),
                        e.getGrade(),
                        e.getStatus().name(),
                        e.getEnrolledAt()
                ))
                .toList();

        return new StudentDTO(
                s.getId(), s.getName(), s.getAge(), s.getEmail(),
                s.getUsername(), s.getBio(), s.getGpa(), s.getRole().name(),
                enrollments
        );
    }
}