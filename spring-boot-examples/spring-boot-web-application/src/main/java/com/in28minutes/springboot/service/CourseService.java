package com.in28minutes.springboot.service;

import com.in28minutes.springboot.dto.CourseDTO;
import com.in28minutes.springboot.model.Course;
import com.in28minutes.springboot.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public CourseDTO getCourseById(Long id) {
        return toDTO(findById(id));
    }

    public List<CourseDTO> searchCourses(String name) {
        return courseRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::toDTO)
                .toList();
    }

    public CourseDTO createCourse(Course course) {
        if (courseRepository.findByName(course.getName()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course with this name already exists");
        }
        return toDTO(courseRepository.save(course));
    }

    public CourseDTO updateCourse(Long id, Course updated) {
        var course = findById(id);
        course.setName(updated.getName());
        course.setDescription(updated.getDescription());
        course.setCredits(updated.getCredits());
        return toDTO(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        courseRepository.deleteById(id);
    }

    public Course findById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private CourseDTO toDTO(Course c) {
        return new CourseDTO(
                c.getId(), c.getName(), c.getDescription(),
                c.getCredits(), c.getEnrollments().size()
        );
    }
}
