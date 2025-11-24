
import React, { useState } from 'react';
import { Category, RecurringTaskTemplate } from '../types';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  recurringTasks: RecurringTaskTemplate[];
  onAddCategory: (name: string, color: string) => void;
  onUpdateCategory: (id: string, name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddRecurringTask: (text: string, categoryId: string, daysOfWeek: number[]) => void;
  onUpdateRecurringTask: (taskId: string, updates: Partial<RecurringTaskTemplate>) => void;
  onDeleteRecurringTask: (taskId: string) => void;
  onAddRecurringSubtask: (taskId: string, text: string, days?: number[]) => void;
  onDeleteRecurringSubtask: (taskId: string, subtaskId: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen, onClose, categories, recurringTasks, onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddRecurringTask, onUpdateRecurringTask, onDeleteRecurringTask, onAddRecurringSubtask, onDeleteRecurringSubtask
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4f46e5');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [newRecurringTask, setNewRecurringTask] = useState<{ [key: string]: { text: string; days: Set<number> } }>({});
  
  // Subtask inputs
  const [newSubtaskText, setNewSubtaskText] = useState<{ [key: string]: string }>({});
  const [newSubtaskDays, setNewSubtaskDays] = useState<{ [key: string]: Set<number> }>({});
  const [showSubtaskDays, setShowSubtaskDays] = useState<{ [key: string]: boolean }>({});

  const [editingTask, setEditingTask] = useState<RecurringTaskTemplate | null>(null);
  const [editingTaskDays, setEditingTaskDays] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#4f46e5');
    }
  };

  const handleUpdateCategory = () => {
    if (editingCategory && editingCategory.name.trim()) {
        onUpdateCategory(editingCategory.id, editingCategory.name, editingCategory.color);
        setEditingCategory(null);
    }
  };

  const handleAddRecurringTask = (e: React.FormEvent, categoryId: string) => {
    e.preventDefault();
    const taskInfo = newRecurringTask[categoryId];
    if (taskInfo && taskInfo.text.trim()) {
      onAddRecurringTask(taskInfo.text, categoryId, Array.from(taskInfo.days || []));
      setNewRecurringTask(prev => ({ ...prev, [categoryId]: { text: '', days: new Set() } }));
    }
  };

  const handleToggleDay = (categoryId: string, dayIndex: number) => {
    setNewRecurringTask(prev => {
        const currentDays = prev[categoryId]?.days || new Set();
        const newDays = new Set(currentDays); // Create a copy to trigger re-render correctly
        newDays.has(dayIndex) ? newDays.delete(dayIndex) : newDays.add(dayIndex);
        return { ...prev, [categoryId]: { ...(prev[categoryId] || { text: '' }), days: newDays } };
    });
  };

  const handleToggleEditingDay = (dayIndex: number) => {
    setEditingTaskDays(prev => {
        const newSet = new Set(prev);
        newSet.has(dayIndex) ? newSet.delete(dayIndex) : newSet.add(dayIndex);
        return newSet;
    });
  };

  const handleSaveRecurringTask = () => {
    if (!editingTask) return;
    onUpdateRecurringTask(editingTask.id, {
        text: editingTask.text,
        daysOfWeek: Array.from(editingTaskDays),
    });
    setEditingTask(null);
  };
  
  const handleAddRecurringSubtask = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    const text = newSubtaskText[taskId];
    const days = newSubtaskDays[taskId] || new Set();
    if (text && text.trim()) {
      onAddRecurringSubtask(taskId, text.trim(), days.size > 0 ? Array.from(days) : undefined);
      setNewSubtaskText(prev => ({ ...prev, [taskId]: '' }));
      setNewSubtaskDays(prev => ({ ...prev, [taskId]: new Set() }));
      setShowSubtaskDays(prev => ({ ...prev, [taskId]: false }));
    }
  };
  
  const handleToggleSubtaskDay = (taskId: string, dayIndex: number) => {
      setNewSubtaskDays(prev => {
          const currentDays = prev[taskId] || new Set();
          const newDays = new Set(currentDays);
          newDays.has(dayIndex) ? newDays.delete(dayIndex) : newDays.add(dayIndex);
          return { ...prev, [taskId]: newDays };
      });
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Manage Categories & Recurring Tasks</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <form onSubmit={handleAddCategory} className="flex gap-2 items-center">
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2" />
            <input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} className="bg-gray-700 rounded-md h-10 w-10 p-1 border-gray-600" />
            <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"><PlusIcon className="w-5 h-5"/></button>
          </form>

          <div className="space-y-4">
            {categories.filter(c=>c.id !== 'uncategorized').map(cat => (
              <div key={cat.id} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  {editingCategory?.id === cat.id ? (
                    <div className="flex-grow flex items-center gap-2">
                      <input type="color" value={editingCategory.color} onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })} className="bg-gray-600 rounded-md h-8 w-8 p-1"/>
                      <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="flex-grow bg-gray-600 p-1 rounded-md" autoFocus/>
                      <button onClick={handleUpdateCategory} className="ml-2 text-green-400 hover:text-green-300"><CheckIcon className="w-5 h-5"/></button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: cat.color }}></span>
                      <span className="font-bold text-lg" style={{ color: cat.color }}>{cat.name}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setEditingCategory(cat)} className="text-gray-400 hover:text-white"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-gray-600">
                  {recurringTasks.filter(rt => rt.categoryId === cat.id).map(task => (
                    editingTask?.id === task.id ? (
                      <div key={task.id} className="bg-gray-600 p-3 rounded space-y-2">
                          <input type="text" value={editingTask.text} onChange={e => setEditingTask(prev => prev ? { ...prev, text: e.target.value } : null)} className="w-full bg-gray-500 border-gray-400 rounded-md p-2 text-sm" />
                        <div className="flex justify-center gap-1">
                          {DAYS_OF_WEEK.map((day, index) => (
                              <button key={index} type="button" onClick={() => handleToggleEditingDay(index)} 
                              className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${editingTaskDays.has(index) ? 'bg-indigo-500 text-white' : 'bg-gray-500 hover:bg-gray-400 text-gray-300'}`}>
                                  {day.charAt(0)}
                              </button>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingTask(null)} className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-400 rounded">Cancel</button>
                          <button onClick={handleSaveRecurringTask} className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 rounded">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div key={task.id} className="bg-gray-600 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{task.text}</p>
                            <p className="text-xs text-gray-400">
                              {task.daysOfWeek.length > 0 ? task.daysOfWeek.sort().map(d => DAYS_OF_WEEK[d]).join(', ') : 'All Days'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingTask(task); setEditingTaskDays(new Set(task.daysOfWeek)); }} className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                            <button onClick={() => onDeleteRecurringTask(task.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                          </div>
                        </div>
                        {/* Subtasks Section */}
                        <div className="mt-2 pl-4 border-l-2 border-gray-500">
                            {task.subtasks.map(st => (
                                <div key={st.id} className="flex justify-between items-center text-xs py-1">
                                    <div className="flex items-center gap-2">
                                        <span>- {st.text}</span>
                                        {st.recurrenceDays && st.recurrenceDays.length > 0 && (
                                            <div className="flex gap-0.5">
                                                {st.recurrenceDays.sort().map(d => (
                                                    <span key={d} className="bg-indigo-900 text-indigo-200 px-1 rounded text-[10px]">{DAYS_OF_WEEK[d].charAt(0)}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => onDeleteRecurringSubtask(task.id, st.id)} className="text-gray-500 hover:text-red-500"><TrashIcon className="w-3 h-3"/></button>
                                </div>
                            ))}
                            <div className="mt-1">
                                <form onSubmit={(e) => handleAddRecurringSubtask(e, task.id)} className="flex gap-1 items-start">
                                    <div className="flex-grow space-y-1">
                                        <div className="flex gap-1">
                                             <input type="text" value={newSubtaskText[task.id] || ''} onChange={(e) => setNewSubtaskText(prev => ({ ...prev, [task.id]: e.target.value }))} placeholder="Add subtask..." className="flex-grow bg-gray-500 border-gray-400 text-xs rounded-md p-1 text-white"/>
                                             <button type="button" onClick={() => setShowSubtaskDays(prev => ({...prev, [task.id]: !prev[task.id]}))} className={`p-1 rounded text-xs ${showSubtaskDays[task.id] ? 'bg-indigo-500 text-white' : 'bg-gray-500 text-gray-300'}`}>
                                                 Days
                                             </button>
                                        </div>
                                        {showSubtaskDays[task.id] && (
                                            <div className="flex gap-0.5">
                                                {DAYS_OF_WEEK.map((day, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        type="button"
                                                        onClick={() => handleToggleSubtaskDay(task.id, idx)}
                                                        className={`w-5 h-5 flex items-center justify-center text-[10px] rounded-sm ${newSubtaskDays[task.id]?.has(idx) ? 'bg-indigo-500 text-white' : 'bg-gray-500 text-gray-400'}`}
                                                    >
                                                        {day.charAt(0)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" className="p-1 bg-indigo-500 hover:bg-indigo-600 rounded-md"><PlusIcon className="w-3 h-3"/></button>
                                </form>
                            </div>
                        </div>
                      </div>
                    )
                  ))}
                  {/* Add Recurring Task Form */}
                  <form onSubmit={(e) => handleAddRecurringTask(e, cat.id)} className="space-y-2 text-sm bg-gray-600/50 p-3 rounded-lg">
                    <div className="flex gap-2">
                        <input type="text" value={newRecurringTask[cat.id]?.text || ''} onChange={(e) => setNewRecurringTask(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], text: e.target.value, days: prev[cat.id]?.days || new Set() } }))} placeholder="Add new recurring task..." className="flex-grow bg-gray-500 border-gray-400 rounded-md p-2"/>
                        <button type="submit" className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-md"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                    <div className="flex justify-center gap-1">
                        {DAYS_OF_WEEK.map((day, index) => (
                            <button key={index} type="button" onClick={() => handleToggleDay(cat.id, index)} 
                             className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${newRecurringTask[cat.id]?.days?.has(index) ? 'bg-indigo-500 text-white' : 'bg-gray-500 hover:bg-gray-400 text-gray-300'}`}>
                                {day.charAt(0)}
                            </button>
                        ))}
                    </div>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
