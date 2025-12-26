
import React, { useState } from 'react';

interface Props {
  waiterName: string;
  onLogout: () => void;
  onOpenTable: (tableNumber: string) => void;
}

export const TableManagement: React.FC<Props> = ({ waiterName, onLogout, onOpenTable }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableInput, setTableInput] = useState('');

  const handleConfirmTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableInput.trim()) {
      onOpenTable(tableInput);
      setIsModalOpen(false);
      setTableInput('');
    }
  };

  return (
    <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
      {/* Top Header Section */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border-2 border-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Colaborador</p>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{waiterName}</h3>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="bg-white hover:bg-red-50 text-red-500 px-4 py-2 rounded-lg font-semibold text-sm border border-slate-200 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Atendimento — Garçom</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Action Cards */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800">Abrir Mesa</span>
              <p className="text-sm text-slate-500">Inicie um novo atendimento</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800">Mapa de Mesas</span>
              <p className="text-sm text-slate-500">Visualize o status do salão</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800">Entrar no Cardápio</span>
              <p className="text-sm text-slate-500">Consultar produtos e preços</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Table Number Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Número da Mesa</h3>
                <p className="text-slate-500 text-sm mt-1">Informe a mesa para iniciar o pedido</p>
              </div>

              <form onSubmit={handleConfirmTable} className="space-y-6">
                <input 
                  autoFocus
                  required
                  type="number"
                  placeholder="Ex: 25"
                  className="w-full text-center text-5xl font-black py-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-slate-900 outline-none transition-all placeholder:text-slate-200"
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                />
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setIsModalOpen(false); setTableInput(''); }}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-slate-200 transition-all"
                  >
                    Abrir Cardápio
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-orange-800">
          Clique em <span className="font-bold">"Mapa de Mesas"</span> para exibir as mesas ativas e pedidos em andamento.
        </p>
      </div>
    </div>
  );
};
