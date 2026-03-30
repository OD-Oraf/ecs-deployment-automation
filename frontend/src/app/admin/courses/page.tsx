"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getStudents,
  assignGrade,
  deleteStudent,
} from "@/lib/api";
import { CourseDTO, StudentDTO } from "@/lib/types";
import { Shield, Plus, Pencil, Trash2, Users, Star } from "lucide-react";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"courses" | "students">("courses");
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Course form
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState({ name: "", description: "", credits: "3" });

  // Grade form
  const [gradeForm, setGradeForm] = useState<{
    courseId: number;
    studentId: number;
    grade: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([getCourses(), getStudents()]);
      setCourses(c);
      setStudents(s);
    } catch {
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      if (editingCourseId) {
        await updateCourse(editingCourseId, {
          name: courseForm.name,
          description: courseForm.description,
          credits: parseInt(courseForm.credits),
        });
        setMessage("Course updated");
      } else {
        await createCourse({
          name: courseForm.name,
          description: courseForm.description,
          credits: parseInt(courseForm.credits),
        });
        setMessage("Course created");
      }
      setShowCourseForm(false);
      setEditingCourseId(null);
      setCourseForm({ name: "", description: "", credits: "3" });
      loadData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleEditCourse = (course: CourseDTO) => {
    setCourseForm({
      name: course.name,
      description: course.description,
      credits: String(course.credits),
    });
    setEditingCourseId(course.id);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Delete this course?")) return;
    try {
      await deleteCourse(id);
      setMessage("Course deleted");
      loadData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm("Delete this student?")) return;
    try {
      await deleteStudent(id);
      setMessage("Student deleted");
      loadData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleAssignGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm) return;
    try {
      await assignGrade(gradeForm.courseId, gradeForm.studentId, parseFloat(gradeForm.grade));
      setMessage("Grade assigned");
      setGradeForm(null);
      loadData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to assign grade");
    }
  };

  if (authLoading || loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Shield className="h-5 w-5 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.includes("fail") || message.includes("Failed")
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("courses")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "courses"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Courses ({courses.length})
        </button>
        <button
          onClick={() => setTab("students")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "students"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Students ({students.length})
        </button>
      </div>

      {tab === "courses" && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setShowCourseForm(true);
              setEditingCourseId(null);
              setCourseForm({ name: "", description: "", credits: "3" });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </button>

          {showCourseForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">
                {editingCourseId ? "Edit Course" : "New Course"}
              </h3>
              <form onSubmit={handleCreateCourse} className="space-y-3">
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="Course name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <textarea
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, description: e.target.value })
                  }
                  placeholder="Description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
                <input
                  type="number"
                  value={courseForm.credits}
                  onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                  placeholder="Credits"
                  min={1}
                  max={6}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {editingCourseId ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCourseForm(false);
                      setEditingCourseId(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Credits</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Enrolled</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-gray-500">{c.id}</td>
                    <td className="py-2.5 px-4 font-medium">{c.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-gray-400" />
                        {c.credits}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {c.enrolledCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditCourse(c)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "students" && (
        <div className="space-y-4">
          {gradeForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Assign Grade</h3>
              <form onSubmit={handleAssignGrade} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course ID</label>
                  <input
                    type="number"
                    value={gradeForm.courseId}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, courseId: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade (0.0 - 4.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={gradeForm.grade}
                    onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Assign
                </button>
                <button
                  type="button"
                  onClick={() => setGradeForm(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Username</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">GPA</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Courses</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-gray-500">{s.id}</td>
                    <td className="py-2.5 px-4 font-medium">{s.name}</td>
                    <td className="py-2.5 px-4 text-gray-500">@{s.username}</td>
                    <td className="py-2.5 px-4 text-gray-500">{s.email}</td>
                    <td className="py-2.5 px-4">{s.gpa.toFixed(2)}</td>
                    <td className="py-2.5 px-4">{s.enrollments.length}</td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setGradeForm({
                              courseId: 1,
                              studentId: s.id,
                              grade: "",
                            })
                          }
                          className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                        >
                          Grade
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
