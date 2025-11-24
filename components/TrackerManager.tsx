
import React, { useState, useEffect } from 'react';
import { GoalTracker, Category, TrackerType } from '../types';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

interface TrackerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  goalTrackers: GoalTracker[];
  categories: Category[];
  onAddTracker: (name: string, type: TrackerType, linkedCategoryId?: string, target?: number, color?: string) => void;
  onUpdateTracker: (id: string, updates: Partial<GoalTracker>) => void;
  onDeleteTracker: (id: string) => void;
}

const TrackerManager: React.FC<TrackerManagerProps> = ({
  isOpen, onClose, goalTrackers, categories, onAddTracker, onUpdateTracker, onDeleteTracker
}) => {
  const [editingTracker, setEditingTracker] = useState<GoalTracker | null>(null);
  
  // New Tracker State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TrackerType>('percent');
  const [newLinkedCat, setNewLinkedCat] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  // Edit State
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<TrackerType>('percent');
  const [editLinkedCat, setEditLinkedCat] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEditingTracker(null);
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
      setNewName('');
      setNewType('percent');
      setNewLinkedCat('');
      setNewTarget('');
      setNewColor('#6366f1');
  };

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (newName.trim()) {
          const targetVal = newTarget ? parseFloat(newTarget) : undefined;
          const linked = newLinkedCat === 'none' ? undefined : (newLinkedCat || undefined);
          onAddTracker(newName.trim(), newType, linked, targetVal, newColor);
          resetForm();
      }
  };

  const startEditing = (tracker: GoalTracker) => {
      setEditingTracker(tracker);
      setEditName(tracker.name);
      setEditType(tracker.type);
      setEditLinkedCat(tracker.linkedCategoryId || 'none');
      setEditTarget(tracker.target ? String(tracker.target) : '');
      setEditColor(tracker.color || '#6366f1');
  };

  const handleUpdate = () => {
      if (editingTracker && editName.trim()) {
          const targetVal = editTarget ? parseFloat(editTarget) : undefined;
          const linked = editLinkedCat === 'none' ? undefined : (editLinkedCat || undefined);
          onUpdateTracker(editingTracker.id, {
              name: editName.trim(),
              type: editType,
              linkedCategoryId: linked,
              target: targetVal,
              color: editColor
          });
          setEditingTracker(null);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
          <div>
              <h2 className="text-2xl font-bold text-white">Manage Metrics</h2>
              <p className="text-sm text-gray-400">Create, edit, and organize your statistics.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-8">
            
            {/* Creation Form */}
            <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-600/50">
                <h3 className="text-lg font-semibold text-indigo-300 mb-4">Add New Metric</h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-xs text-gray-400">Name</label>
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Gym, Water" className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm text-white" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                         <label className="text-xs text-gray-400">Type</label>
                         <select value={newType} onChange={e => setNewType(e.target.value as TrackerType)} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm text-white">
                             <option value="percent">Percent %</option>
                             <option value="count">Count #</option>
                             <option value="check">Check ✓</option>
                         </select>
                    </div>
                    <div className="md:col-span-3 space-y-1">
                         <label className="text-xs text-gray-400">Link Category (Auto)</label>
                         <select value={newLinkedCat} onChange={e => setNewLinkedCat(e.target.value)} disabled={newType !== 'percent'} className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm text-white disabled:opacity-50">
                             <option value="">Manual Entry</option>
                             <option value="all">All Tasks (Global)</option>
                             {categories.filter(c => c.id !== 'uncategorized').map(c => (
                                 <option key={c.id} value={c.id}>{c.name}</option>
                             ))}
                         </select>
                    </div>
                    {newType === 'count' && (
                         <div className="md:col-span-2 space-y-1">
                            <label className="text-xs text-gray-400">Target (Opt)</label>
                            <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="e.g. 100" className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm text-white" />
                        </div>
                    )}
                    <div className="md:col-span-1 space-y-1">
                         <label className="text-xs text-gray-400">Color</label>
                         <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-full h-9 rounded cursor-pointer bg-transparent" />
                    </div>
                    <div className="md:col-span-1">
                        <button type="submit" className="w-full p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md flex justify-center"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </form>
            </div>

            {/* List of Trackers */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-200">Your Metrics</h3>
                {goalTrackers.length === 0 && <p className="text-gray-500 italic">No metrics added yet.</p>}
                
                {goalTrackers.map(tracker => (
                    <div key={tracker.id} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 transition-all hover:bg-gray-700">
                         {editingTracker?.id === tracker.id ? (
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-2 w-full items-center">
                                 <div className="md:col-span-3">
                                     <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-gray-600 border-gray-500 rounded p-1 text-sm" />
                                 </div>
                                 <div className="md:col-span-2">
                                      <select value={editType} onChange={e => setEditType(e.target.value as TrackerType)} className="w-full bg-gray-600 border-gray-500 rounded p-1 text-sm">
                                         <option value="percent">Percent</option>
                                         <option value="count">Count</option>
                                         <option value="check">Check</option>
                                     </select>
                                 </div>
                                 <div className="md:col-span-3">
                                      <select value={editLinkedCat} onChange={e => setEditLinkedCat(e.target.value)} disabled={editType !== 'percent'} className="w-full bg-gray-600 border-gray-500 rounded p-1 text-sm disabled:opacity-50">
                                         <option value="none">Manual</option>
                                         <option value="all">All Tasks</option>
                                         {categories.filter(c => c.id !== 'uncategorized').map(c => (
                                             <option key={c.id} value={c.id}>{c.name}</option>
                                         ))}
                                     </select>
                                 </div>
                                 <div className="md:col-span-2">
                                     {editType === 'count' ? (
                                         <input type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} placeholder="Target" className="w-full bg-gray-600 border-gray-500 rounded p-1 text-sm" />
                                     ) : <span className="text-gray-500 text-xs text-center block">-</span>}
                                 </div>
                                 <div className="md:col-span-1">
                                     <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-full h-8 rounded" />
                                 </div>
                                 <div className="md:col-span-1 flex justify-end gap-2">
                                     <button onClick={handleUpdate} className="text-green-400 hover:text-green-300"><CheckIcon className="w-5 h-5"/></button>
                                     <button onClick={() => setEditingTracker(null)} className="text-gray-400 hover:text-gray-300">&times;</button>
                                 </div>
                             </div>
                         ) : (
                             <>
                                <div className="flex-grow flex items-center gap-4">
                                    <div className="w-4 h-12 rounded-full" style={{ backgroundColor: tracker.color || '#6366f1' }}></div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{tracker.name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 uppercase tracking-wider">
                                            <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">{tracker.type}</span>
                                            {tracker.linkedCategoryId && <span className="text-green-400 flex items-center gap-1">Linked to {categories.find(c=>c.id === tracker.linkedCategoryId)?.name || 'Global'}</span>}
                                            {tracker.type === 'count' && tracker.target && <span className="text-indigo-300">Target: {tracker.target}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => startEditing(tracker)} className="p-2 bg-gray-800 hover:bg-gray-600 rounded-full text-gray-300 transition-colors"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => onDeleteTracker(tracker.id)} className="p-2 bg-gray-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded-full transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                             </>
                         )}
                    </div>
                ))}
            </div>

        </div>
      </div>
    </div>
  );
};

export default TrackerManager;
