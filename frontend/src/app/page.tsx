"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { BookOpen, Users, UserPlus, GraduationCap, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="space-y-16">
      <section className="text-center py-16">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 rounded-2xl">
            <GraduationCap className="h-12 w-12 text-indigo-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Student Services Portal</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Browse courses, manage enrollments, and track your academic progress — all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Courses
            <ArrowRight className="h-4 w-4" />
          </Link>
          {!isLoggedIn && (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Course Catalog</h3>
          <p className="text-gray-600 text-sm">
            Explore available courses, search by name, and view course details including credits and enrollment counts.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
            <UserPlus className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Easy Enrollment</h3>
          <p className="text-gray-600 text-sm">
            Enroll in courses with a single click, view your current enrollments, and manage your course schedule.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Student Directory</h3>
          <p className="text-gray-600 text-sm">
            View student profiles, search by name, and see academic progress including GPA and enrollment history.
          </p>
        </div>
      </section>
    </div>
  );
}
