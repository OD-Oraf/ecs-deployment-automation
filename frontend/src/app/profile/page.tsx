"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getMyEnrollments, updateMyProfile, dropCourse } from "@/lib/api";
import { EnrollmentDTO } from "@/lib/types";
import { User, BookOpen, Save, X, GraduationCap } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoggedIn, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", email: "", bio: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
      return;
    }
    if (user) {
      setForm({
        name: user.name,
        age: String(user.age),
        email: user.email,
        bio: user.bio || "",
      });
      loadEnrollments();
    }
  }, [user, isLoggedIn, authLoading, router]);

  const loadEnrollments = async () => {
    try {
      const data = await getMyEnrollments();
      setEnrollments(data);
    } catch {
      // handle error
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await updateMyProfile({
        name: form.name,
        age: parseInt(form.age),
        email: form.email,
        bio: form.bio || undefined,
      });
      await refreshUser();
      setEditing(false);
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async (courseId: number) => {
    if (!confirm("Are you sure you want to drop this course?")) return;
    try {
      await dropCourse(courseId);
      setMessage("Course dropped");
      loadEnrollments();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to drop course");
    }
  };

  if (authLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <User className="h-5 w-5 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.includes("success") || message.includes("updated") || message.includes("dropped")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                min={16}
                max={120}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{user.name}</h2>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Edit Profile
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="mt-1">{user.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Age</dt>
                <dd className="mt-1">{user.age}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">GPA</dt>
                <dd className="mt-1 flex items-center gap-1">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  {user.gpa.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Role</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </dd>
              </div>
              {user.bio && (
                <div className="col-span-2">
                  <dt className="font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1">{user.bio}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">My Enrollments</h2>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-sm text-gray-500">You are not enrolled in any courses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Course</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Credits</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Grade</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Enrolled</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium">{e.courseName}</td>
                    <td className="py-2 px-3">{e.credits}</td>
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
                    <td className="py-2 px-3 text-right">
                      {e.status === "ENROLLED" && (
                        <button
                          onClick={() => handleDrop(e.courseId)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Drop
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
