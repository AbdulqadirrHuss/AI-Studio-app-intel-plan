
import React, { useState, useEffect } from 'react';
import { Task, Category, Subtask } from '../types';
import { TrashIcon, PlusIcon, ChevronDownIcon } from './icons';

interface TaskItemProps {
  task: Task;
  categoryColor: string;
  onToggle: (taskId: string, subtaskId?: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (taskId: string, text: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, categoryColor, onToggle, onDelete, onAddSubtask, onDeleteSubtask }) => {
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskText.trim()) {
      onAddSubtask(task.id, newSubtaskText.trim());
      setNewSubtaskText('');
    }
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-lg mb-2 border border-white/5 hover:border-white/10 transition-all ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-center p-3 border-l-4 rounded-l-sm" style={{ borderColor: categoryColor }}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          disabled={hasSubtasks}
          className="w-5 h-5 text-indigo-500 bg-slate-700/50 border-slate-600 rounded focus:ring-indigo-600 ring-offset-slate-800 focus:ring-2 disabled:opacity-50 cursor-pointer transition-all"
          aria-label={`Mark task as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        <span className={`ml-4 flex-1 ${task.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
          {task.text}
        </span>
        {task.isRecurring && <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full mr-3 border border-indigo-500/20 uppercase tracking-wider">Recurring</span>}
        <button onClick={() => onDelete(task.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-500/10" aria-label="Delete task">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
      {hasSubtasks && (
        <div className="pl-10 pr-4 pb-3 space-y-2 border-t border-white/5 pt-2">
          {task.subtasks?.map(subtask => (
            <div key={subtask.id} className="flex items-center group">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggle(task.id, subtask.id)}
                className="w-4 h-4 text-indigo-500 bg-slate-700/50 border-slate-500 rounded focus:ring-indigo-600 ring-offset-slate-800 focus:ring-2 cursor-pointer"
                aria-label={`Mark subtask as ${subtask.completed ? 'incomplete' : 'complete'}`}
              />
              <span className={`ml-3 flex-1 text-sm ${subtask.completed ? 'line-through text-slate-500' : 'text-slate-300 group-hover:text-slate-100 transition-colors'}`}>
                {subtask.text}
              </span>
              <button onClick={() => onDeleteSubtask(task.id, subtask.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" aria-label="Delete subtask">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {!task.completed && (
          <div className="pl-10 pr-4 pb-3">
            <form onSubmit={handleAddSubtask} className="flex gap-2 items-center">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-grow bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500 text-xs rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full p-1.5 transition-all focus:bg-slate-700"
              />
              <button type="submit" className="p-1.5 text-white bg-indigo-600/80 hover:bg-indigo-600 rounded-md focus:ring-2 focus:outline-none focus:ring-indigo-800 transition-colors" aria-label="Add subtask">
                <PlusIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
      )}
    </div>
  );
};

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  onToggleTask: (id: string, subtaskId?: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubtask: (taskId: string, text: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onReorderCategories?: (startIndex: number, endIndex: number) => void;
}

const calculateProgress = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    const valuePerTask = 100 / tasks.length;
    let totalPercentage = 0;
    tasks.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(st => st.completed).length;
            const subtaskCompletion = completedSubtasks / task.subtasks.length;
            totalPercentage += subtaskCompletion * valuePerTask;
        } else if (task.completed) {
            totalPercentage += valuePerTask;
        }
    });
    return totalPercentage;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, categories, onToggleTask, onDeleteTask, onAddSubtask, onDeleteSubtask, onReorderCategories }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedCompleted, setExpandedCompleted] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const categoryMap = new Map<string, Category>(categories.map(cat => [cat.id, cat]));

  useEffect(() => {
    const allCategoryIds = new Set<string>();
    tasks.forEach(task => allCategoryIds.add(task.categoryId));
    setExpandedCategories(allCategoryIds);
  }, [tasks]); 

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleCompleted = (categoryId: string) => {
      setExpandedCompleted(prev => {
          const newSet = new Set(prev);
          newSet.has(categoryId) ? newSet.delete(categoryId) : newSet.add(categoryId);
          return newSet;
      });
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    const categoryId = task.categoryId;
    (acc[categoryId] = acc[categoryId] || []).push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const uncategorizedTasks = groupedTasks['uncategorized'] || [];
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === targetIndex || !onReorderCategories) return;
      
      onReorderCategories(draggedIndex, targetIndex);
      setDraggedIndex(null);
  };


  if (tasks.length === 0) {
    return (
        <div className="text-center py-16 px-6 bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-dashed border-slate-700">
            <h3 className="text-xl font-semibold text-slate-300">No tasks for this day!</h3>
            <p className="text-slate-500 mt-2">Select a Day Type above or add a new task below.</p>
        </div>
    );
  }

  const renderCategorySection = (categoryId: string, title: string, tasksInCategory: Task[], color: string, index: number, isDraggable: boolean) => {
    const progress = calculateProgress(tasksInCategory);
    const activeTasks = tasksInCategory.filter(t => !t.completed);
    const completedTasks = tasksInCategory.filter(t => t.completed);

    return (
        <div 
            key={categoryId}
            draggable={isDraggable}
            onDragStart={(e) => isDraggable ? handleDragStart(e, index) : undefined}
            onDragOver={isDraggable ? handleDragOver : undefined}
            onDrop={(e) => isDraggable ? handleDrop(e, index) : undefined}
            className={`transition-all duration-200 ${draggedIndex === index ? 'opacity-40 border-2 border-dashed border-slate-500 rounded-xl' : ''}`}
        >
          <button
            onClick={() => toggleCategory(categoryId)}
            className="w-full flex justify-between items-center text-left p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-all"
            aria-expanded={expandedCategories.has(categoryId)}
          >
            <div className="flex items-center gap-4 flex-grow">
                {isDraggable && (
                    <div className="cursor-grab text-slate-600 group-hover:text-slate-400" title="Drag to reorder">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                        </svg>
                    </div>
                )}
                <h2 className="text-xl font-bold select-none" style={{ color: color }}>{title}</h2>
                <div className="w-32 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}></div>
                </div>
                <span className="text-xs text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{Math.round(progress)}%</span>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedCategories.has(categoryId) ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedCategories.has(categoryId) && (
            <div className="mt-3 space-y-4 pl-2">
              {/* Active Tasks */}
              <div className="space-y-2">
                {activeTasks.length > 0 ? (
                    activeTasks.map(task => (
                        <TaskItem
                        key={task.id}
                        task={task}
                        categoryColor={color}
                        onToggle={onToggleTask}
                        onDelete={onDeleteTask}
                        onAddSubtask={onAddSubtask}
                        onDeleteSubtask={onDeleteSubtask}
                        />
                    ))
                ) : (
                    completedTasks.length === 0 && <div className="text-slate-500 text-sm italic pl-4">No active tasks</div>
                )}
              </div>

              {/* Completed Tasks Dropdown */}
              {completedTasks.length > 0 && (
                  <div className="border-t border-white/5 pt-3 mt-4">
                      <button 
                        onClick={() => toggleCompleted(categoryId)}
                        className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-slate-500 hover:text-slate-300 mb-3 transition-colors ml-2"
                      >
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${expandedCompleted.has(categoryId) ? 'rotate-180' : ''}`} />
                          Completed ({completedTasks.length})
                      </button>
                      
                      {expandedCompleted.has(categoryId) && (
                          <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                              {completedTasks.map(task => (
                                  <TaskItem
                                    key={task.id}
                                    task={task}
                                    categoryColor={color}
                                    onToggle={onToggleTask}
                                    onDelete={onDeleteTask}
                                    onAddSubtask={onAddSubtask}
                                    onDeleteSubtask={onDeleteSubtask}
                                  />
                              ))}
                          </div>
                      )}
                  </div>
              )}
            </div>
          )}
        </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Render categories in the order they appear in the categories prop */}
        {categories.map((category, index) => {
             const tasksInCategory = groupedTasks[category.id];
             if (!tasksInCategory || tasksInCategory.length === 0) return null;
             return renderCategorySection(category.id, category.name, tasksInCategory, category.color, index, category.id !== 'uncategorized');
        })}
        
        {/* Render Uncategorized at the end if it has tasks */}
        {uncategorizedTasks.length > 0 && 
            renderCategorySection('uncategorized', 'Uncategorized', uncategorizedTasks, '#94a3b8', -1, false)
        }
    </div>
  );
};

export default TaskList;
