
import React, { useState } from 'react';
import { api } from '../services/api';

interface Props {
  onBack: () => void;
  onLogin: (data: any) => void;
}

export const AdminLogin: React.FC<Props> = ({ onBack, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    (async () => {
      try {
        const res = await api.loginAdmin(username, password);
        if (res && res.sucesso) {
          onLogin({ username });
        } else {
          alert('Credenciais inválidas');
        }
      } catch (e: any) {
        console.error('Erro no login admin:', e);
        alert('Erro ao conectar com o servidor: ' + (e?.message || e));
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-8 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Voltar para o Início</span>
      </button>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Login Admin</h1>
          <div className="flex items-center justify-center gap-2 mb-10 text-slate-500 uppercase tracking-widest text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></span>
            Acesso Restrito
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Usuário / Nome</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  required
                  type="text"
                  placeholder="Usuário Admin"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Senha</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 mt-4"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Acessar Painel'
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-slate-400">
            Ambiente seguro com criptografia de ponta.
          </p>
        </div>
      </div>
    </div>
  );
};
