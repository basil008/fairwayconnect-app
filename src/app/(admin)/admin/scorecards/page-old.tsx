'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader } from '@/components/AdminAuth';
import Link from 'next/link';

interface CourseTee {
  id: string;
  tee_color: string;
  slope_rating: number;
  course_rating: number;
  par: number;
}

interface Course {
  id: string;
  name: string;
  location: string;
  tees: CourseTee[];
}

interface HoleData {
  hole_number: number;
  par: number;
  stroke_index: number;
  yardage: number;
}

interface MasterScorecard {
  course_name: string;
  tee_color: string;
  holes: number;
  total_par: number;
  total_yards: number;
}

export default function AdminScorecardsPage() {
  const { isAuth, checking } = useAdminAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [masterScorecards, setMasterScorecards] = useState<MasterScorecard[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTee, setSelectedTee] = useState<string>('');
  const [holes, setHoles] = useState<HoleData[]>(
    Array.from({ length: 18 }, (_, i) => ({
      hole_number: i + 1,
      par: 4,
      stroke_index: i + 1,
      yardage: 0
    }))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Compute these before any conditional returns (safe even if courses is empty)
  const selectedCourseData = courses.length > 0 ? courses.find(c => c.id === selectedCourse) : undefined;
  const selectedTeeData = selectedCourseData?.tees.find(t => t.id === selectedTee);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(setCourses)
      .catch(console.error);
    
    // Load existing master scorecards
    fetch('/api/master-scorecards/list')
      .then(r => r.json())
      .then(data => setMasterScorecards(data.scorecards || []))
      .catch(console.error);
  }, []);

  // Load existing scorecard when course/tee selected
  useEffect(() => {
    if (!selectedCourseData || !selectedTeeData) return;

    // Check if master scorecard exists for this course/tee
    fetch(`/api/master-scorecards?course=${encodeURIComponent(selectedCourseData.name)}&tee=${encodeURIComponent(selectedTeeData.tee_color)}`)
      .then(r => r.json())
      .then(data => {
        if (data.exists && data.holes) {
          // Load existing holes
          setHoles(data.holes.map((h: any) => ({
            hole_number: h.hole_number,
            par: h.par,
            stroke_index: h.stroke_index,
            yardage: h.yardage
          })));
          setMessage({ type: 'info', text: `Loaded existing scorecard for ${selectedCourseData.name} ${selectedTeeData.tee_color}` });
        } else {
          // Reset to defaults for new scorecard
          setHoles(Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 4,
            stroke_index: i + 1,
            yardage: 0
          })));
          setMessage(null);
        }
      })
      .catch(() => {
        // Reset to defaults on error
        setHoles(Array.from({ length: 18 }, (_, i) => ({
          hole_number: i + 1,
          par: 4,
          stroke_index: i + 1,
          yardage: 0
        })));
      });
  }, [selectedCourseData, selectedTeeData]);

  if (checking) return <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center"><p>Loading...</p></div>;
  if (!isAuth) return null;

  const updateHole = (index: number, field: keyof HoleData, value: number) => {
    const newHoles = [...holes];
    newHoles[index] = { ...newHoles[index], [field]: value };
    setHoles(newHoles);
  };

  const validateScorecard = () => {
    const errors: string[] = [];
    
    // Check all holes have data
    const missingData = holes.filter(h => h.yardage === 0);
    if (missingData.length > 0) {
      errors.push(`${missingData.length} holes missing yardage`);
    }

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
    if (!selectedCourse || !selectedTee) {
      setMessage({ type: 'error', text: 'Please select a course and tee' });
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
      const response = await fetch('/api/master-scorecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: selectedCourseData?.name,
          teeColor: selectedTeeData?.tee_color,
          holes
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `✅ Saved ${selectedCourseData?.name} ${selectedTeeData?.tee_color} tees!` });
        // Reset form
        setTimeout(() => {
          setSelectedCourse('');
          setSelectedTee('');
          setHoles(Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 4,
            stroke_index: i + 1,
            yardage: 0
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
      // Typical: 4 Par 3s, 10 Par 4s, 4 Par 5s = Par 72
      [2, 5, 12, 15].forEach(i => newHoles[i].par = 3);
      [1, 7, 11, 16].forEach(i => newHoles[i].par = 5);
    } else if (pattern === 'long') {
      // Championship: 5 Par 5s, 9 Par 4s, 4 Par 3s = Par 73
      [2, 5, 12, 15].forEach(i => newHoles[i].par = 3);
      [1, 7, 11, 16, 17].forEach(i => newHoles[i].par = 5);
    } else {
      // Short: 5 Par 3s, 10 Par 4s, 3 Par 5s = Par 71
      [2, 5, 8, 12, 15].forEach(i => newHoles[i].par = 3);
      [1, 7, 16].forEach(i => newHoles[i].par = 5);
    }
    setHoles(newHoles);
  };

  const frontNinePar = holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0);
  const backNinePar = holes.slice(9, 18).reduce((sum, h) => sum + h.par, 0);
  const totalPar = frontNinePar + backNinePar;

  const frontNineYards = holes.slice(0, 9).reduce((sum, h) => sum + h.yardage, 0);
  const backNineYards = holes.slice(9, 18).reduce((sum, h) => sum + h.yardage, 0);
  const totalYards = frontNineYards + backNineYards;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-fairway-600 hover:text-fairway-800">
            ← Back to Admin
          </Link>
        </div>

        {/* Existing Scorecards List */}
        {masterScorecards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Existing Master Scorecards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterScorecards.map((sc, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-fairway-800">{sc.course_name}</h3>
                      <p className="text-sm text-gray-600">{sc.tee_color} Tees</p>
                    </div>
                    <span className="text-2xl">⛳</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                    <div className="text-center bg-gray-50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">Holes</div>
                      <div className="font-bold text-gray-900">{sc.holes}</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">Par</div>
                      <div className="font-bold text-fairway-800">{sc.total_par}</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-lg py-2">
                      <div className="text-xs text-gray-500">Yards</div>
                      <div className="font-bold text-gray-900">{sc.total_yards}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📋 Create New Master Scorecard</h1>
          <p className="text-sm text-gray-500 mb-6">
            Build a reusable scorecard for any course and tee combination
          </p>

          {/* Course & Tee Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Golf Course</label>
              <select
                value={selectedCourse}
                onChange={e => {
                  setSelectedCourse(e.target.value);
                  setSelectedTee('');
                }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none"
              >
                <option value="">-- Select Course --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Tee Colour</label>
              <select
                value={selectedTee}
                onChange={e => setSelectedTee(e.target.value)}
                disabled={!selectedCourse}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-fairway-600 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">-- Select Tee --</option>
                {selectedCourseData?.tees.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tee_color} (Par {t.par}, Slope {t.slope_rating})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Fill Buttons */}
          {selectedCourse && selectedTee && (
            <>
              <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Fill Par Values:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => quickFillPars('balanced')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Balanced (Par 72)
                  </button>
                  <button
                    onClick={() => quickFillPars('long')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Championship (Par 73)
                  </button>
                  <button
                    onClick={() => quickFillPars('short')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Short (Par 71)
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These are starting templates - adjust as needed for your course
                </p>
              </div>

              {/* Scorecard Entry Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-fairway-800 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Hole</th>
                      <th className="px-3 py-2">Par</th>
                      <th className="px-3 py-2">Stroke Index</th>
                      <th className="px-3 py-2">Yardage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Front 9 */}
                    {holes.slice(0, 9).map((hole, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-fairway-800">{hole.hole_number}</td>
                        <td className="px-3 py-2">
                          <select
                            value={hole.par}
                            onChange={e => updateHole(i, 'par', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1"
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            max="18"
                            value={hole.stroke_index}
                            onChange={e => updateHole(i, 'stroke_index', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={hole.yardage || ''}
                            onChange={e => updateHole(i, 'yardage', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-center"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-3 py-2">OUT</td>
                      <td className="px-3 py-2 text-center">{frontNinePar}</td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 text-center">{frontNineYards}</td>
                    </tr>

                    {/* Back 9 */}
                    {holes.slice(9, 18).map((hole, i) => (
                      <tr key={i + 9} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-fairway-800">{hole.hole_number}</td>
                        <td className="px-3 py-2">
                          <select
                            value={hole.par}
                            onChange={e => updateHole(i + 9, 'par', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1"
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            max="18"
                            value={hole.stroke_index}
                            onChange={e => updateHole(i + 9, 'stroke_index', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={hole.yardage || ''}
                            onChange={e => updateHole(i + 9, 'yardage', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-center"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-3 py-2">IN</td>
                      <td className="px-3 py-2 text-center">{backNinePar}</td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 text-center">{backNineYards}</td>
                    </tr>
                    <tr className="bg-fairway-900 text-white font-bold">
                      <td className="px-3 py-2">TOTAL</td>
                      <td className="px-3 py-2 text-center">{totalPar}</td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 text-center">{totalYards}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Messages */}
              {message && (
                <div className={`mt-4 p-4 rounded-xl ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Save Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Reset Form
                </button>
                <button
                  onClick={saveScorecard}
                  disabled={saving}
                  className="px-6 py-3 bg-fairway-800 text-white rounded-xl font-medium hover:bg-fairway-900 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 
                   (masterScorecards.some(sc => 
                     sc.course_name === selectedCourseData?.name && 
                     sc.tee_color === selectedTeeData?.tee_color
                   ) ? '💾 Update Master Scorecard' : '💾 Save Master Scorecard')
                  }
                </button>
              </div>
            </>
          )}

          {/* Instructions */}
          {!selectedCourse && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">👆 Select a course and tee to begin</p>
              <p className="text-sm">Enter all 18 holes with par, stroke index, and yardage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
