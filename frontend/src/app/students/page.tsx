"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStudents, searchStudents } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { StudentDTO } from "@/lib/types";
import { Users, Search, GraduationCap } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
      return;
    }
    if (isLoggedIn) loadStudents();
  }, [isLoggedIn, authLoading, router]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      loadStudents();
      return;
    }
    setLoading(true);
    try {
      const data = await searchStudents(search);
      setStudents(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Users className="h-5 w-5 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold">Student Directory</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              loadStudents();
            }}
            className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No students found</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">@{student.username}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{student.email}</p>
              {student.bio && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{student.bio}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  GPA: {student.gpa.toFixed(2)}
                </span>
                <span>{student.enrollments.length} courses</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    student.role === "ADMIN"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {student.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
