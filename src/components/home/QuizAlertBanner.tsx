import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const QuizAlertBanner = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate('/quiz-league')}
      className="bg-red-600 hover:bg-red-700 transition-colors cursor-pointer w-full text-white py-3 px-4 shadow-md relative z-50"
    >
      <div className="container mx-auto flex items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-5 w-5 animate-pulse text-yellow-300" />
        
        {/* Custom blinking text class */}
        <span className="font-bold text-sm md:text-base tracking-wide animate-[pulse_1.5s_ease-in-out_infinite]">
          ALERT: INDIA'S 1ST BEYOND THE CLINICS NATIONAL HEALTHCARE QUIZ LEAGUE — CLICK FOR DETAILS
        </span>
        
        <AlertTriangle className="h-5 w-5 animate-pulse text-yellow-300" />
      </div>
    </div>
  );
};
