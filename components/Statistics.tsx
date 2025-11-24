
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyLog, Category, GoalTracker, Task, StatsLog, DayType, TrackerType } from '../types';
import { AdjustmentsIcon, CheckIcon, ChevronDownIcon, CalendarIcon, HashIcon, PercentIcon } from './icons';

interface StatisticsProps {
  dailyLogs: { [date: string]: DailyLog };
  dayTypes: DayType[];
  categories: Category[];
  goalTrackers: GoalTracker[];
  statsLogs: StatsLog;
  onOpenTrackerManager: () => void;
  onUpdateStatsLog: (date: string, trackerId: string, value: number | boolean | null) => void;
}

type TimeView = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

// --- Helper Functions ---

const MIN_DATE = new Date('2025-01-01');

const calculateCompletion = (tasks: Task[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const valuePerTask = 100 / tasks.length;
    let totalPercentage = 0;
    tasks.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(st => st.completed).length;
            totalPercentage += (completedSubtasks / task.subtasks.length) * valuePerTask;
        } else if (task.completed) {
            totalPercentage += valuePerTask;
        }
    });
    return Math.round(totalPercentage);
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
};

const formatDate = (d: Date) => d.toISOString().split('T')[0];

const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    // ISO week starts on Monday (1). 
    // If Day is 1 (Mon) -> diff 0. 
    // If Day is 0 (Sun) -> diff -6.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
};

// Generates columns based on view. 
// daily -> [YYYY-MM-DD] (Single Day)
// weekly -> [YYYY-MM-DD, YYYY-MM-DD...] (Start dates of weeks)
// monthly -> [YYYY-01, YYYY-02...] (Months)
// yearly -> [2025, 2026...] (Years)
const generateTableColumns = (view: TimeView, refDate: string): string[] => {
    const current = new Date(refDate);
    const cols: string[] = [];

    if (view === 'daily') {
        cols.push(refDate);
    } else if (view === 'weekly') {
        // Show 5 weeks starting from refDate week
        const start = getStartOfWeek(current);
        for (let i = 0; i < 5; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + (i * 7));
            if (d >= MIN_DATE) cols.push(formatDate(d));
        }
    } else if (view === 'monthly') {
        // Show 12 months for the ref year
        const year = current.getFullYear();
        for (let i = 0; i < 12; i++) {
            // YYYY-MM format
            cols.push(`${year}-${String(i+1).padStart(2, '0')}`);
        }
    } else if (view === 'yearly') {
        // Show years from 2025 to current year + 1
        const startYear = 2025;
        const endYear = new Date().getFullYear() + 1;
        for (let y = startYear; y <= endYear; y++) {
            cols.push(y.toString());
        }
    }
    return cols;
};

const generateGraphDates = (view: TimeView, customStart: string, customEnd: string) => {
    let start = new Date();
    let end = new Date();
    
    end.setHours(23, 59, 59, 999);

    if (view === 'daily') {
        start.setDate(end.getDate() - 29); 
    } else if (view === 'weekly') {
        start.setDate(end.getDate() - (12 * 7)); 
    } else if (view === 'monthly') {
        start.setMonth(end.getMonth() - 11); 
        start.setDate(1);
    } else if (view === 'yearly') {
        start.setFullYear(end.getFullYear() - 2); 
        start.setMonth(0, 1);
    } else {
        start = new Date(customStart);
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
    }

    if (start < MIN_DATE) start = new Date(MIN_DATE);
    if (start > end) return [];

    const dates = [];
    const current = new Date(start);
    current.setHours(0,0,0,0);
    
    while (current <= end) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }
    return dates.reverse(); 
};

const groupGraphDates = (dates: string[], view: TimeView) => {
    if (view === 'daily' || view === 'custom') return dates;

    const groups: { [key: string]: string[] } = {};
    dates.forEach(date => {
        const d = new Date(date);
        let key = '';
        if (view === 'weekly') {
            const [year, week] = getWeekNumber(d);
            key = `Week ${week}, ${year}`;
        } else if (view === 'monthly') {
            key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        } else if (view === 'yearly') {
            key = d.getFullYear().toString();
        }
        
        if (key) {
            if (!groups[key]) groups[key] = [];
            groups[key].push(date);
        }
    });
    return Object.keys(groups);
};


