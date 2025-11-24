import React, { useState, useEffect } from 'react';
import { DayType, Category } from '../types';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon } from './icons';

interface DayTypeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  dayTypes: DayType[];
  categories: Category[];
  onAddDayType: (name: string) => void;
  onUpdateDayType: (id: string, name: string, categoryIds: string[]) => void;
  onDeleteDayType: (id: string) => void;
}

const DayTypeManager: React.FC<DayTypeManagerProps> = ({
  isOpen, onClose, dayTypes, categories, onAddDayType, onUpdateDayType, onDeleteDayType,
}) => {
  const [newDayTypeName, setNewDayTypeName] = useState('');
  const [editingDayType, setEditingDayType] = useState<DayType | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingDayType(null);
      setNewDayTypeName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddDayType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDayTypeName.trim()) {
      onAddDayType(newDayTypeName.trim());
      setNewDayTypeName('');
    }
  };

  const handleUpdateDayType = () => {
    if (editingDayType && editingDayType.name.trim()) {
        onUpdateDayType(editingDayType.id, editingDayType.name.trim(), editingDayType.categoryIds);
        setEditingDayType(null);
    }
  };

  const handleCategoryToggle = (dayTypeId: string, categoryId: string) => {
    setEditingDayType(prev => {
        if (!prev || prev.id !== dayTypeId) return prev;
        const newCategoryIds = new Set(prev.categoryIds);
        if (newCategoryIds.has(categoryId)) {
            newCategoryIds.delete(categoryId);
        } else {
            newCategoryIds.add(categoryId);
        }
        return { ...prev, categoryIds: Array.from(newCategoryIds) };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Manage Day Types</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          <form onSubmit={handleAddDayType} className="flex gap-2">
            <input
              type="text"
              value={newDayTypeName}
              onChange={(e) => setNewDayTypeName(e.target.value)}
              placeholder="Add new day type (e.g., Weekend)"
              className="flex-grow bg-gray-700 border-gray-600 text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
            />
            <button type="submit" className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"><PlusIcon className="w-5 h-5"/></button>
          </form>

          <div className="space-y-4">
            {dayTypes.map(dt => (
              <div key={dt.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  {editingDayType?.id === dt.id ? (
                      <div className="flex gap-2 w-full">
                        <input type="text" value={editingDayType.name} onChange={e => setEditingDayType(prev => prev ? {...prev, name: e.target.value} : null)} className="flex-grow bg-gray-600 rounded p-1" autoFocus/>
                        <button onClick={handleUpdateDayType} className="text-green-400 hover:text-green-300"><CheckIcon className="w-5 h-5"/></button>
                      </div>
                  ) : (
                    <h3 className="text-lg font-bold text-indigo-300">{dt.name}</h3>
                  )}
                  <div className="flex items-center gap-2">
                     <button onClick={() => setEditingDayType(dt)} className="text-gray-400 hover:text-white"><EditIcon className="w-5 h-5"/></button>
                     <button onClick={() => onDeleteDayType(dt.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </div>
                
                {editingDayType?.id === dt.id && (
                    <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-2">Included Categories</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {categories.filter(c => c.id !== 'uncategorized').map(cat => (
                                <label key={cat.id} className="flex items-center gap-2 p-2 bg-gray-600 rounded-md cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingDayType.categoryIds.includes(cat.id)}
                                        onChange={() => handleCategoryToggle(dt.id, cat.id)}
                                        className="w-4 h-4 text-indigo-500 bg-gray-500 border-gray-400 rounded focus:ring-indigo-600 ring-offset-gray-600 focus:ring-2"
                                    />
                                    <span>{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayTypeManager;