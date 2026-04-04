'use client';

import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import TaskCard from './TaskCard';

const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: 'text-gray-400',
  in_progress: 'text-yellow-400',
  done: 'text-green-400',
};

const COLUMN_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

interface Props {
  status: TaskStatus;
  tasks: Task[];
  projectName: ((id: string | null) => string | null) | null;
  onMove: (id: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAdd: (status: TaskStatus) => void;
}

export default function TaskColumn({ status, tasks, projectName, onMove, onEdit, onDelete, onAdd }: Props) {
  return (
    <div className="flex flex-col bg-gray-900 rounded-xl p-3 min-w-0 flex-1">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${COLUMN_COLORS[status]}`}>
            {COLUMN_LABELS[status]}
          </h3>
          <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(status)}
          className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {tasks.length === 0 && (
          <div className="text-xs text-gray-600 text-center py-6">No tasks</div>
        )}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            projectLabel={projectName ? projectName(task.project_id) : null}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
