
import React from 'react';

interface Props {
  restaurantName: string;
}

export const SuccessScreen: React.FC<Props> = ({ restaurantName }) => {
  return (
    <div className="text-center max-w-lg animate-in fade-in zoom-in duration-500">
      <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      
      <h1 className="text-4xl font-bold text-slate-900 mb-4">Tudo pronto!</h1>
      <p className="text-xl text-slate-600 mb-8">
        O estabelecimento <span className="font-bold text-slate-900">{restaurantName}</span> foi configurado com sucesso. Bem-vindo à sua nova gestão!
      </p>
      
      <div className="space-y-4">
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-lg"
        >
          Ir para o Painel Administrativo
        </button>
        
        <p className="text-sm text-slate-400">
          Você receberá um e-mail com as instruções de acesso em instantes.
        </p>
      </div>
    </div>
  );
};
