'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import type { Task, Project } from '@/types';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_SHORT  = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HOUR_PX    = 70; // pixels per hour in timeline
const HOURS      = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM – 7 PM

const PRIORITY_COLOR: Record<string, string> = {
  high:     '#ef4444',
  moderate: '#fb923c',
  low:      '#14b8a6',
};

function getWeekBounds(offset: number): { start: Date; end: Date; label: string } {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const label = `${fmt(monday)} – ${fmt(sunday)}, ${monday.getFullYear()}`;
  return { start: monday, end: sunday, label };
}

function getDayDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getHourFraction(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function noonOnDay(date: Date): string {
  const month = date.getMonth();
  const offset = (month >= 3 && month <= 9) ? 4 : 5;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00:00-0${offset}:00`;
}

export default function WeeklyBrief() {
  const [weekOffset, setWeekOffset]     = useState(0);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [projects, setProjects]         = useState<Project[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  // Quick-add state
  const [addingDay, setAddingDay]       = useState<string | null>(null);
  const [quickTitle, setQuickTitle]     = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [quickProjectId, setQuickProjectId] = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const calendarRef  = useRef<HTMLDivElement>(null);
  const todayRef     = useRef<HTMLDivElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const { start, label } = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const dayDates = useMemo(() => getDayDates(start), [start]);
  const today    = new Date();

  // Set selected day to today (or Mon if today not in week)
  useEffect(() => {
    const idx = dayDates.findIndex(d => isSameDay(d, today));
    setSelectedDayIdx(idx >= 0 ? idx : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const loadTasks = useCallback(async () => {
    const [tasksRes, projectsRes] = await Promise.all([
      fetch('/api/tasks?weekly_brief=true'),
      fetch('/api/projects'),
    ]);
    if (tasksRes.ok)    setTasks(await tasksRes.json() as Task[]);
    if (projectsRes.ok) setProjects(await projectsRes.json() as Project[]);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Desktop: auto-scroll to today
  useEffect(() => {
    if (todayRef.current && calendarRef.current) {
      const container = calendarRef.current;
      const el = todayRef.current;
      container.scrollTo({ left: el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2, behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    if (addingDay) setTimeout(() => quickInputRef.current?.focus(), 0);
  }, [addingDay]);

  const projectName = (id: string | null) =>
    id ? (projects.find(p => p.id === id)?.name ?? null) : null;

  const tasksForDay = (day: Date) =>
    tasks
      .filter(t => t.due_at && isSameDay(new Date(t.due_at), day))
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

  const openQuickAdd = (dayKey: string) => {
    setAddingDay(dayKey);
    setQuickTitle('');
    setQuickPriority('moderate');
    setQuickProjectId('');
  };

  const cancelQuickAdd = () => { setAddingDay(null); setQuickTitle(''); };

  const submitQuickAdd = async (day: Date) => {
    if (!quickTitle.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          status: 'todo',
          priority: quickPriority,
          project_id: quickProjectId || null,
          due_at: noonOnDay(day),
          weekly_brief: true,
        }),
      });
      if (res.ok) {
        const created = await res.json() as Task;
        setTasks(prev => [...prev, created]);
      }
    } finally {
      setSubmitting(false);
      cancelQuickAdd();
    }
  };

  // ── Shared quick-add form (rendered inside a day card) ──────────────────────
  const QuickAddForm = ({ day }: { day: Date }) => (
    <div className="p-3 bg-[#27272a] rounded-xl border border-white/[0.08] mb-2">
      <input
        ref={quickInputRef}
        value={quickTitle}
        onChange={e => setQuickTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submitQuickAdd(day);
          if (e.key === 'Escape') cancelQuickAdd();
        }}
        placeholder="Event name…"
        className="w-full bg-transparent text-[13px] text-white placeholder-[#6b7280] outline-none mb-2"
      />
      <div className="flex gap-1.5 mb-2">
        <select
          value={quickProjectId}
          onChange={e => setQuickProjectId(e.target.value)}
          className="flex-1 min-w-0 bg-[#18181b] text-[12px] text-[#9ca3af] rounded-lg px-2 py-1.5 outline-none border border-white/[0.05]"
        >
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={quickPriority}
          onChange={e => setQuickPriority(e.target.value as 'low' | 'moderate' | 'high')}
          className="bg-[#18181b] text-[12px] text-[#9ca3af] rounded-lg px-2 py-1.5 outline-none border border-white/[0.05]"
        >
          <option value="low">Low</option>
          <option value="moderate">Med</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => submitQuickAdd(day)}
          disabled={!quickTitle.trim() || submitting}
          className="flex-1 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] disabled:bg-[#27272a] disabled:text-[#6b7280] text-white rounded-lg text-[12px] font-medium transition-colors"
        >
          Add
        </button>
        <button
          onClick={cancelQuickAdd}
          className="px-3 py-1.5 bg-[#27272a] hover:bg-white/[0.08] text-[#9ca3af] rounded-lg text-[12px] transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP: 7-column calendar grid ──────────────────────────────── */}
      <div className="hidden lg:flex flex-col h-full bg-[#0a0a0f] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <h2 className="text-[20px] font-semibold tracking-tight text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#4f46e5]" />
              {label}
            </h2>
            <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-white/[0.05]">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-[#9ca3af] hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-3 py-1 text-[13px] font-medium text-white"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-[#9ca3af] hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 7-column grid */}
        <div
          ref={calendarRef}
          className="flex-1 overflow-auto p-6"
        >
          <div className="grid grid-cols-7 gap-4 h-full min-h-0">
            {dayDates.map((day, i) => {
              const isToday       = isSameDay(day, today);
              const dayTasks      = tasksForDay(day);
              const dayKey        = day.toDateString();
              const isAddingHere  = addingDay === dayKey;

              return (
                <div
                  key={i}
                  ref={isToday ? todayRef : undefined}
                  className={`flex flex-col rounded-2xl border overflow-hidden backdrop-blur-md transition-all hover:bg-[#18181b]/80 ${
                    isToday
                      ? 'border-[#4f46e5]/50 bg-[#18181b]/50 shadow-[0_0_30px_rgba(79,70,229,0.05)]'
                      : 'border-white/[0.05] bg-[#18181b]/30'
                  }`}
                >
                  {/* Day header */}
                  <div className={`px-4 py-4 flex flex-col items-center border-b ${
                    isToday ? 'border-[#4f46e5]/20 bg-[#4f46e5]/10' : 'border-white/[0.05]'
                  }`}>
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[11px] uppercase tracking-wider font-semibold ${isToday ? 'text-[#818cf8]' : 'text-[#6b7280]'}`}>
                        {DAY_LABELS[i]}
                      </span>
                      <button
                        onClick={() => isAddingHere ? cancelQuickAdd() : openQuickAdd(dayKey)}
                        className={`p-1 rounded-lg transition-colors ${
                          isToday ? 'text-[#818cf8] hover:bg-[#4f46e5]/20' : 'text-[#6b7280] hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className={`text-[24px] font-light ${isToday ? 'text-white' : 'text-[#d1d5db]'}`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                    {isAddingHere && <QuickAddForm day={day} />}
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-3 bg-[#27272a]/50 border border-white/[0.05] rounded-xl hover:bg-[#27272a] transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: PRIORITY_COLOR[task.priority] }} />
                        <div className="flex items-center text-[11px] text-[#9ca3af] mb-1.5 gap-1.5 pl-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(task.due_at!)}
                        </div>
                        <div className="text-[13px] font-medium text-white leading-snug group-hover:text-[#818cf8] transition-colors pl-1">
                          {task.title}
                        </div>
                        {projectName(task.project_id) && (
                          <div className="text-[11px] text-[#6b7280] mt-1.5 uppercase tracking-wide pl-1">
                            {projectName(task.project_id)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MOBILE: Date selector + timeline ─────────────────────────────── */}
      <div className="lg:hidden flex flex-col h-full bg-[#0a0a0f] overflow-hidden">
        {/* Sticky header */}
        <div className="px-5 pt-10 pb-4 bg-[#18181b]/80 backdrop-blur-2xl border-b border-white/[0.08] z-20 sticky top-0">
          {/* Month label + nav */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[26px] font-semibold text-white tracking-tight">{label.split(',')[0]}</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="p-2 rounded-xl text-[#9ca3af] hover:text-white hover:bg-white/[0.05] transition-colors active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-3 py-1.5 text-[13px] font-medium text-[#818cf8] bg-[#4f46e5]/10 rounded-xl"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="p-2 rounded-xl text-[#9ca3af] hover:text-white hover:bg-white/[0.05] transition-colors active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 7-day pill row */}
          <div className="flex justify-between items-center px-1">
            {dayDates.map((day, i) => {
              const isSelected = selectedDayIdx === i;
              const isDayToday = isSameDay(day, today);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDayIdx(i)}
                  className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span className={`text-[11px] font-medium ${isSelected ? 'text-white' : isDayToday ? 'text-[#818cf8]' : 'text-[#6b7280]'}`}>
                    {DAY_SHORT[i]}
                  </span>
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full text-[15px] transition-all ${
                    isSelected
                      ? 'bg-[#4f46e5] text-white shadow-[0_0_12px_rgba(79,70,229,0.5)] font-semibold'
                      : isDayToday
                        ? 'text-[#818cf8] font-semibold'
                        : 'text-white font-light hover:bg-[#27272a]'
                  }`}>
                    {day.getDate()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline body */}
        <div className="flex-1 overflow-y-auto relative pb-4">
          {/* Floating + button */}
          {addingDay !== dayDates[selectedDayIdx].toDateString() && (
            <button
              onClick={() => openQuickAdd(dayDates[selectedDayIdx].toDateString())}
              className="fixed right-5 w-12 h-12 bg-[#4f46e5] text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] active:scale-90 transition-transform flex items-center justify-center z-30"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 68px)' }}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          <div className="px-4 pt-4">
            {/* Quick-add form (mobile) */}
            {addingDay === dayDates[selectedDayIdx].toDateString() && (
              <div className="mb-4">
                <QuickAddForm day={dayDates[selectedDayIdx]} />
              </div>
            )}

            {/* Hour timeline */}
            <div className="relative">
              {HOURS.map(hour => (
                <div key={hour} className="flex items-start h-[70px] relative">
                  <span className="w-14 text-[12px] text-[#6b7280] font-medium shrink-0 -mt-[7px]">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </span>
                  <div className="flex-1 border-t border-white/[0.04] mt-0" />
                </div>
              ))}

              {/* Task overlays */}
              {tasksForDay(dayDates[selectedDayIdx]).map(task => {
                const hf        = task.due_at ? getHourFraction(task.due_at) : 12;
                const clampedHf = Math.min(Math.max(hf, 7), 19);
                const topOffset = (clampedHf - 7) * HOUR_PX;
                const height    = Math.max(HOUR_PX - 6, 48);

                return (
                  <div
                    key={task.id}
                    className="absolute left-[56px] right-0 rounded-xl p-3 border border-white/[0.08] backdrop-blur-md active:scale-[0.98] transition-all flex flex-col justify-center overflow-hidden"
                    style={{
                      top: `${topOffset}px`,
                      height: `${height}px`,
                      backgroundColor: 'rgba(24, 24, 27, 0.9)',
                      borderLeft: `4px solid ${PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.moderate}`,
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[13px] font-medium text-white leading-tight line-clamp-1">{task.title}</span>
                      <span className="text-[10px] text-[#9ca3af] whitespace-nowrap shrink-0">{formatTime(task.due_at!)}</span>
                    </div>
                    {projectName(task.project_id) && (
                      <span className="text-[11px] text-[#6b7280] mt-0.5 line-clamp-1">{projectName(task.project_id)}</span>
                    )}
                  </div>
                );
              })}

              {tasksForDay(dayDates[selectedDayIdx]).length === 0 && !addingDay && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-[#6b7280] text-[15px] font-medium">No events today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