const Statistics: React.FC<StatisticsProps> = ({ 
    dailyLogs, dayTypes, categories, goalTrackers, statsLogs, 
    onOpenTrackerManager, onUpdateStatsLog 
}) => {
  // --- Table State ---
  const [tableView, setTableView] = useState<TimeView>('weekly');
  const [tableRefDate, setTableRefDate] = useState(formatDate(new Date())); 

  // --- Graph State ---
  const [graphView, setGraphView] = useState<TimeView>('daily');
  const [graphCustomStart, setGraphCustomStart] = useState(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [graphCustomEnd, setGraphCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  
  const [trendMetricIndex, setTrendMetricIndex] = useState(0); 
  const [isTrendOpen, setIsTrendOpen] = useState(true);
  const [isComparativeOpen, setIsComparativeOpen] = useState(true);

  // --- Data Resolvers ---
  
  const getGlobalCompletion = (date: string): number => {
      const override = statsLogs[date]?.['global_completion'];
      if (override !== undefined && override !== null) return override as number;
      const log = dailyLogs[date];
      return log ? calculateCompletion(log.tasks) : 0;
  };

  const getCellValue = (date: string, tracker: GoalTracker): number | boolean | null => {
      const override = statsLogs[date]?.[tracker.id];
      if (override !== undefined && override !== null) return override;

      if (tracker.linkedCategoryId) {
          const log = dailyLogs[date];
          if (!log) return null;
          const tasks = tracker.linkedCategoryId === 'all' 
             ? log.tasks 
             : log.tasks.filter(t => t.categoryId === tracker.linkedCategoryId);
          if (tasks.length === 0) return null;
          return calculateCompletion(tasks);
      }
      return null;
  };

  // Aggregates data for Weekly (Week of...), Monthly (YYYY-MM), or Yearly (YYYY)
  const getAggregatedValueForColumn = (colKey: string, view: TimeView, tracker?: GoalTracker): string | number => {
      const datesToAggregate: string[] = [];

      if (view === 'weekly') {
          // colKey is start of week YYYY-MM-DD
          const start = new Date(colKey);
          for (let i = 0; i < 7; i++) {
              const d = new Date(start);
              d.setDate(start.getDate() + i);
              if (d >= MIN_DATE) datesToAggregate.push(formatDate(d));
          }
      } else if (view === 'monthly') {
          // colKey is YYYY-MM
          const [year, month] = colKey.split('-').map(Number);
          const d = new Date(year, month - 1, 1);
          while (d.getMonth() === month - 1) {
             if (d >= MIN_DATE) datesToAggregate.push(formatDate(d));
             d.setDate(d.getDate() + 1);
          }
      } else if (view === 'yearly') {
          // colKey is YYYY
          const year = parseInt(colKey);
          const d = new Date(year, 0, 1);
          while (d.getFullYear() === year) {
              if (d >= MIN_DATE) datesToAggregate.push(formatDate(d));
              d.setDate(d.getDate() + 1);
          }
      }

      return getAggregatedValue(datesToAggregate, tracker);
  };

  const getAggregatedValue = (datesInGroup: string[], tracker?: GoalTracker): string | number => {
      if (datesInGroup.length === 0) return '-';

      // Global Completion Average
      if (!tracker) {
          let sum = 0;
          let count = 0;
          datesInGroup.forEach(d => {
              const val = getGlobalCompletion(d);
              if (val > 0) { // Only count days with activity? Or all days? Assuming all for average.
                 sum += val;
                 count++;
              }
          });
          // If no data points, return 0 or -? Let's say 0 if it's a valid date range.
          return count > 0 ? Math.round(sum / count) : 0;
      }

      // Tracker Aggregation
      let sum = 0;
      let count = 0;
      
      datesInGroup.forEach(d => {
          const val = getCellValue(d, tracker);
          if (val !== null) {
              if (typeof val === 'boolean') {
                   if (val) sum++;
                   count++; 
              } else {
                  sum += val;
                  count++;
              }
          }
      });

      if (count === 0) return '-';

      if (tracker.type === 'percent') return Math.round(sum / count); 
      if (tracker.type === 'count') return sum; 
      if (tracker.type === 'check') return `${sum}/${count}`;
      
      return 0;
  };


  // --- Table Data Preparation ---
  const tableColumns = useMemo(() => generateTableColumns(tableView, tableRefDate), [tableView, tableRefDate]);

  const navigateTable = (direction: -1 | 1) => {
      const d = new Date(tableRefDate);
      if (tableView === 'daily') {
          d.setDate(d.getDate() + direction);
      } else if (tableView === 'weekly') {
          // Jump 5 weeks
          d.setDate(d.getDate() + (direction * 7 * 5));
      } else if (tableView === 'monthly') {
          // Jump 1 year
          d.setFullYear(d.getFullYear() + direction);
      } else if (tableView === 'yearly') {
          // No nav for yearly really, but can shift if needed
      }
      setTableRefDate(formatDate(d));
  };

  const getTableLabel = () => {
      const d = new Date(tableRefDate);
      if (tableView === 'daily') {
          return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
      if (tableView === 'weekly') {
          // Show range of the 5 weeks
          const start = getStartOfWeek(d);
          const end = new Date(start);
          end.setDate(end.getDate() + (5 * 7) - 1);
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      if (tableView === 'monthly') {
          return d.getFullYear().toString();
      }
      if (tableView === 'yearly') {
          return 'Yearly Overview';
      }
      return 'Custom Range';
  }

  const formatColumnHeader = (colKey: string): string => {
      if (tableView === 'daily') {
          const d = new Date(colKey + 'T00:00:00');
          return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      }
      if (tableView === 'weekly') {
          const start = new Date(colKey + 'T00:00:00');
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          // "Nov 24 - Nov 30"
          const sM = start.toLocaleDateString('en-US', { month: 'short' });
          const sD = start.getDate();
          const eM = end.toLocaleDateString('en-US', { month: 'short' });
          const eD = end.getDate();
          if (sM === eM) return `${sM} ${sD} - ${eD}`;
          return `${sM} ${sD} - ${eM} ${eD}`;
      }
      if (tableView === 'monthly') {
          // colKey YYYY-MM
          const m = parseInt(colKey.split('-')[1]);
          const date = new Date(2000, m - 1, 1);
          return date.toLocaleDateString('en-US', { month: 'short' });
      }
      if (tableView === 'yearly') {
          return colKey;
      }
      return colKey;
  }


  // --- Graph Data Preparation ---
  const graphDates = useMemo(() => generateGraphDates(graphView, graphCustomStart, graphCustomEnd), [graphView, graphCustomStart, graphCustomEnd]);
  const graphGroups = useMemo(() => groupGraphDates(graphDates, graphView), [graphDates, graphView]);
  
  // Slideshow Logic
  const trendMetrics = useMemo(() => [
      { id: 'global', name: 'Global Todos', type: 'percent' as TrackerType, color: '#818cf8' },
      ...goalTrackers.filter(t => t.type !== 'check')
  ], [goalTrackers]);
  
  const currentTrendMetric = trendMetrics[trendMetricIndex] || trendMetrics[0];

  const trendData = useMemo(() => {
      const groups = [...graphGroups].reverse(); 
      return groups.map(group => {
          const datesInGroup = graphDates.filter(d => {
               if (graphView === 'daily' || graphView === 'custom') return d === group;
               const dateObj = new Date(d);
               let key = '';
               if (graphView === 'weekly') {
                   const [year, week] = getWeekNumber(dateObj);
                   key = `Week ${week}, ${year}`;
               } else if (graphView === 'monthly') {
                   key = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
               } else if (graphView === 'yearly') {
                   key = dateObj.getFullYear().toString();
               }
               return key === group;
          });
          
          const tracker = currentTrendMetric.id === 'global' 
             ? undefined 
             : goalTrackers.find(t => t.id === currentTrendMetric.id);
          
          const val = getAggregatedValue(datesInGroup, tracker); 
          return {
              label: group,
              value: typeof val === 'number' ? val : 0
          };
      });
  }, [graphGroups, graphDates, graphView, dailyLogs, statsLogs, currentTrendMetric, goalTrackers]);

  const comparativeData = useMemo(() => {
      return goalTrackers.map(tracker => {
          if (tracker.type === 'check') return null;
          const val = getAggregatedValue(graphDates, tracker);
          return {
              name: tracker.name,
              value: typeof val === 'number' ? val : 0,
              type: tracker.type,
              color: tracker.color
          };
      }).filter(Boolean) as { name: string, value: number, type: TrackerType, color?: string }[];
  }, [goalTrackers, graphDates, dailyLogs, statsLogs]);

  const handleTrendMetricChange = (dir: -1 | 1) => {
      setTrendMetricIndex(prev => {
          let next = prev + dir;
          if (next < 0) next = trendMetrics.length - 1;
          if (next >= trendMetrics.length) next = 0;
          return next;
      });
  };

  return (
    <div className="space-y-12 pb-24 min-h-[80vh]">
        
        {/* --- TABLE SECTION --- */}
        <section>
             <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Performance Scorecard</h2>
                    <p className="text-slate-400 mt-1 text-sm">Detailed breakdown of your habits and goals</p>
                </div>
                <button 
                    onClick={onOpenTrackerManager}
                    className="bg-indigo-600/80 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all backdrop-blur-sm ring-1 ring-indigo-400/50"
                >
                    <AdjustmentsIcon className="w-5 h-5" />
                    <span className="font-medium">Manage Metrics</span>
                </button>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <ViewSelector 
                        selected={tableView} 
                        onChange={(v) => { 
                            setTableView(v); 
                            setTableRefDate(formatDate(new Date())); 
                        }} 
                        options={['daily', 'weekly', 'monthly', 'yearly']} 
                    />
                </div>

                {/* Date Navigation & Table Header */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5">
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                        <button onClick={() => navigateTable(-1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 text-indigo-400"/>
                            <span className="text-lg font-bold text-slate-200">{getTableLabel()}</span>
                        </div>
                        <button onClick={() => navigateTable(1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* TRANSPOSED TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-slate-900/80">
                                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-r border-white/5 w-56 sticky left-0 bg-slate-900/95 z-20 backdrop-blur-xl">
                                        Metric
                                    </th>
                                    {tableColumns.map(colKey => {
                                        const label = formatColumnHeader(colKey);
                                        const isToday = formatDate(new Date()) === colKey && tableView === 'daily';
                                        return (
                                            <th key={colKey} className={`px-6 py-4 border-b border-white/5 min-w-[120px] text-center whitespace-nowrap font-semibold ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                {label}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {tableColumns.length === 0 ? (
                                    <tr><td colSpan={100} className="p-12 text-center text-slate-500 italic">No history available prior to 2025</td></tr>
                                ) : (
                                    <>
                                        {/* Row 1: Global Completion */}
                                        <tr className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5 font-medium text-white border-r border-white/5 sticky left-0 bg-slate-900/90 z-10 backdrop-blur-md group-hover:bg-slate-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                                    <span className="font-bold text-slate-200">Global Todos</span>
                                                </div>
                                            </td>
                                            {tableColumns.map(colKey => {
                                                const isDaily = tableView === 'daily';
                                                const val = isDaily ? getGlobalCompletion(colKey) : getAggregatedValueForColumn(colKey, tableView);
                                                return (
                                                    <td key={colKey} className="px-4 py-3 text-center border-r border-white/5 last:border-r-0">
                                                        {isDaily ? (
                                                            <EditableCell 
                                                                value={val as number} 
                                                                type="percent"
                                                                onSave={(v) => onUpdateStatsLog(colKey, 'global_completion', v)}
                                                            />
                                                        ) : (
                                                            <span className="font-bold text-indigo-300">{val}%</span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>

                                        {/* Subsequent Rows: Goal Trackers */}
                                        {goalTrackers.map(tracker => (
                                            <tr key={tracker.id} className="group hover:bg-white/[0.02] transition-colors border-t border-white/5">
                                                <td className="px-6 py-5 font-medium text-white border-r border-white/5 sticky left-0 bg-slate-900/90 z-10 backdrop-blur-md group-hover:bg-slate-900">
                                                     <div className="flex items-center gap-3">
                                                        <div className="w-1 h-6 rounded-full opacity-80" style={{ backgroundColor: tracker.color || '#6366f1' }}></div>
                                                        <span className="truncate max-w-[140px] text-slate-300 font-medium" title={tracker.name}>{tracker.name}</span>
                                                    </div>
                                                </td>
                                                {tableColumns.map(colKey => {
                                                    const isDaily = tableView === 'daily';
                                                    const val = isDaily ? getCellValue(colKey, tracker) : getAggregatedValueForColumn(colKey, tableView, tracker);
                                                    return (
                                                        <td key={colKey} className="px-4 py-3 text-center border-r border-white/5 last:border-r-0">
                                                            {isDaily ? (
                                                                <EditableCell 
                                                                    value={val as number | boolean | null} 
                                                                    type={tracker.type}
                                                                    target={tracker.target}
                                                                    onSave={(v) => onUpdateStatsLog(colKey, tracker.id, v)}
                                                                />
                                                            ) : (
                                                                <span className="text-slate-400">
                                                                    {val}{tracker.type === 'percent' && typeof val === 'number' ? '%' : ''}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        {/* --- GRAPHS SECTION --- */}
        <section className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4 pt-8 border-t border-white/10">
                <h2 className="text-2xl font-bold text-white">Performance Graphs</h2>
                
                <div className="flex flex-col items-end gap-3">
                    <ViewSelector 
                        selected={graphView} 
                        onChange={setGraphView} 
                        options={['daily', 'weekly', 'monthly', 'yearly', 'custom']} 
                    />
                    {graphView === 'custom' && (
                         <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-white/10">
                            <input type="date" value={graphCustomStart} min="2025-01-01" onChange={e => setGraphCustomStart(e.target.value)} className="bg-slate-900/50 text-white text-xs rounded p-1 border border-white/10"/>
                            <span className="text-slate-500">-</span>
                            <input type="date" value={graphCustomEnd} min="2025-01-01" onChange={e => setGraphCustomEnd(e.target.value)} className="bg-slate-900/50 text-white text-xs rounded p-1 border border-white/10"/>
                        </div>
                    )}
                </div>
            </div>

            {/* Collapsible Trend Graph with Slideshow */}
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 shadow-2xl ring-1 ring-white/5">
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white/5 border-b border-white/5">
                    <button 
                         onClick={() => setIsTrendOpen(!isTrendOpen)}
                         className="flex items-center gap-3 hover:text-white transition-colors text-slate-200 group"
                    >
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                             <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold">Trend Analysis: <span style={{ color: currentTrendMetric.color || '#818cf8' }}>{currentTrendMetric.name}</span></h3>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isTrendOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isTrendOpen && (
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                             <button onClick={() => handleTrendMetricChange(-1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors" title="Previous Metric">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                             </button>
                             <span className="text-xs text-slate-500 font-mono font-bold w-16 text-center">{trendMetricIndex + 1} / {trendMetrics.length}</span>
                             <button onClick={() => handleTrendMetricChange(1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors" title="Next Metric">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                             </button>
                        </div>
                    )}
                </div>
                
                {isTrendOpen && (
                    <div className="p-6 h-[400px]">
                        <ImprovedLineChart data={trendData} color={currentTrendMetric.color || '#818cf8'} />
                    </div>
                )}
            </div>

            {/* Collapsible Comparative Graph */}
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 shadow-2xl ring-1 ring-white/5">
                 <button 
                    onClick={() => setIsComparativeOpen(!isComparativeOpen)}
                    className="w-full flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 border-b border-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-200">Average Comparisons</h3>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isComparativeOpen ? 'rotate-180' : ''}`} />
                </button>
                 {isComparativeOpen && (
                    <div className="p-6 h-[400px]">
                         <ImprovedBarChart data={comparativeData} />
                    </div>
                 )}
            </div>

        </section>
    </div>
  );
};

// --- Sub-components ---

const ViewSelector = ({ selected, onChange, options }: { selected: string, onChange: (v: any) => void, options: string[] }) => (
    <div className="bg-slate-900/60 p-1 rounded-xl inline-flex border border-white/10 backdrop-blur-sm">
        {options.map(opt => (
            <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg capitalize transition-all duration-300 ${
                    selected === opt 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
                {opt}
            </button>
        ))}
    </div>
);


const ImprovedLineChart = ({ data, color = '#818cf8' }: { data: { label: string, value: number }[], color?: string }) => {
    if (data.length < 1) return <div className="flex items-center justify-center h-full text-slate-500">No data available for 2025+</div>;

    const WIDTH = 1000;
    const HEIGHT = 400;
    const PADDING_LEFT = 60;
    const PADDING_BOTTOM = 40;
    const PADDING_TOP = 20;
    const PADDING_RIGHT = 30;

    const maxY = 100;
    
    // Scale functions
    const getX = (index: number) => PADDING_LEFT + (index / Math.max(1, data.length - 1)) * (WIDTH - PADDING_LEFT - PADDING_RIGHT);
    const getY = (value: number) => HEIGHT - PADDING_BOTTOM - (value / maxY) * (HEIGHT - PADDING_BOTTOM - PADDING_TOP);

    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
    
    // Create area path
    const areaPath = `${points} ${getX(data.length - 1)},${HEIGHT - PADDING_BOTTOM} ${getX(0)},${HEIGHT - PADDING_BOTTOM}`;

    return (
        <div className="w-full h-full">
             <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={`chartGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid Lines (Y Axis) */}
                {[0, 25, 50, 75, 100].map(tick => (
                    <g key={tick}>
                        <line 
                            x1={PADDING_LEFT} 
                            y1={getY(tick)} 
                            x2={WIDTH - PADDING_RIGHT} 
                            y2={getY(tick)} 
                            stroke="#334155" 
                            strokeWidth="1" 
                            strokeDasharray="4 4"
                            opacity="0.5"
                        />
                        <text x={PADDING_LEFT - 10} y={getY(tick) + 4} textAnchor="end" className="text-xs fill-slate-500 font-mono" style={{fontSize: '12px'}}>
                            {tick}%
                        </text>
                    </g>
                ))}

                {/* X Axis Line */}
                <line x1={PADDING_LEFT} y1={HEIGHT - PADDING_BOTTOM} x2={WIDTH - PADDING_RIGHT} y2={HEIGHT - PADDING_BOTTOM} stroke="#475569" strokeWidth="2"/>

                {/* Data Path */}
                <polygon points={areaPath} fill={`url(#chartGradient-${color})`} />
                <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

                {/* X Axis Labels (Limit to ~6-8 labels to prevent overlap) */}
                {data.map((d, i) => {
                    const step = Math.ceil(data.length / 10);
                    if (i % step !== 0 && i !== data.length - 1) return null;
                    
                    return (
                        <text key={i} x={getX(i)} y={HEIGHT - 10} textAnchor="middle" className="text-xs fill-slate-400 font-medium" style={{fontSize: '12px'}}>
                            {d.label}
                        </text>
                    )
                })}

                {/* Tooltip Dots */}
                {data.map((d, i) => (
                    <g key={`v-${i}`} className="group">
                         <circle cx={getX(i)} cy={getY(d.value)} r="4" fill="#0f172a" stroke={color} strokeWidth="2" className="group-hover:r-6 transition-all cursor-pointer z-10"/>
                         <circle cx={getX(i)} cy={getY(d.value)} r="10" fill={color} opacity="0" className="group-hover:opacity-30 transition-all cursor-pointer"/>
                         <title>{d.label}: {d.value}</title>
                    </g>
                ))}
            </svg>
        </div>
    );
};

const ImprovedBarChart = ({ data }: { data: { name: string, value: number, type: TrackerType, color?: string }[] }) => {
    if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-500">No trackers to display</div>;
    
    const WIDTH = 1000;
    const HEIGHT = 400;
    const PADDING_LEFT = 60;
    const PADDING_BOTTOM = 40;
    const PADDING_TOP = 20;
    const PADDING_RIGHT = 30;

    const maxValue = Math.max(...data.map(d => d.value), 10) * 1.1; // Add 10% headroom
    
    const getY = (value: number) => HEIGHT - PADDING_BOTTOM - (value / maxValue) * (HEIGHT - PADDING_BOTTOM - PADDING_TOP);
    const barWidth = (WIDTH - PADDING_LEFT - PADDING_RIGHT) / data.length * 0.5;

    return (
        <div className="w-full h-full">
             <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full overflow-visible">
                 {/* Grid Lines */}
                 {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                     const val = maxValue * pct;
                     return (
                        <g key={pct}>
                            <line x1={PADDING_LEFT} y1={getY(val)} x2={WIDTH - PADDING_RIGHT} y2={getY(val)} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
                            <text x={PADDING_LEFT - 10} y={getY(val) + 4} textAnchor="end" className="text-xs fill-slate-500 font-mono" style={{fontSize: '12px'}}>
                                {Math.round(val)}
                            </text>
                        </g>
                     )
                 })}

                 {/* X Axis */}
                 <line x1={PADDING_LEFT} y1={HEIGHT - PADDING_BOTTOM} x2={WIDTH - PADDING_RIGHT} y2={HEIGHT - PADDING_BOTTOM} stroke="#475569" strokeWidth="2"/>

                 {/* Bars */}
                 {data.map((d, i) => {
                     const x = PADDING_LEFT + (WIDTH - PADDING_LEFT - PADDING_RIGHT) * (i / data.length) + ((WIDTH - PADDING_LEFT - PADDING_RIGHT) / data.length - barWidth) / 2;
                     const y = getY(d.value);
                     const height = HEIGHT - PADDING_BOTTOM - y;
                     const color = d.color || (d.type === 'percent' ? '#10b981' : '#6366f1');

                     return (
                         <g key={i} className="group">
                             <rect 
                                x={x} 
                                y={y} 
                                width={barWidth} 
                                height={height} 
                                rx="6"
                                fill={color}
                                className="transition-all duration-300 hover:opacity-80"
                                filter="url(#glow)"
                             />
                             <text x={x + barWidth/2} y={HEIGHT - 10} textAnchor="middle" className="text-xs fill-slate-400 font-medium" style={{fontSize: '12px'}}>
                                 {d.name.length > 12 ? d.name.substring(0,10)+'..' : d.name}
                             </text>
                             {/* Tooltip Label on top of bar */}
                             <text x={x + barWidth/2} y={y - 10} textAnchor="middle" className="text-sm fill-white opacity-0 group-hover:opacity-100 transition-all duration-300" style={{fontWeight: 'bold'}}>
                                 {d.value}{d.type === 'percent' ? '%' : ''}
                             </text>
                         </g>
                     )
                 })}
            </svg>
        </div>
    )
}

const EditableCell = ({ value, type, target, onSave }: { value: number | boolean | null, type: TrackerType, target?: number, onSave: (val: number | boolean | null) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value === null ? '' : String(value));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditValue(value === null ? '' : String(value));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (editValue === '') {
            onSave(null); 
        } else {
            if (type === 'check') {
            } else {
                const num = parseFloat(editValue);
                onSave(isNaN(num) ? null : num);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleBlur();
    };

    if (type === 'check') {
        return (
            <div 
                onClick={() => onSave(!value)} 
                className="cursor-pointer flex items-center justify-center h-full w-full hover:bg-white/10 rounded-md transition-all duration-200"
            >
                {value ? (
                     <div className="bg-emerald-500/20 p-1 rounded">
                        <CheckIcon className="w-5 h-5 text-emerald-400"/>
                     </div>
                ) : <div className="w-4 h-4 rounded border border-slate-600/50 hover:border-slate-400"></div>}
            </div>
        );
    }

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="number"
                className="w-full bg-slate-800 text-white text-center text-sm p-1.5 rounded border border-indigo-500 outline-none shadow-lg"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
        );
    }

    return (
        <div 
            onClick={() => { setEditValue(value === null ? '' : String(value)); setIsEditing(true); }}
            className="cursor-pointer h-full w-full flex items-center justify-center hover:text-indigo-300 hover:bg-white/5 rounded-md transition-colors py-2"
        >
            {value !== null ? (
                <span className={`font-mono ${type === 'percent' && (value as number) >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-200'}`}>
                    {value}{type === 'percent' ? '%' : ''}{type === 'count' && target ? <span className="text-slate-500 text-xs">/{target}</span> : ''}
                </span>
            ) : (
                <span className="text-slate-700">-</span>
            )}
        </div>
    );
}

export default Statistics;
