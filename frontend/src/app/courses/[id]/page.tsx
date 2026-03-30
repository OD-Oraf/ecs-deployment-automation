"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourseById, getStudentsInCourse, enrollInCourse } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { CourseDTO, EnrollmentDTO } from "@/lib/types";
import { BookOpen, ArrowLeft, Users, Star, Plus } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [course, setCourse] = useState<CourseDTO | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getCourseById(courseId);
        setCourse(c);
        if (isLoggedIn) {
          try {
            const e = await getStudentsInCourse(courseId);
            setEnrollments(e);
          } catch {
            // user may not have permission
          }
        }
      } catch {
        setMessage("Course not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, isLoggedIn]);

  const handleEnroll = async () => {
    setMessage("");
    try {
      await enrollInCourse(courseId);
      setMessage("Successfully enrolled!");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Enrollment failed");
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!course) return <div className="text-center py-12 text-gray-500">Course not found</div>;

  return (
    <div className="space-y-6">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">{course.name}</h1>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleEnroll}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Enroll
            </button>
          )}
        </div>

        <p className="text-gray-600 mb-6">{course.description}</p>

        <div className="flex gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4" />
            {course.credits} credits
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {course.enrolledCount} students enrolled
          </span>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("Success")
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {enrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Enrolled Students</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Student</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Grade</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Enrolled At</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="py-2 px-3">{e.courseName}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          e.status === "ENROLLED"
                            ? "bg-green-100 text-green-700"
                            : e.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{e.grade !== null ? e.grade.toFixed(1) : "—"}</td>
                    <td className="py-2 px-3 text-gray-500">
                      {new Date(e.enrolledAt).toLocaleDateString()}
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
