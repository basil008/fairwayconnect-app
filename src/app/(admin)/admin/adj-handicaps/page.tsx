'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth';

interface Deduction {
  id: string;
  member_name: string;
  first_name: string;
  year: number;
  year_starting_deduction: number;
  outing_1: number;
  outing_2: number;
  outing_3: number;
  outing_4: number;
  outing_5: number;
  outing_6: number;
  outing_7: number;
  outing_8: number;
  current_deductions: number;
}

export default function AdjHandicapsPage() {
  const { isAuth, checking, logout } = useAdminAuth();
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2026);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/deductions?year=${year}`)
      .then(r => r.json())
      .then(data => {
        console.log('Adj Hcp data:', data);
        // Convert API format to expected format
        const converted = (data.members || []).map((m: any) => {
          const fullName = (m.member_name || '').trim();
          const parts = fullName.split(' ').filter(p => p.length > 0);
          return {
          id: m.member_id,
          member_name: parts.slice(-1)[0] || fullName, // Last name
          first_name: parts.slice(0, -1).join(' ') || fullName, // First name(s)
          year: 2026,
          year_starting_deduction: m.year_starting_deduction || 0,
          outing_1: m.event_1 || 0,
          outing_2: m.event_2 || 0,
          outing_3: m.event_3 || 0,
          outing_4: m.event_4 || 0,
          outing_5: m.event_5 || 0,
          outing_6: m.event_6 || 0,
          outing_7: m.event_7 || 0,
          outing_8: m.event_8 || 0,
          current_deductions: m.net_adjustment
        };
        });
        // Sort by current deductions (most negative first)
        converted.sort((a: any, b: any) => a.current_deductions - b.current_deductions);
        setDeductions(converted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuth) return;
    loadData();
  }, [isAuth, year]);

  const handleCellChange = async (id: string, field: string, value: number) => {
    setSaving(id + field);
    await fetch('/api/deductions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, field, value }),
    });
    // Update local state
    setDeductions(prev => prev.map(d => {
      if (d.id !== id) return d;
      const updated = { ...d, [field]: value };
      // Recalculate current_deductions
      updated.current_deductions = updated.year_starting_deduction +
        updated.outing_1 + updated.outing_2 + updated.outing_3 + updated.outing_4 +
        updated.outing_5 + updated.outing_6 + updated.outing_7 + updated.outing_8;
      return updated;
    }));
    setSaving(null);
  };

  if (checking || !isAuth) return null;

  const filtered = deductions
    .filter(d =>
      `${d.member_name} ${d.first_name}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by current_deductions: most negative first (highest adjustment)
      return a.current_deductions - b.current_deductions;
    });

  const outingHeaders = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  return (
    <div>
      <AdminHeader title="Adjusted Handicaps" onLock={logout} />
      <AdminNav current="/admin/adj-handicaps" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Legend */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs">
          <p className="font-bold text-yellow-800 mb-1">Deduction Values:</p>
          <p className="text-yellow-700">
            <strong>-3</strong> = 1st Place · <strong>-2</strong> = 2nd/3rd Place · <strong>-1</strong> = Front 9/Back 9 Winner · <strong>+1</strong> = Attended (no prize)
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search member..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-fairway-800 focus:outline-none"
          />
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-fairway-800 focus:outline-none"
          >
            {[2026, 2025, 2024, 2023].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              const rows = filtered.map(d => {
                const outings = [1,2,3,4,5,6,7,8].map(n => {
                  const val = d[`outing_${n}` as keyof Deduction] as number;
                  const cls = val < 0 ? 'neg' : val > 0 ? 'pos' : 'zro';
                  return `<td class="${cls}">${val}</td>`;
                }).join('');
                const cc = d.current_deductions < 0 ? 'cn' : 'cp';
                return `<tr>
                  <td>${d.member_name}, ${d.first_name}</td>
                  <td class="${cc}">${d.current_deductions}</td>
                  <td style="background:#f9fafb">${d.year_starting_deduction}</td>
                  ${outings}
                </tr>`;
              }).join('');
              printWindow.document.write(`<!DOCTYPE html><html><head><title>ALGS Handicap Adjustments ${year}</title>
                <style>
                  @page { size: A4 landscape; margin: 10mm; }
                  body { font-family: system-ui, sans-serif; padding: 10px; margin: 0; }
                  table { width: 100%; border-collapse: collapse; font-size: 10px; }
                  thead { display: table-header-group; }
                  th { text-align: center; padding: 5px 4px; border: 1px solid #d1d5db; background: #f3f4f6; font-weight: bold; }
                  th:first-child { text-align: left; padding-left: 8px; }
                  td { padding: 4px 6px; border: 1px solid #e5e7eb; text-align: center; }
                  td:first-child { text-align: left; padding-left: 8px; font-weight: 500; }
                  tr:nth-child(even) td { background: #f9fafb; }
                  .neg { color: #dc2626; font-weight: bold; }
                  .pos { color: #16a34a; font-weight: bold; }
                  .zro { color: #9ca3af; }
                  .cn { color: #dc2626; font-weight: bold; background: #fef2f2; }
                  .cp { color: #374151; font-weight: bold; background: #eff6ff; }
                  @media print { body { padding: 0; } }
                </style></head>
                <body>
                <div style="text-align:center;margin-bottom:12px">
                  <h1 style="font-size:18px;color:#1a365d;margin:0">Aer Lingus Golf Society</h1>
                  <h2 style="font-size:14px;color:#2e75b6;margin:3px 0">Handicap Adjustments / Deductions — ${year}</h2>
                  <p style="font-size:9px;color:#6b7280;margin:2px 0">Printed: ${new Date().toLocaleDateString('en-IE', {day:'numeric',month:'long',year:'numeric'})}</p>
                  <p style="font-size:9px;color:#92400e;background:#fef3c7;display:inline-block;padding:3px 10px;border-radius:4px;margin-top:4px">
                    <strong>-3</strong> = 1st Place &middot; <strong>-2</strong> = 2nd/3rd &middot; <strong>-1</strong> = Front 9/Back 9 &middot; <strong>+1</strong> = Attended (no prize)
                  </p>
                </div>
                <table>
                  <thead><tr><th style="text-align:left;padding-left:8px">Name</th><th style="background:#dbeafe">Current</th><th>Start</th><th>1st</th><th>2nd</th><th>3rd</th><th>4th</th><th>5th</th><th>6th</th><th>7th</th><th>8th</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
                <p style="margin-top:10px;font-size:9px;color:#9ca3af;text-align:center">
                  ${filtered.length} members &middot; ${filtered.filter(d => d.current_deductions < 0).length} with deductions &middot; FairwayConnect
                </p>
                </body></html>`);
              printWindow.document.close();
              setTimeout(() => printWindow.print(), 300);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
          >
            🖨️ Print / PDF
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : deductions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500 mb-4">No deduction data for {year}</p>
            <p className="text-xs text-gray-400">Data will be imported from ALGS records</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="text-left px-3 py-2 sticky left-0 bg-gray-50">Name</th>
                  <th className="text-center px-2 py-2 bg-blue-50">Current</th>
                  <th className="text-center px-2 py-2 bg-gray-100">Start</th>
                  {outingHeaders.map((h, i) => (
                    <th key={i} className="text-center px-2 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, idx) => (
                  <tr key={d.id} className={idx > 0 ? 'border-t border-gray-50' : ''}>
                    <td className="px-3 py-2 font-medium sticky left-0 bg-white">
                      {d.member_name}, {d.first_name}
                    </td>
                    <td className={`px-2 py-2 text-center font-bold ${
                      d.current_deductions < 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-blue-50'
                    }`}>
                      {d.current_deductions}
                    </td>
                    <td className="px-2 py-2 text-center bg-gray-50">
                      <input
                        type="number"
                        value={d.year_starting_deduction}
                        onChange={e => handleCellChange(d.id, 'year_starting_deduction', Number(e.target.value))}
                        className={`w-12 text-center border rounded px-1 py-0.5 text-xs ${
                          saving === d.id + 'year_starting_deduction' ? 'bg-yellow-100' : 'border-gray-200'
                        }`}
                      />
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
                      const field = `outing_${n}` as keyof Deduction;
                      const val = d[field] as number;
                      return (
                        <td key={n} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            value={val}
                            onChange={e => handleCellChange(d.id, field, Number(e.target.value))}
                            className={`w-12 text-center border rounded px-1 py-0.5 text-xs ${
                              saving === d.id + field ? 'bg-yellow-100' :
                              val < 0 ? 'bg-red-50 border-red-200 text-red-700' :
                              val > 0 ? 'bg-green-50 border-green-200 text-green-700' :
                              'border-gray-200'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {!loading && deductions.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            {filtered.length} members · {filtered.filter(d => d.current_deductions < 0).length} with deductions
          </div>
        )}
      </div>
    </div>
  );
}
