
import React, { useState } from 'react';
import { Category } from '../types';
import { PlusIcon } from './icons';

interface AddTaskFormProps {
  categories: Category[];
  onAddTask: (text: string, categoryId: string) => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ categories, onAddTask }) => {
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && categoryId) {
      onAddTask(text, categoryId);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-8 p-4 bg-gray-800 rounded-lg">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new task for today..."
        className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
      />
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="bg-gray-700 border-gray-600 text-white text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
      >
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <button type="submit" className="p-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:ring-4 focus:outline-none focus:ring-indigo-800">
        <PlusIcon className="w-5 h-5" />
      </button>
    </form>
  );
};

export default AddTaskForm;
