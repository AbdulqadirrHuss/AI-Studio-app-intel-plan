import React from 'react';

interface DateNavigatorProps {
    selectedDate: string;
    onDateChange: (newDate: string) => void;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const DateNavigator: React.FC<DateNavigatorProps> = ({ selectedDate, onDateChange }) => {
    
    const handleDateChange = (date: Date) => {
        onDateChange(date.toISOString().split('T')[0]);
    };

    const adjustDate = (days: number) => {
        // Correctly handle timezone offset when creating date from YYYY-MM-DD string
        const currentDate = new Date(selectedDate + 'T00:00:00');
        currentDate.setDate(currentDate.getDate() + days);
        handleDateChange(currentDate);
    };
    
    const isToday = selectedDate === getTodayDateString();

    return (
        <div className="flex items-center justify-between gap-4 p-4 bg-gray-800 rounded-lg shadow-lg mb-6">
            <button
                onClick={() => adjustDate(-1)}
                className="p-2 rounded-md bg-gray-700 hover:bg-indigo-500 transition-colors"
                aria-label="Previous day"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="flex-grow flex items-center justify-center gap-4">
                <button
                    onClick={() => onDateChange(getTodayDateString())}
                    disabled={isToday}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700 hover:bg-indigo-500 disabled:bg-indigo-600 disabled:text-white disabled:cursor-not-allowed transition-colors"
                >
                    Today
                </button>
                <div className="relative">
                     <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                    />
                </div>
            </div>
             <button
                onClick={() => adjustDate(1)}
                className="p-2 rounded-md bg-gray-700 hover:bg-indigo-500 transition-colors"
                aria-label="Next day"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default DateNavigator;
