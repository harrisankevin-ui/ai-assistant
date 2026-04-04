'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import type { Project } from '@/types';
import KanbanBoard from '@/components/tasks/KanbanBoard';

function TasksContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [project, setProject] = useState<Project | null>(null);

  const loadProject = useCallback(async (id: string) => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const projects = await res.json() as Project[];
      setProject(projects.find(p => p.id === id) ?? null);
    }
  }, []);

  useEffect(() => {
    if (projectId) loadProject(projectId);
    else setProject(null);
  }, [projectId, loadProject]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold text-white">
          {project ? project.name : 'All Tasks'}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {project
            ? `Tasks for ${project.name}`
            : 'All tasks across every project'}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksContent />
    </Suspense>
  );
}
