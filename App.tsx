
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Category, DayType, RecurringTaskTemplate, DailyLog, Subtask, RecurringTaskSubtaskTemplate, GoalTracker, StatsLog, TrackerType } from './types';
import Header from './components/Header';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import DayTypeManager from './components/DayTypeManager';
import CategoryManager from './components/CategoryManager';
import Statistics from './components/Statistics';
import TrackerManager from './components/TrackerManager';
import { SettingsIcon, EditIcon, ChartBarIcon, CalendarIcon } from './components/icons';
import DateNavigator from './components/DateNavigator';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getDefaultData = () => {
    const defaultCategories: Category[] = [
        { id: 'cat-1', name: 'Work', color: '#3b82f6' },
        { id: 'cat-2', name: 'Personal', color: '#10b981' },
        { id: 'cat-3', name: 'Fitness', color: '#f97316' },
        { id: 'uncategorized', name: 'Uncategorized', color: '#6b7280' },
    ];
    const defaultRecurringTasks: RecurringTaskTemplate[] = [
        { id: 'rt-1', text: 'Check emails', categoryId: 'cat-1', daysOfWeek: [1, 2, 3, 4, 5], subtasks: [] },
        { id: 'rt-2', text: 'Daily Stand-up', categoryId: 'cat-1', daysOfWeek: [1, 2, 3, 4, 5], subtasks: [] },
        { id: 'rt-3', text: 'Read a book', categoryId: 'cat-2', daysOfWeek: [0, 6], subtasks: [] },
        { id: 'rt-4', text: 'Go for a walk', categoryId: 'cat-3', daysOfWeek: [0, 6], subtasks: [] },
    ];
    const defaultDayTypes: DayType[] = [
        { id: 'dt-1', name: 'Work Day', categoryIds: ['cat-1'] },
        { id: 'dt-2', name: 'Rest Day', categoryIds: ['cat-2', 'cat-3'] },
    ];
    const defaultGoalTrackers: GoalTracker[] = [
        { id: 'gt-1', name: 'Fitness %', type: 'percent', linkedCategoryId: 'cat-3', color: '#f97316' }
    ];
    return { categories: defaultCategories, dayTypes: defaultDayTypes, recurringTasks: defaultRecurringTasks, dailyLogs: {}, goalTrackers: defaultGoalTrackers, statsLogs: {} };
};

