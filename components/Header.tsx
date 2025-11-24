
import React from 'react';

interface HeaderProps {
  completionPercentage: number;
  selectedDate: string;
}

const Header: React.FC<HeaderProps> = ({ completionPercentage, selectedDate }) => {
  const displayDate = new Date(selectedDate + 'T00:00:00');
  const dateString = displayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isToday = new Date().toISOString().split('T')[0] === selectedDate;

  return (
    <header className="mb-8 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            IntelliDay
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-3 text-lg font-light">
            {dateString}
            {!isToday && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Viewing History
              </span>
            )}
          </p>
        </div>
        <div className="text-right hidden md:block">
           <span className="text-sm text-slate-500 font-medium">Daily Progress</span>
           <div className="text-3xl font-bold text-white">{Math.round(completionPercentage)}%</div>
        </div>
      </div>

      <div className="relative h-4 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          style={{ width: `${completionPercentage}%` }}
        >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      {/* Mobile progress text */}
      <div className="md:hidden mt-2 flex justify-between text-xs font-medium text-slate-400">
        <span>Progress</span>
        <span>{Math.round(completionPercentage)}%</span>
      </div>
    </header>
  );
};

export default Header;
