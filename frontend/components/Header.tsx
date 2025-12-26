
import React from 'react';

interface Props {
  onWaiterLoginClick: () => void;
  onAdminLoginClick: () => void;
}

export const Header: React.FC<Props> = ({ onWaiterLoginClick, onAdminLoginClick }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight cursor-pointer">Gastro<span className="text-orange-600">Manager</span></span>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onAdminLoginClick}
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors bg-slate-100 hover:bg-orange-50 px-3 sm:px-4 py-2 rounded-lg"
        >
          Login Admin
        </button>
        <button 
          onClick={onWaiterLoginClick}
          className="text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 sm:px-4 py-2 rounded-lg transition-all"
        >
          Área do Garçom
        </button>
      </div>
    </header>
  );
};