function App() {
    const [currentView, setCurrentView] = useState<'planner' | 'statistics'>('planner');

    const [categories, setCategories] = useState<Category[]>([]);
    const [dayTypes, setDayTypes] = useState<DayType[]>([]);
    const [recurringTasks, setRecurringTasks] = useState<RecurringTaskTemplate[]>([]);
    const [dailyLogs, setDailyLogs] = useState<{ [date: string]: DailyLog }>({});
    const [goalTrackers, setGoalTrackers] = useState<GoalTracker[]>([]);
    const [statsLogs, setStatsLogs] = useState<StatsLog>({});
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

    const [isDayTypeManagerOpen, setDayTypeManagerOpen] = useState(false);
    const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);
    const [isTrackerManagerOpen, setTrackerManagerOpen] = useState(false);

    useEffect(() => {
        try {
            const savedCategories = localStorage.getItem('categories');
            const savedDayTypes = localStorage.getItem('dayTypes');
            const savedRecurringTasks = localStorage.getItem('recurringTasks');
            const savedDailyLogs = localStorage.getItem('dailyLogs');
            const savedGoalTrackers = localStorage.getItem('goalTrackers');
            const savedStatsLogs = localStorage.getItem('statsLogs');

            if (savedCategories && savedDayTypes && savedDailyLogs && savedRecurringTasks) {
                setCategories(JSON.parse(savedCategories));
                setDayTypes(JSON.parse(savedDayTypes));
                setRecurringTasks(JSON.parse(savedRecurringTasks));
                setDailyLogs(JSON.parse(savedDailyLogs));
                setGoalTrackers(savedGoalTrackers ? JSON.parse(savedGoalTrackers) : getDefaultData().goalTrackers);
                setStatsLogs(savedStatsLogs ? JSON.parse(savedStatsLogs) : {});
            } else {
                const defaults = getDefaultData();
                setCategories(defaults.categories);
                setDayTypes(defaults.dayTypes);
                setRecurringTasks(defaults.recurringTasks);
                setDailyLogs(defaults.dailyLogs);
                setGoalTrackers(defaults.goalTrackers);
                setStatsLogs(defaults.statsLogs);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            const defaults = getDefaultData();
            setCategories(defaults.categories);
            setDayTypes(defaults.dayTypes);
            setRecurringTasks(defaults.recurringTasks);
            setDailyLogs(defaults.dailyLogs);
            setGoalTrackers(defaults.goalTrackers);
            setStatsLogs(defaults.statsLogs);
        }
    }, []);

    useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
    useEffect(() => { localStorage.setItem('dayTypes', JSON.stringify(dayTypes)); }, [dayTypes]);
    useEffect(() => { localStorage.setItem('recurringTasks', JSON.stringify(recurringTasks)); }, [recurringTasks]);
    useEffect(() => { localStorage.setItem('dailyLogs', JSON.stringify(dailyLogs)); }, [dailyLogs]);
    useEffect(() => { localStorage.setItem('goalTrackers', JSON.stringify(goalTrackers)); }, [goalTrackers]);
    useEffect(() => { localStorage.setItem('statsLogs', JSON.stringify(statsLogs)); }, [statsLogs]);

    const currentDailyLog = useMemo(() => {
        return dailyLogs[selectedDate] || { date: selectedDate, dayTypeId: null, tasks: [] };
    }, [dailyLogs, selectedDate]);
    
    const updateDailyLog = useCallback((date: string, newLog: DailyLog) => {
        setDailyLogs(prevLogs => ({
            ...prevLogs,
            [date]: newLog
        }));
    }, []);
    
    useEffect(() => {
        if (!dailyLogs[selectedDate]) {
            updateDailyLog(selectedDate, { date: selectedDate, dayTypeId: null, tasks: [] });
        }
    }, [dailyLogs, selectedDate, updateDailyLog]);


    const handleSelectDayType = (dayTypeId: string) => {
        const selectedDayType = dayTypes.find(dt => dt.id === dayTypeId);
        if (!selectedDayType) return;
        
        const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();

        const nonRecurringTasks = currentDailyLog.tasks.filter(t => !t.isRecurring);
        const newRecurringTasks: Task[] = recurringTasks
            .filter(rt => selectedDayType.categoryIds.includes(rt.categoryId))
            .filter(rt => rt.daysOfWeek.length === 0 || rt.daysOfWeek.includes(dayOfWeek))
            .map(rt => {
                const applicableSubtasks = rt.subtasks.filter(st => {
                    if (st.recurrenceDays && st.recurrenceDays.length > 0) {
                        return st.recurrenceDays.includes(dayOfWeek);
                    }
                    return true;
                });

                return {
                    id: crypto.randomUUID(),
                    text: rt.text,
                    completed: false,
                    categoryId: rt.categoryId,
                    isRecurring: true,
                    subtasks: applicableSubtasks.map(st => ({
                        id: crypto.randomUUID(),
                        text: st.text,
                        completed: false,
                    })),
                };
            });

        updateDailyLog(selectedDate, {
            ...currentDailyLog,
            dayTypeId: dayTypeId,
            tasks: [...nonRecurringTasks, ...newRecurringTasks],
        });
    };

    const handleAddTask = (text: string, categoryId: string) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            text,
            categoryId,
            completed: false,
            isRecurring: false,
            subtasks: [],
        };
        updateDailyLog(selectedDate, { ...currentDailyLog, tasks: [...currentDailyLog.tasks, newTask] });
    };

    const handleToggleTask = (id: string, subtaskId?: string) => {
        const newTasks = currentDailyLog.tasks.map(task => {
            if (task.id !== id) return task;

            if (subtaskId) {
                const newSubtasks = task.subtasks?.map(st => 
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st
                );
                const allSubtasksCompleted = newSubtasks?.every(st => st.completed);
                return { ...task, subtasks: newSubtasks, completed: allSubtasksCompleted || false };
            }
            return (task.subtasks && task.subtasks.length > 0) ? task : { ...task, completed: !task.completed };
        });
        updateDailyLog(selectedDate, { ...currentDailyLog, tasks: newTasks });
    };

    const handleDeleteTask = (id: string) => {
        const newTasks = currentDailyLog.tasks.filter(task => task.id !== id);
        updateDailyLog(selectedDate, { ...currentDailyLog, tasks: newTasks });
    };

    const handleAddSubtask = (taskId: string, text: string) => {
        const newSubtask: Subtask = { id: crypto.randomUUID(), text, completed: false };
        const newTasks = currentDailyLog.tasks.map(task => {
            if (task.id === taskId) {
                const updatedSubtasks = [...(task.subtasks || []), newSubtask];
                return { ...task, subtasks: updatedSubtasks, completed: false };
            }
            return task;
        });
        updateDailyLog(selectedDate, { ...currentDailyLog, tasks: newTasks });
    };

    const onDeleteSubtask = (taskId: string, subtaskId: string) => {
        const newTasks = currentDailyLog.tasks.map(task => {
            if (task.id === taskId) {
                const newSubtasks = task.subtasks?.filter(st => st.id !== subtaskId);
                const allSubtasksCompleted = newSubtasks?.every(st => st.completed);
                return { ...task, subtasks: newSubtasks, completed: (newSubtasks?.length ?? 0) > 0 ? (allSubtasksCompleted || false) : task.completed };
            }
            return task;
        });
        updateDailyLog(selectedDate, { ...currentDailyLog, tasks: newTasks });
    };

    // Category Management
    const handleAddCategory = (name: string, color: string) => {
        const newCategory: Category = { id: crypto.randomUUID(), name, color };
        setCategories([...categories, newCategory]);
    };
    const handleUpdateCategory = (id: string, name: string, color: string) => {
        setCategories(categories.map(cat => cat.id === id ? { ...cat, name, color } : cat));
    };
    const handleDeleteCategory = (id: string) => {
        setCategories(categories.filter(cat => cat.id !== id));
        setRecurringTasks(recurringTasks.filter(rt => rt.categoryId !== id));
        const updatedLogs = { ...dailyLogs };
        Object.keys(updatedLogs).forEach(date => {
            updatedLogs[date].tasks = updatedLogs[date].tasks.map(task => 
                task.categoryId === id ? { ...task, categoryId: 'uncategorized' } : task
            );
        });
        setDailyLogs(updatedLogs);
    };
    
    const handleReorderCategories = (startIndex: number, endIndex: number) => {
        const newCategories = Array.from(categories);
        if (startIndex < 0 || startIndex >= newCategories.length || endIndex < 0 || endIndex >= newCategories.length) return;
        const [reorderedItem] = newCategories.splice(startIndex, 1);
        newCategories.splice(endIndex, 0, reorderedItem);
        setCategories(newCategories);
    };

    // Day Type Management
    const handleAddDayType = (name: string) => {
        const newDayType: DayType = { id: crypto.randomUUID(), name, categoryIds: [] };
        setDayTypes([...dayTypes, newDayType]);
    };
    const handleUpdateDayType = (id: string, name: string, categoryIds: string[]) => {
        setDayTypes(dayTypes.map(dt => dt.id === id ? { ...dt, name, categoryIds } : dt));
    };
    const handleDeleteDayType = (id: string) => {
        setDayTypes(dayTypes.filter(dt => dt.id !== id));
    };

    // Recurring Task Management
    const handleAddRecurringTask = (text: string, categoryId: string, daysOfWeek: number[]) => {
        const newTask: RecurringTaskTemplate = { id: crypto.randomUUID(), text, categoryId, daysOfWeek, subtasks: [] };
        setRecurringTasks([...recurringTasks, newTask]);
    };
    const onUpdateRecurringTask = (taskId: string, updates: Partial<RecurringTaskTemplate>) => {
        setRecurringTasks(prev => 
            prev.map(rt => rt.id === taskId ? { ...rt, ...updates } : rt)
        );
    };
    const onDeleteRecurringTask = (taskId: string) => {
        setRecurringTasks(recurringTasks.filter(rt => rt.id !== taskId));
    };
    const handleAddRecurringSubtask = (taskId: string, text: string, days?: number[]) => {
        const newSubtask: RecurringTaskSubtaskTemplate = { id: crypto.randomUUID(), text, recurrenceDays: days };
        setRecurringTasks(recurringTasks.map(rt => 
            rt.id === taskId ? { ...rt, subtasks: [...rt.subtasks, newSubtask] } : rt
        ));
    };
    const onDeleteRecurringSubtask = (taskId: string, subtaskId: string) => {
        setRecurringTasks(recurringTasks.map(rt =>
            rt.id === taskId ? { ...rt, subtasks: rt.subtasks.filter(st => st.id !== subtaskId) } : rt
        ));
    };

    // Goal Trackers
    const handleAddGoalTracker = (name: string, type: TrackerType, linkedCategoryId?: string, target?: number, color?: string) => {
        const newTracker: GoalTracker = { 
            id: crypto.randomUUID(), 
            name, 
            type,
            linkedCategoryId,
            target,
            color
        };
        setGoalTrackers([...goalTrackers, newTracker]);
    };
    const handleUpdateGoalTracker = (id: string, updates: Partial<GoalTracker>) => {
        setGoalTrackers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };
    const handleDeleteGoalTracker = (id: string) => {
        setGoalTrackers(goalTrackers.filter(t => t.id !== id));
    };

    // Stats Logging (Manual Entries & Overrides)
    const handleUpdateStatsLog = (date: string, trackerId: string, value: number | boolean | null) => {
        setStatsLogs(prev => ({
            ...prev,
            [date]: {
                ...(prev[date] || {}),
                [trackerId]: value
            }
        }));
    };

    const completionPercentage = useMemo(() => {
        const tasks = currentDailyLog.tasks;
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
    }, [currentDailyLog.tasks]);

    return (
        <div className="min-h-screen font-sans text-slate-100 relative selection:bg-indigo-500/30">
             {/* Global Background Mesh/Gradient */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                 <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
                 <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]"></div>
                 <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-slate-800/40 blur-[100px]"></div>
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Main Navigation */}
                <nav className="flex justify-center gap-4 mb-10">
                    <button
                        onClick={() => setCurrentView('planner')}
                        className={`relative flex items-center gap-2 px-8 py-2.5 rounded-2xl font-medium text-sm transition-all duration-300 ${
                            currentView === 'planner' 
                            ? 'bg-indigo-600/90 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] backdrop-blur-sm ring-1 ring-indigo-400/50' 
                            : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 ring-1 ring-white/5'
                        }`}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Planner
                    </button>
                    <button
                        onClick={() => setCurrentView('statistics')}
                        className={`relative flex items-center gap-2 px-8 py-2.5 rounded-2xl font-medium text-sm transition-all duration-300 ${
                            currentView === 'statistics' 
                            ? 'bg-indigo-600/90 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] backdrop-blur-sm ring-1 ring-indigo-400/50' 
                            : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 ring-1 ring-white/5'
                        }`}
                    >
                        <ChartBarIcon className="w-4 h-4" />
                        Statistics
                    </button>
                </nav>

                {currentView === 'planner' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Header completionPercentage={completionPercentage} selectedDate={selectedDate} />
                        <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
                        <main>
                            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mb-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="w-full sm:w-auto">
                                    <label htmlFor="day-type" className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Focus for the Day</label>
                                    <select
                                        id="day-type"
                                        value={currentDailyLog.dayTypeId || ''}
                                        onChange={(e) => handleSelectDayType(e.target.value)}
                                        className="bg-slate-800/50 border border-white/10 text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-64 p-3 transition-all hover:bg-slate-800"
                                    >
                                        <option value="" disabled>Choose a day type...</option>
                                        {dayTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex gap-4 w-full sm:w-auto justify-end">
                                     <button onClick={() => setDayTypeManagerOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5">
                                        <EditIcon className="w-4 h-4" /> Day Types
                                    </button>
                                     <button onClick={() => setCategoryManagerOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5">
                                        <SettingsIcon className="w-4 h-4" /> Categories
                                    </button>
                                  </div>
                                </div>
                            </div>

                            <TaskList
                                tasks={currentDailyLog.tasks}
                                categories={categories}
                                onToggleTask={handleToggleTask}
                                onDeleteTask={handleDeleteTask}
                                onAddSubtask={handleAddSubtask}
                                onDeleteSubtask={onDeleteSubtask}
                                onReorderCategories={handleReorderCategories}
                            />
                            <AddTaskForm categories={categories} onAddTask={handleAddTask} />
                        </main>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Statistics 
                            dailyLogs={dailyLogs}
                            dayTypes={dayTypes}
                            categories={categories}
                            goalTrackers={goalTrackers}
                            statsLogs={statsLogs}
                            onOpenTrackerManager={() => setTrackerManagerOpen(true)}
                            onUpdateStatsLog={handleUpdateStatsLog}
                        />
                    </div>
                )}

                <DayTypeManager
                    isOpen={isDayTypeManagerOpen}
                    onClose={() => setDayTypeManagerOpen(false)}
                    dayTypes={dayTypes}
                    categories={categories}
                    onAddDayType={handleAddDayType}
                    onUpdateDayType={handleUpdateDayType}
                    onDeleteDayType={handleDeleteDayType}
                />
                <CategoryManager
                    isOpen={isCategoryManagerOpen}
                    onClose={() => setCategoryManagerOpen(false)}
                    categories={categories}
                    recurringTasks={recurringTasks}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddRecurringTask={handleAddRecurringTask}
                    onUpdateRecurringTask={onUpdateRecurringTask}
                    onDeleteRecurringTask={onDeleteRecurringTask}
                    onAddRecurringSubtask={handleAddRecurringSubtask}
                    onDeleteRecurringSubtask={onDeleteRecurringSubtask}
                />
                <TrackerManager 
                    isOpen={isTrackerManagerOpen}
                    onClose={() => setTrackerManagerOpen(false)}
                    goalTrackers={goalTrackers}
                    categories={categories}
                    onAddTracker={handleAddGoalTracker}
                    onUpdateTracker={handleUpdateGoalTracker}
                    onDeleteTracker={handleDeleteGoalTracker}
                />
            </div>
        </div>
    );
}

export default App;
