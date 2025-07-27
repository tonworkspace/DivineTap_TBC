import React from 'react';

interface CompletedTasksToggleProps {
  completedTasksCount: number;
  hideCompleted: boolean;
  onToggle: () => void;
  className?: string;
}

export const CompletedTasksToggle: React.FC<CompletedTasksToggleProps> = ({
  completedTasksCount,
  hideCompleted,
  onToggle,
  className = ''
}) => {
  if (completedTasksCount === 0) {
    return null;
  }

  return (
    <div className={`flex justify-end ${className}`}>
      <button
        onClick={onToggle}
        className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
          hideCompleted
            ? 'bg-gray-600 text-gray-300'
            : 'bg-cyan-600 text-white'
        }`}
      >
        {hideCompleted ? '👁️ Show Completed' : '🚫 Hide Completed'}
      </button>
    </div>
  );
}; 