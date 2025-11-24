
export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id:string;
  text: string;
  completed: boolean;
  categoryId: string;
  isRecurring: boolean;
  subtasks?: Subtask[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface RecurringTaskSubtaskTemplate {
    id: string;
    text: string;
    recurrenceDays?: number[]; // 0 for Sunday, 6 for Saturday. If empty/undefined, inherits parent days.
}

export interface RecurringTaskTemplate {
  id: string;
  text: string;
  categoryId: string;
  daysOfWeek: number[]; // 0 for Sunday, 6 for Saturday
  subtasks: RecurringTaskSubtaskTemplate[];
}

export interface DayType {
  id: string;
  name: string;
  categoryIds: string[];
}

export interface DailyLog {
  date: string;
  dayTypeId: string | null;
  tasks: Task[];
}

export type TrackerType = 'percent' | 'count' | 'check';

export interface GoalTracker {
  id: string;
  name: string;
  type: TrackerType;
  target?: number; // For 'count' types (e.g. 250 in x/250)
  color?: string; // UI styling
  linkedCategoryId?: string; // If set, value is auto-calculated from this category (or 'all')
}

export interface StatsLog {
  [date: string]: {
    [trackerId: string]: number | boolean | null; // Stores the manual override value
  }
}
