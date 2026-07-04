'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader } from '@/components/AdminAuth';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  location: string;
  hole_type: '18' | '27' | '36';
  nine_names?: string;
}

export default function AdminCoursesPage() {
  const { isAuth, checking } = useAdminAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    hole_type: '18' as '18' | '27' | '36',
    nine_names: '',
    tee_colors: 'White,Yellow,Red'
  });

  useEffect(() => {
    if (isAuth) {
      loadCourses();
    }
  }, [isAuth]);

  const loadCourses = () => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(setCourses)
      .catch(console.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingCourse?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingCourse ? 'Course updated!' : 'Course created!' });
        setShowForm(false);
        setEditingCourse(null);
        setFormData({
          name: '',
          location: '',
          hole_type: '18',
          nine_names: '',
          tee_colors: 'White,Yellow,Red'
        });
        loadCourses();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save course' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving course' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      location: course.location || '',
      hole_type: course.hole_type,
      nine_names: course.nine_names || '',
      tee_colors: 'White,Yellow,Red' // Default, we'll enhance this later
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Course deleted' });
        loadCourses();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting course' });
    }
  };

  if (checking) return <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center"><p>Loading...</p></div>;
  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <AdminHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin/settings" className="text-sm text-fairway-700 hover:text-fairway-900 mb-2 inline-block">
              ← Back to Settings
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">⛳ Manage Golf Courses</h1>
            <p className="text-gray-600 mt-1">Add and manage golf courses for your society</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingCourse(null);
              setFormData({
                name: '',
                location: '',
                hole_type: '18',
                nine_names: '',
                tee_colors: 'White,Yellow,Red'
              });
            }}
            className="bg-fairway-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-fairway-900 transition-colors"
          >
            + Add New Course
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl mb-6 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Course Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Malahide Golf Club"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Dublin, Ireland"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Course Type *</label>
                <select
                  value={formData.hole_type}
                  onChange={e => setFormData({ ...formData, hole_type: e.target.value as '18' | '27' | '36' })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none"
                >
                  <option value="18">18 Holes</option>
                  <option value="27">27 Holes (3 x 9)</option>
                  <option value="36">36 Holes (4 x 9)</option>
                </select>
              </div>

              {(formData.hole_type === '27' || formData.hole_type === '36') && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Nine Names</label>
                  <input
                    type="text"
                    value={formData.nine_names}
                    onChange={e => setFormData({ ...formData, nine_names: e.target.value })}
                    placeholder="e.g., Blue,Red,Yellow or River,Orchard,Meadow"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list. For 27 holes: 3 names. For 36 holes: 4 names.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Tee Colors</label>
                <input
                  type="text"
                  value={formData.tee_colors}
                  onChange={e => setFormData({ ...formData, tee_colors: e.target.value })}
                  placeholder="e.g., White,Yellow,Red,Blue"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated list of tee colors available at this course
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-fairway-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-fairway-900 disabled:bg-gray-300 transition-colors"
                >
                  {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCourse(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Course List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-fairway-50 to-green-50 border-b border-fairway-100">
            <h2 className="text-xl font-bold text-gray-900">Golf Courses ({courses.length})</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {courses.map(course => (
              <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{course.name}</h3>
                    {course.location && (
                      <p className="text-sm text-gray-600 mt-1">📍 {course.location}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm bg-fairway-100 text-fairway-800 px-3 py-1 rounded-full font-medium">
                        {course.hole_type} Holes
                      </span>
                      {course.nine_names && (
                        <span className="text-sm text-gray-600">
                          Nines: {course.nine_names}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(course)}
                      className="text-sm text-fairway-700 hover:text-fairway-900 font-medium px-4 py-2 rounded-lg hover:bg-fairway-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {courses.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg">No courses yet</p>
                <p className="text-sm mt-1">Click "Add New Course" to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
