
import React, { useState } from 'react';

interface Props {
  onLogout: () => void;
}

type AdminTab = 'home' | 'financeiro' | 'mesas' | 'cardapio' | 'categorias' | 'equipe' | 'avaliacoes' | 'mesas-fechadas' | 'ajustes';

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('home');

  const modules = [
    { id: 'financeiro', name: 'Financeiro', icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'mesas', name: 'Mesas', icon: '🪑', color: 'bg-blue-50 text-blue-600' },
    { id: 'cardapio', name: 'Cardápio', icon: '📖', color: 'bg-orange-50 text-orange-600' },
    { id: 'categorias', name: 'Categorias', icon: '📂', color: 'bg-purple-50 text-purple-600' },
    { id: 'equipe', name: 'Equipe', icon: '👥', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'avaliacoes', name: 'Avaliações', icon: '⭐', color: 'bg-yellow-50 text-yellow-600' },
    { id: 'mesas-fechadas', name: 'Mesas Fechadas', icon: '🔒', color: 'bg-slate-50 text-slate-600' },
    { id: 'ajustes', name: 'Ajustes', icon: '⚙️', color: 'bg-gray-50 text-gray-600' },
  ];

  const renderHome = () => (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {modules.map((module) => (
          <button 
            key={module.id}
            onClick={() => setActiveTab(module.id as AdminTab)}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className={`w-12 h-12 ${module.color} rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110`}>
              {module.icon}
            </div>
            <span className="text-sm font-bold text-slate-700">{module.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receita Total</p>
          <h4 className="text-2xl font-black text-slate-900">R$ 1262.96</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group cursor-pointer">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Taxa de Serviço (Total)</p>
          <h4 className="text-2xl font-black text-orange-600">R$ 106.09</h4>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Clique para ver detalhes das mesas que pagaram
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pedidos</p>
          <h4 className="text-2xl font-black text-slate-900">10</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group cursor-pointer" onClick={() => setActiveTab('avaliacoes')}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">NPS Médio</p>
          <div className="flex items-center gap-2">
            <h4 className="text-2xl font-black text-slate-900">0.0</h4>
            <span className="text-yellow-400 text-xl">★</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Clique para ver avaliações recentes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 overflow-hidden relative">
          <h5 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Mais Vendidos</h5>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl font-black">1</div>
            <div>
              <p className="text-2xl font-black tracking-tight mb-1">dark</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-500 text-[10px] font-bold uppercase">
                38 vds
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h5 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Mix de Categorias</h5>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">🍺</div>
              <span className="text-2xl font-black text-slate-800 italic">Cerveja</span>
            </div>
          </div>
          <div className="mt-6 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[70%] rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  );

  const renderMesas = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gerenciar Mesas</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-orange-200 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Mesa 25</h3>
              <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Status: Ocupada • Pedidos: 1
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
            <h4 className="text-2xl font-black text-slate-900">R$ 186.00</h4>
            <button className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
              Finalizar Mesa
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCardapio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Menu</h2>
        <button className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Item
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Item</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Preço</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Categoria</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-800">dark</td>
              <td className="px-6 py-4 font-black text-slate-900">R$ 31.00</td>
              <td className="px-6 py-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">Cerveja</span>
              </td>
              <td className="px-6 py-4">
                <button className="text-slate-400 hover:text-orange-600 transition-colors">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCategorias = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Gestão de Categorias</h2>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <label className="block text-sm font-bold text-slate-700 mb-2">Nova Categoria</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Ex: Sobremesas, Petiscos..." 
            className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
            Adicionar Categoria
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nome da Categoria</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-800">Cerveja</td>
              <td className="px-6 py-4">
                <button className="text-red-400 hover:text-red-600 font-medium">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEquipe = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Gestão de Equipe</h2>
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Novo Colaborador</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input type="text" placeholder="Nome do Garçom..." className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"/>
          <input type="password" placeholder="Senha de Acesso..." className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all">
          Cadastrar Garçom
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Colaborador</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {['Douglas', 'Waiter Test'].map(name => (
              <tr key={name} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                   {name}
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-orange-600 mr-4">Editar</button>
                  <button className="text-red-400 hover:text-red-600">Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAvaliacoes = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Avaliações dos Clientes</h2>
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 text-center shadow-sm">
        <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-yellow-400 text-5xl">★</span>
        </div>
        <h3 className="text-4xl font-black text-slate-900 mb-2">0.0 NPS</h3>
        <p className="text-slate-500">Nenhuma avaliação recebida até o momento.</p>
      </div>
    </div>
  );

  const renderMesasFechadas = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Mesas Finalizadas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { mesa: '1', pedidos: 1, total: '36.14', clients: [{name: 'Cliente 1', sub: '31.98', serv: '4.16'}] },
          { mesa: '101', pedidos: 1, total: '23.73', clients: [{name: 'Cliente 1', sub: '21.00', serv: '2.73'}] },
          { mesa: '100', pedidos: 2, total: '341.00', clients: [{name: 'Cliente 1', sub: '124.00', serv: '12.40'}, {name: 'Cliente 2', sub: '186.00', serv: '18.60'}] },
          { mesa: '30', pedidos: 2, total: '409.20', clients: [{name: 'Cliente 1', sub: '186.00', serv: '18.60'}, {name: 'Cliente 2', sub: '186.00', serv: '18.60'}] }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-black text-slate-900">Mesa {item.mesa}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase">Pedidos: {item.pedidos}</span>
            </div>
            <div className="flex-grow space-y-3 mb-6">
              {item.clients.map((c, cidx) => (
                <div key={cidx} className="flex justify-between text-sm py-2 border-b border-slate-50">
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-[10px] text-slate-400">Serviço: R$ {c.serv}</p>
                  </div>
                  <p className="font-black text-slate-900">R$ {c.sub}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-auto">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
               <h4 className="text-2xl font-black text-emerald-600">R$ {item.total}</h4>
               <p className="text-[10px] text-slate-400 italic mt-1">(Inclui taxa de serviço 10%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAjustes = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Ajustes da Plataforma</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <span className="text-2xl">⚡</span> Configurações de Serviço
          </h3>
          <label className="block text-sm font-bold text-slate-700 mb-2">Taxa de Serviço (%)</label>
          <div className="relative">
            <input type="number" defaultValue="10" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"/>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <span className="text-2xl">🎨</span> Personalização de Tema
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Fundo Geral', color: '#06120c' },
              { label: 'Fundo de Cartões', color: '#0d1f15' },
              { label: 'Cor de Texto', color: '#fefce8' },
              { label: 'Cor Primária (Botões)', color: '#d18a59' },
              { label: 'Cor de Destaque', color: '#c17a49' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-mono text-slate-400">{item.color}</span>
                   <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{backgroundColor: item.color}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-100">
        Salvar Alterações
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header Section */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrador</p>
            <h3 className="text-xl font-bold text-slate-800">Administrador Master</h3>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="bg-white hover:bg-red-50 text-red-500 px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-200 transition-all flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4">
           {activeTab !== 'home' && (
             <button onClick={() => setActiveTab('home')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
             </button>
           )}
           <div>
             <h1 className="text-3xl font-extrabold text-slate-900">
               {activeTab === 'home' ? 'Painel de Gestão' : modules.find(m => m.id === activeTab)?.name}
             </h1>
             <div className="flex items-center gap-2 text-slate-500 font-medium mt-1">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               Sessão Administrativa •
             </div>
           </div>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'mesas' && renderMesas()}
        {activeTab === 'cardapio' && renderCardapio()}
        {activeTab === 'categorias' && renderCategorias()}
        {activeTab === 'equipe' && renderEquipe()}
        {activeTab === 'avaliacoes' && renderAvaliacoes()}
        {activeTab === 'mesas-fechadas' && renderMesasFechadas()}
        {activeTab === 'ajustes' && renderAjustes()}
        {activeTab === 'financeiro' && renderHome()} {/* Financeiro is synonymous with Home metrics for now */}
      </div>
    </div>
  );
};
