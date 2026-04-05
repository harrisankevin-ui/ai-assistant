'use client';

import { ChevronLeft, ChevronRight, Pencil, Trash2, Calendar } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-l-red-500',
  moderate: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

function formatDueDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isThisYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' }),
  });
}

interface Props {
  task: Task;
  projectLabel: string | null;
  onMove: (id: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, projectLabel, onMove, onEdit, onDelete }: Props) {
  const idx = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = idx > 0;
  const canMoveRight = idx < STATUS_ORDER.length - 1;
  const borderClass = PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.moderate;

  return (
    <div className={`bg-gray-800 rounded-lg p-3 group border-l-2 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {projectLabel && (
            <span className="text-xs text-indigo-400 font-medium block mb-0.5 truncate">
              {projectLabel}
            </span>
          )}
          <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-500 hover:text-indigo-400 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex gap-1">
          {canMoveLeft && (
            <button
              onClick={() => onMove(task.id, STATUS_ORDER[idx - 1])}
              className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded text-xs transition-colors"
            >
              <ChevronLeft size={11} />
              {STATUS_ORDER[idx - 1].replace('_', ' ')}
            </button>
          )}
          {canMoveRight && (
            <button
              onClick={() => onMove(task.id, STATUS_ORDER[idx + 1])}
              className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded text-xs transition-colors"
            >
              {STATUS_ORDER[idx + 1].replace('_', ' ')}
              <ChevronRight size={11} />
            </button>
          )}
        </div>
        {task.due_at && (
          <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
            <Calendar size={10} />
            {formatDueDate(task.due_at)}
          </span>
        )}
      </div>
    </div>
  );
}
