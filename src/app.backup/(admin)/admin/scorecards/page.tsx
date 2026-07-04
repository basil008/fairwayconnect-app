'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader } from '@/components/AdminAuth';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  location: string;
}

interface HoleData {
  hole_number: number;
  par: number;
  stroke_index: number;
}

interface CourseScorecard {
  course_name: string;
  holes: number;
  total_par: number;
}

export default function AdminScorecardsPage() {
  const { isAuth, checking } = useAdminAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [scorecards, setScorecards] = useState<CourseScorecard[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [holes, setHoles] = useState<HoleData[]>(
    Array.from({ length: 18 }, (_, i) => ({
      hole_number: i + 1,
      par: 4,
      stroke_index: i + 1
    }))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [metadata, setMetadata] = useState<{
    slope_rating: number;
    course_rating: number;
    tee_color: string;
  }>({ slope_rating: 128, course_rating: 72.0, tee_color: 'White' });

  const selectedCourseData = courses.length > 0 ? courses.find(c => c.id === selectedCourse) : undefined;

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(setCourses)
      .catch(console.error);
    
    fetch('/api/course-scorecards/list')
      .then(r => r.json())
      .then(data => setScorecards(data.scorecards || []))
      .catch(console.error);
  }, []);

  // Load existing scorecard when course selected
  useEffect(() => {
    if (!selectedCourseData) return;

    fetch(`/api/course-scorecards?course=${encodeURIComponent(selectedCourseData.name)}`)
      .then(r => r.json())
      .then(data => {
        if (data.exists && data.holes) {
          setHoles(data.holes.map((h: any) => ({
            hole_number: h.hole_number,
            par: h.par,
            stroke_index: h.stroke_index
          })));
          if (data.metadata) {
            setMetadata({
              slope_rating: data.metadata.slope_rating || 128,
              course_rating: data.metadata.course_rating || 72.0,
              tee_color: data.metadata.tee_color || 'White'
            });
          }
          setMessage({ type: 'info', text: `Loaded existing scorecard for ${selectedCourseData.name}` });
        } else {
          setHoles(Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 4,
            stroke_index: i + 1
          })));
          setMessage(null);
        }
      })
      .catch(() => {
        setHoles(Array.from({ length: 18 }, (_, i) => ({
          hole_number: i + 1,
          par: 4,
          stroke_index: i + 1
        })));
      });
  }, [selectedCourseData]);

  if (checking) return <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center"><p>Loading...</p></div>;
  if (!isAuth) return null;

  const updateHole = (index: number, field: keyof HoleData, value: number) => {
    const newHoles = [...holes];
    newHoles[index] = { ...newHoles[index], [field]: value };
    setHoles(newHoles);
  };

  const validateScorecard = () => {
    const errors: string[] = [];
    
    // Check stroke indexes are unique and 1-18
    const siSet = new Set(holes.map(h => h.stroke_index));
    if (siSet.size !== 18) {
      errors.push('Stroke indexes must be unique (1-18)');
    }

    const invalidSI = holes.find(h => h.stroke_index < 1 || h.stroke_index > 18);
    if (invalidSI) {
      errors.push('Stroke indexes must be between 1-18');
    }

    // Check pars are 3, 4, or 5
    const invalidPar = holes.find(h => ![3, 4, 5].includes(h.par));
    if (invalidPar) {
      errors.push('Par must be 3, 4, or 5');
    }

    return errors;
  };

  const saveScorecard = async () => {
    if (!selectedCourse) {
      setMessage({ type: 'error', text: 'Please select a course' });
      return;
    }

    const errors = validateScorecard();
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join('; ') });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/course-scorecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: selectedCourseData?.name,
          holes,
          metadata
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `✅ Saved scorecard for ${selectedCourseData?.name}!` });
        // Refresh list
        fetch('/api/course-scorecards/list')
          .then(r => r.json())
          .then(data => setScorecards(data.scorecards || []));
        
        setTimeout(() => {
          setSelectedCourse('');
          setHoles(Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 4,
            stroke_index: i + 1
          })));
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Error saving scorecard' });
    } finally {
      setSaving(false);
    }
  };

  const quickFillPars = (pattern: 'balanced' | 'long' | 'short') => {
    const newHoles = [...holes];
    if (pattern === 'balanced') {
      [1, 4, 11, 14].forEach(i => newHoles[i].par = 3);
      [2, 7, 12, 16].forEach(i => newHoles[i].par = 5);
    } else if (pattern === 'long') {
      [1, 4, 11, 14].forEach(i => newHoles[i].par = 3);
      [2, 7, 12, 13, 16].forEach(i => newHoles[i].par = 5);
    } else {
      [1, 4, 7, 11, 14].forEach(i => newHoles[i].par = 3);
      [2, 7, 16].forEach(i => newHoles[i].par = 5);
    }
    setHoles(newHoles);
  };

  const frontNinePar = holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0);
  const backNinePar = holes.slice(9, 18).reduce((sum, h) => sum + h.par, 0);
  const totalPar = frontNinePar + backNinePar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/settings" className="text-sm text-fairway-600 hover:text-fairway-800">
            ← Back to Settings
          </Link>
        </div>

        {/* Existing Scorecards List */}
        {scorecards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Existing Scorecards</h2>
            <p className="text-sm text-gray-500 mb-4">One scorecard per course - works for all tees (SI and Par are the same)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scorecards.map((sc, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-fairway-800">{sc.course_name}</h3>
                      <p className="text-xs text-gray-500">All tees</p>
                    </div>
                    <span className="text-2xl">⛳</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div className="text-center bg-gray-50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">Holes</div>
                      <div className="font-bold text-gray-900">{sc.holes}</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">Par</div>
                      <div className="font-bold text-fairway-800">{sc.total_par}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📋 Create/Edit Scorecard</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter Par and Stroke Index for each hole (same for all tees)
          </p>

          {/* Course Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">Golf Course</label>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full md:w-1/2 border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none"
            >
              <option value="">-- Select Course --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <>
              {/* Course Metadata */}
              <div className="mb-6 p-5 bg-gradient-to-r from-fairway-50 to-green-50 rounded-xl border border-fairway-200">
                <h3 className="font-bold text-gray-800 mb-3">🏌️ Course Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Tee Color</label>
                    <select
                      value={metadata.tee_color}
                      onChange={e => setMetadata({...metadata, tee_color: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-fairway-600 focus:outline-none"
                    >
                      <option value="White">White</option>
                      <option value="Yellow">Yellow</option>
                      <option value="Red">Red</option>
                      <option value="Blue">Blue</option>
                      <option value="Black">Black</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Slope Rating</label>
                    <input
                      type="number"
                      value={metadata.slope_rating}
                      onChange={e => setMetadata({...metadata, slope_rating: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-fairway-600 focus:outline-none"
                      min="55"
                      max="155"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Course Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      value={metadata.course_rating}
                      onChange={e => setMetadata({...metadata, course_rating: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-fairway-600 focus:outline-none"
                      min="60"
                      max="85"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ These values are locked when the scorecard is loaded into an event
                </p>
              </div>

              {/* Quick Fill Buttons */}
              <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Fill Par Values:</p>
                <div className="flex gap-2">
                  <button onClick={() => quickFillPars('balanced')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Balanced (Par 72)
                  </button>
                  <button onClick={() => quickFillPars('long')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Championship (Par 73)
                  </button>
                  <button onClick={() => quickFillPars('short')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Short (Par 71)
                  </button>
                </div>
              </div>

              {/* Scorecard Entry Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-fairway-800 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Hole</th>
                      <th className="px-3 py-2">Par</th>
                      <th className="px-3 py-2">Stroke Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holes.slice(0, 9).map((hole, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-fairway-800">{hole.hole_number}</td>
                        <td className="px-3 py-2">
                          <select value={hole.par} onChange={e => updateHole(i, 'par', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1">
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" max="18" value={hole.stroke_index}
                            onChange={e => updateHole(i, 'stroke_index', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-center" />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-3 py-2">OUT</td>
                      <td className="px-3 py-2 text-center">{frontNinePar}</td>
                      <td className="px-3 py-2 text-center">-</td>
                    </tr>

                    {holes.slice(9, 18).map((hole, i) => (
                      <tr key={i + 9} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-fairway-800">{hole.hole_number}</td>
                        <td className="px-3 py-2">
                          <select value={hole.par} onChange={e => updateHole(i + 9, 'par', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1">
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" max="18" value={hole.stroke_index}
                            onChange={e => updateHole(i + 9, 'stroke_index', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-center" />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-3 py-2">IN</td>
                      <td className="px-3 py-2 text-center">{backNinePar}</td>
                      <td className="px-3 py-2 text-center">-</td>
                    </tr>
                    <tr className="bg-fairway-900 text-white font-bold">
                      <td className="px-3 py-2">TOTAL</td>
                      <td className="px-3 py-2 text-center">{totalPar}</td>
                      <td className="px-3 py-2 text-center">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {message && (
                <div className={`mt-4 p-4 rounded-xl ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => window.location.reload()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                  Reset Form
                </button>
                <button onClick={saveScorecard} disabled={saving}
                  className="px-6 py-3 bg-fairway-800 text-white rounded-xl font-medium hover:bg-fairway-900 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : 
                   (scorecards.some(sc => sc.course_name === selectedCourseData?.name) ? '💾 Update Scorecard' : '💾 Save Scorecard')
                  }
                </button>
              </div>
            </>
          )}

          {!selectedCourse && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">👆 Select a course to begin</p>
              <p className="text-sm">Enter Par and Stroke Index for all 18 holes</p>
              <p className="text-xs text-gray-400 mt-2">Note: Same scorecard works for all tees (White, Yellow, Red)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
