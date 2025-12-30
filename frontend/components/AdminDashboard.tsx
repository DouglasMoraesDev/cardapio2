
import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../services/api';
import { useCallback } from 'react';

interface Props {
  onLogout: () => void;
}

type AdminTab = 'home' | 'financeiro' | 'mesas' | 'cardapio' | 'categorias' | 'equipe' | 'avaliacoes' | 'mesas-fechadas' | 'ajustes';

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [categories, setCategories] = useState<Array<any>>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoadingCats, setIsLoadingCats] = useState(false);

  const [products, setProducts] = useState<Array<any>>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState<{ nome?: string; preco?: number; descricao?: string; categoriaId?: number | null; imagem_url?: string | null }>({ categoriaId: null });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editProductData, setEditProductData] = useState<any>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [waiters, setWaiters] = useState<Array<any>>([]);
  const [isLoadingWaiters, setIsLoadingWaiters] = useState(false);
  const [newWaiterName, setNewWaiterName] = useState('');
  const [newWaiterPassword, setNewWaiterPassword] = useState('');
  const [creatingWaiter, setCreatingWaiter] = useState(false);

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

  const [stats, setStats] = useState<any>(null);
  const [avaliacoes, setAvaliacoes] = useState<Array<any>>([]);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [mesasAbertas, setMesasAbertas] = useState<Array<any>>([]);
  const [mesasFechadas, setMesasFechadas] = useState<Array<any>>([]);
  const [isLoadingMesas, setIsLoadingMesas] = useState(false);
  const [sseEnabled, setSseEnabled] = useState<boolean>(() => { try { return (localStorage.getItem('gm_admin_sse_enabled') || 'true') === 'true'; } catch (e) { return true; } });
  const [sseStatus, setSseStatus] = useState<'disconnected'|'connecting'|'connected'|'error'>('disconnected');
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const [pollInterval, setPollInterval] = useState<number>(() => { try { return Number(localStorage.getItem('gm_admin_poll_interval') || '8000'); } catch (e) { return 8000; } });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [periodStats, setPeriodStats] = useState<any>(null);
  const [closures, setClosures] = useState<Array<any>>([]);
  const [selectedClosure, setSelectedClosure] = useState<any>(null);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);

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

      {/* Resumo financeiro removido da tela inicial. Dados serão carregados somente ao abrir a aba "Financeiro". */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button onClick={() => openPreview('revenue')} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receita (Hoje)</p>
          <h4 className="text-2xl font-black text-slate-900">{stats ? Number(stats.totalRevenue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</h4>
          <p className="text-sm text-slate-500 mt-2">Valor gerado hoje (após último fechamento)</p>
        </button>

        <button onClick={() => openPreview('service')} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Taxa de Serviço (Hoje)</p>
          <h4 className="text-2xl font-black text-orange-600">{stats ? Number(stats.totalService).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</h4>
          <p className="text-sm text-slate-500 mt-2">Estimativa da taxa aplicada hoje</p>
        </button>

        <button onClick={() => openPreview('orders')} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pedidos (Hoje)</p>
          <h4 className="text-2xl font-black text-slate-900">{stats ? stats.ordersCount : 0}</h4>
          <p className="text-sm text-slate-500 mt-2">Total de pedidos no período</p>
        </button>

        <button onClick={() => openPreview('reviews')} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left hover:shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avaliações (Hoje)</p>
          <h4 className="text-2xl font-black text-slate-900">{stats ? stats.avaliacoesCount : 0}</h4>
          <p className="text-sm text-slate-500 mt-2">Avaliações recebidas no período</p>
        </button>
      </div>
    </>
  );

  const openModal = (title: string, body: any) => {
    setModalContent({ title, body });
    setModalOpen(true);
  };

  const fetchMesas = async (aberta?: boolean) => {
    try {
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      const res = await api.getMesas(estabId, aberta);
      return res || [];
    } catch (e) {
      console.error('Erro ao carregar mesas', e);
      return [];
    }
  };

  const startSSE = () => {
    if (eventSourceRef.current) return;
    setSseStatus('connecting');
    const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
    const url = `${API_BASE}/api/notifications/stream?estabelecimentoId=${estabId}`;
    try {
      const es = new EventSource(url);
      es.addEventListener('pedido_created', () => {
        // refresh open mesas
        fetchMesas(true).then(r => setMesasAbertas(r || [])).catch(() => {});
      });
      es.addEventListener('pedido_updated', () => {
        fetchMesas(true).then(r => setMesasAbertas(r || [])).catch(() => {});
        fetchMesas(false).then(r => setMesasFechadas(r || [])).catch(() => {});
      });
      es.addEventListener('mesa_fechamento_solicitado', () => {
        fetchMesas(true).then(r => setMesasAbertas(r || [])).catch(() => {});
        fetchMesas(false).then(r => setMesasFechadas(r || [])).catch(() => {});
      });
      es.addEventListener('garcom_chamado', () => {
        fetchMesas(true).then(r => setMesasAbertas(r || [])).catch(() => {});
      });
      es.addEventListener('avaliacao_created', (ev: any) => {
        try {
          const payload = JSON.parse(ev.data);
          setAvaliacoes(prev => [payload, ...prev]);
        } catch (e) { console.warn('Erro ao processar avaliacao_created SSE', e); }
      });
      es.onerror = (err) => { console.warn('Admin SSE error', err); setSseStatus('error'); };
      es.onopen = () => { setSseStatus('connected'); };
      eventSourceRef.current = es;
    } catch (e) {
      console.warn('Falha ao iniciar SSE admin', e);
      setSseStatus('error');
    }
  };

  const stopSSE = () => {
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close(); } catch (e) {}
      eventSourceRef.current = null;
    }
    setSseStatus('disconnected');
  };

  const updateItem = async (itemId: number, quantidade: number) => {
    try {
      const res = await api.updateItem(itemId, quantidade);
      // atualizar modal e listas
      if (modalContent && modalContent.type === 'mesa-details') {
        const mesa = modalContent.mesa;
        const updatedMesa = await fetchMesas();
        setMesasAbertas(updatedMesa.filter((m:any) => m.aberta));
        setMesasFechadas(updatedMesa.filter((m:any) => !m.aberta));
        // atualizar modal para refletir mudança
        const found = (await api.getMesas(Number(localStorage.getItem('gm_estabelecimentoId') || 0))).find((m:any) => m.id === mesa.id);
        setModalContent({ type: 'mesa-details', mesa: found });
      }
      return res;
    } catch (e) { console.error(e); throw e; }
  };

  const removeItem = async (itemId: number) => {
    try {
      const res = await api.deleteItem(itemId);
      const mesa = modalContent?.mesa;
      const updatedMesaList = await fetchMesas();
      setMesasAbertas(updatedMesaList.filter((m:any) => m.aberta));
      setMesasFechadas(updatedMesaList.filter((m:any) => !m.aberta));
      if (mesa) {
        const found = updatedMesaList.find((m:any) => m.id === mesa.id);
        setModalContent({ type: 'mesa-details', mesa: found });
      }
      return res;
    } catch (e) { console.error(e); throw e; }
  };

  const renderFinanceiro = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => openModal('Receita Total', stats)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receita Total (Hoje)</p>
          <h4 className="text-2xl font-black text-slate-900">R$ {stats ? Number(stats.totalRevenue).toFixed(2) : '0.00'}</h4>
        </div>
        <div onClick={() => openModal('Taxa de Serviço', stats)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Taxa de Serviço (Hoje)</p>
          <h4 className="text-2xl font-black text-orange-600">R$ {stats ? Number(stats.totalService).toFixed(2) : '0.00'}</h4>
        </div>
        <div onClick={() => openModal('Pedidos', stats)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pedidos (Hoje)</p>
          <h4 className="text-2xl font-black text-slate-900">{stats ? stats.ordersCount : 0}</h4>
        </div>
        <div onClick={() => openModal('Avaliações', stats)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avaliações (Hoje)</p>
          <h4 className="text-2xl font-black text-slate-900">{stats ? stats.avaliacoesCount : 0}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-4">Categorias Mais Vendidas</h3>
          {stats && stats.categoriesMostSold && stats.categoriesMostSold.length > 0 ? (
            <div className="space-y-3">
              {stats.categoriesMostSold.map((c:any, idx:number) => (
                <div key={c.categoria} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-slate-200 rounded" style={{ width: `${Math.min(100, (c.quantidade / (stats.categoriesMostSold[0].quantidade || 1)) * 100)}%` }} />
                    <div>{c.categoria}</div>
                  </div>
                  <div className="font-black">{c.quantidade}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-400">Nenhuma venda hoje.</p>}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-4">Produtos Mais Vendidos</h3>
          {stats && stats.productsMostSold && stats.productsMostSold.length > 0 ? (
            <ol className="space-y-3">
              {stats.productsMostSold.map((p:any) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-bold">{p.nome}</div>
                    <div className="text-[12px] text-slate-400">(R$ {Number(p.precoUnitario).toFixed(2)})</div>
                  </div>
                  <div className="font-black">{p.quantidade}</div>
                </li>
              ))}
            </ol>
          ) : <p className="text-slate-400">Nenhuma venda hoje.</p>}
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-4">
        <h3 className="text-lg font-bold mb-4">Fechamento Diário</h3>
        <p className="text-sm text-slate-500 mb-4">Resumo das receitas do período atual. Fechar o dia grava a data de fechamento e todo relatório futuro será calculado a partir desse momento.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-500">Data Início</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Data Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
          </div>
          <div className="flex items-end gap-2">
            <button disabled={isLoadingPeriod} onClick={async () => {
              try {
                setIsLoadingPeriod(true);
                const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                // Use start at 00:00:00 and end as next-day 00:00:00 so backend (gte start, lt end) includes full end day
                const s = new Date(startDate);
                s.setHours(0,0,0,0);
                const e = new Date(endDate);
                e.setHours(0,0,0,0);
                e.setDate(e.getDate() + 1);
                const startIso = s.toISOString();
                const endIso = e.toISOString();
                const statsPeriod = await api.getStatsPeriod(estabId, startIso, endIso);
                setPeriodStats(statsPeriod);
                // fetch closures and filter by range (using fechadoEm)
                const all = await api.getClosures();
                const filtered = (all || []).filter((c:any) => {
                  const t = new Date(c.fechadoEm || c.criadoEm || c.criado_em || c.createdAt || c.created_at || c.data || c.timestamp).getTime();
                  return t >= s.getTime() && t < e.getTime();
                });
                setClosures(filtered || []);
                setModalContent({ title: `Resumo ${startDate} → ${endDate}`, body: { ...statsPeriod, closures: filtered } });
                setModalOpen(true);
              } catch (e) { console.error(e); alert('Erro ao buscar período'); }
              finally { setIsLoadingPeriod(false); }
            }} className="bg-slate-100 px-4 py-2 rounded">{isLoadingPeriod ? 'Buscando...' : 'Buscar Período'}</button>
            <button onClick={async () => {
              try {
                const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                const stats = await api.getDailyStats(estabId);
                setModalContent({ title: 'Resumo Diário', body: stats });
                setModalOpen(true);
              } catch (e) { console.error(e); alert('Erro ao buscar resumo'); }
            }} className="bg-slate-100 px-4 py-2 rounded">Ver Resumo</button>
            <button onClick={async () => {
              if (!confirm('Confirma o fechamento do dia? Isso marcará o momento atual como último fechamento.')) return;
              try {
                const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                // fetch closed mesas right now to include accurate data in the fechamento
                const closedTables = await api.getMesas(estabId, false) || [];
                const res = await api.closeDay(closedTables);
                // refresh local closed mesas cache
                const refreshedClosed = await api.getMesas(estabId, false) || [];
                setMesasFechadas(refreshedClosed);
                // show modal with fechamento and included mesas (prefer server retorno)
                const fechamento = res?.fechamento || res;
                setModalContent({ title: 'Dia Fechado', body: { fechamento, mesas: fechamento?.mesas?.length ? fechamento.mesas : refreshedClosed } });
                setModalOpen(true);
              } catch (e) { console.error(e); alert('Erro ao fechar dia'); }
            }} className="bg-emerald-600 text-white px-4 py-2 rounded">Fechar Dia</button>
          </div>
        </div>

        {closures && closures.length > 0 && (
          <div className="mt-4">
            <h4 className="font-bold mb-2">Fechamentos encontrados</h4>
            <ul className="space-y-2">
              {closures.map((c:any) => (
                <li key={c.id || c.criadoEm || c.criado_em} className="flex items-center justify-between border p-2 rounded">
                  <div>
                    <div className="font-bold">Fechamento #{c.id ?? ''}</div>
                    <div className="text-sm text-slate-500">{new Date(c.criadoEm || c.criado_em || c.createdAt || c.created_at || c.data || c.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedClosure(c); setModalContent({ title: `Fechamento ${c.id ?? ''}`, body: c }); setModalOpen(true); }} className="px-3 py-1 bg-slate-100 rounded">Ver</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const renderMesas = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gerenciar Mesas</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mesasAbertas.map(mesa => {
          const pedidosCount = mesa.pedidos?.length || 0;
          const subtotal = (mesa.pedidos || []).reduce((acc:any, p:any) => acc + (p.total || 0), 0);
          return (
            <div key={mesa.id || mesa.numero} className="bg-white p-6 rounded-2xl border-2 border-orange-200 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Mesa {mesa.numero}</h3>
                  <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Status: {mesa.aberta ? 'Ocupada' : 'Fechada'} • Pedidos: {pedidosCount}
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
                <h4 className="text-2xl font-black text-slate-900">R$ {Number(subtotal).toFixed(2)}</h4>
                <div className="flex gap-2 mt-4">
                  <button onClick={async () => {
                    try {
                      if (!products || products.length === 0) {
                        setIsLoadingProducts(true);
                        const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                        const res = await api.getProducts(estabId);
                        setProducts(res || []);
                      }
                    } catch (e) { console.error('Erro ao carregar produtos para modal de mesa', e); }
                    finally { setIsLoadingProducts(false); }
                    setModalContent({ type: 'mesa-details', mesa });
                    setModalOpen(true);
                  }} className="flex-1 bg-white border border-slate-200 py-3 rounded-xl">Detalhes</button>
                  <button onClick={async () => {
                    try {
                      const taxaPaga = confirm('Taxa de serviço foi paga? OK = Sim');
                      await api.closeMesa(mesa.id ?? mesa.numero, taxaPaga);
                      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                      const open = await api.getMesas(estabId, true);
                      const closed = await api.getMesas(estabId, false);
                      setMesasAbertas(open || []);
                      setMesasFechadas(closed || []);
                      alert('Mesa finalizada');
                    } catch (e) { console.error(e); alert('Erro ao finalizar mesa'); }
                  }} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl">Finalizar Mesa</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    const load = async () => {
      if (activeTab === 'categorias') {
        setIsLoadingCats(true);
        try {
          const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
          const res = await api.getCategories(estabId);
          setCategories(res || []);
        } catch (e) {
          console.error('Erro ao carregar categorias', e);
        } finally {
          setIsLoadingCats(false);
        }
      }
      if (activeTab === 'cardapio') {
        setIsLoadingProducts(true);
        try {
          const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
          const res = await api.getProducts(estabId);
          setProducts(res || []);
        } catch (e) {
          console.error('Erro ao carregar produtos', e);
        } finally {
          setIsLoadingProducts(false);
        }
      }
      if (activeTab === 'equipe') {
        setIsLoadingWaiters(true);
        try {
          const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
          const res = await api.getWaiters(estabId);
          setWaiters(res || []);
        } catch (e) {
          console.error('Erro ao carregar garçons', e);
        } finally {
          setIsLoadingWaiters(false);
        }
      }
      if (activeTab === 'mesas') {
        setIsLoadingMesas(true);
        try {
          const open = await fetchMesas(true);
          setMesasAbertas(open || []);
        } catch (e) { console.error('Erro ao carregar mesas', e); }
        finally { setIsLoadingMesas(false); }
      }
      if (activeTab === 'mesas-fechadas') {
        setIsLoadingMesas(true);
        try {
          const closed = await fetchMesas(false);
          setMesasFechadas(closed || []);
        } catch (e) { console.error('Erro ao carregar mesas fechadas', e); }
        finally { setIsLoadingMesas(false); }
      }
      if (activeTab === 'financeiro' || activeTab === 'home') {
        try {
          const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
          const s = await api.getDailyStats(estabId);
          setStats(s);
        } catch (e) {
          console.error('Erro ao carregar estatísticas', e);
        }
      }
      if (activeTab === 'avaliacoes') {
        try {
          const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
          const res = await api.getAvaliacoes(estabId);
          setAvaliacoes(res || []);
        } catch (e) { console.error('Erro ao carregar avaliações', e); }
      }
    };
    load();
    let pollId: any = null;
    // use SSE when enabled, otherwise fallback to polling with configurable interval
    if (sseEnabled) {
      startSSE();
    } else if (activeTab === 'mesas' || activeTab === 'mesas-fechadas') {
      pollId = setInterval(async () => {
        try {
          if (activeTab === 'mesas') {
            const open = await fetchMesas(true);
            setMesasAbertas(open || []);
          } else {
            const closed = await fetchMesas(false);
            setMesasFechadas(closed || []);
          }
        } catch (e) { /* ignore */ }
      }, Math.max(1000, Number(pollInterval || 8000)));
    }
    return () => { if (pollId) clearInterval(pollId); if (sseEnabled) stopSSE(); };
  }, [activeTab]);

  const openPreview = async (type: 'revenue' | 'service' | 'orders' | 'reviews' | 'categories' | 'products') => {
    try {
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      if (type === 'reviews') {
        const all = await api.getAvaliacoes(estabId);
        const five = (all || []).filter((a:any) => Number(a.estrelas) === 5).slice(0,5);
        setModalContent({ type: 'preview', previewType: 'reviews', body: { reviews: five } });
        setModalOpen(true);
        return;
      }
      // categories / products data come from stats
      if (!stats) {
        const s = await api.getDailyStats(estabId);
        setStats(s);
      }
      if (type === 'categories') {
        setModalContent({ type: 'preview', previewType: 'categories', body: { categories: (stats && stats.categoriesMostSold) || [] } });
        setModalOpen(true);
        return;
      }
      if (type === 'products') {
        setModalContent({ type: 'preview', previewType: 'products', body: { products: (stats && stats.productsMostSold) || [] } });
        setModalOpen(true);
        return;
      }
      // simple show stats for revenue/service/orders
      setModalContent({ title: type === 'revenue' ? 'Receita (Hoje)' : type === 'service' ? 'Taxa de Serviço (Hoje)' : 'Pedidos (Hoje)', body: stats });
      setModalOpen(true);
    } catch (e) {
      console.error('Erro ao abrir preview', e);
      alert('Erro ao abrir pré-visualização');
    }
  };

  const renderCardapio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Menu</h2>
        <div className="flex items-center gap-3">
              <button onClick={async () => {
                try {
                  if (!categories || categories.length === 0) {
                    const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                    const res = await api.getCategories(estabId);
                    setCategories(res || []);
                  }
                  setShowNewProductForm(v => !v);
                } catch (e) {
                  console.error('Erro ao carregar categorias', e);
                  setShowNewProductForm(v => !v);
                }
              }} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Item
          </button>
        </div>
      </div>
      {showNewProductForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-4">
          <h3 className="font-bold mb-4">Novo Produto</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input value={newProduct.nome || ''} onChange={e => setNewProduct(p => ({ ...p, nome: e.target.value }))} placeholder="Nome" className="px-4 py-3 bg-slate-50 border rounded-xl" />
            <input type="number" value={newProduct.preco ?? ''} onChange={e => setNewProduct(p => ({ ...p, preco: Number(e.target.value) }))} placeholder="Preço" className="px-4 py-3 bg-slate-50 border rounded-xl" />
            <select value={newProduct.categoriaId ?? ''} onChange={e => setNewProduct(p => ({ ...p, categoriaId: e.target.value ? Number(e.target.value) : null }))} className="px-4 py-3 bg-slate-50 border rounded-xl">
              <option value=''>Sem categoria</option>
              {categories.map((c:any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <textarea value={newProduct.descricao || ''} onChange={e => setNewProduct(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição" className="w-full px-4 py-3 bg-slate-50 border rounded-xl mb-4" />
          <div className="flex gap-4 items-center mb-4">
            <input type="text" placeholder="URL da imagem (opcional)" value={newProduct.imagem_url || ''} onChange={e => setNewProduct(p => ({ ...p, imagem_url: e.target.value }))} className="flex-grow px-4 py-3 bg-slate-50 border rounded-xl" />
            <input type="file" onChange={e => setImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="px-3 py-2" />
          </div>
          <div className="flex gap-3">
            <button disabled={isUploading} onClick={async () => {
              try {
                setIsUploading(true);
                let imagem_url = newProduct.imagem_url || null;
                if (imageFile) {
                  const up = await api.uploadProductImage(imageFile);
                  imagem_url = up.url;
                }
                await api.createProduct({ nome: newProduct.nome || '', preco: Number(newProduct.preco || 0), descricao: newProduct.descricao, categoriaId: newProduct.categoriaId || undefined, imagem_url: imagem_url || undefined });
                setShowNewProductForm(false);
                setNewProduct({ categoriaId: null });
                setImageFile(null);
                // reload products
                const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                const res = await api.getProducts(estabId);
                setProducts(res || []);
              } catch (err) {
                console.error('Erro ao criar produto', err);
                alert('Erro ao criar produto');
              } finally { setIsUploading(false); }
            }} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Salvar</button>
            <button onClick={() => { setShowNewProductForm(false); setNewProduct({ categoriaId: null }); setImageFile(null); }} className="bg-slate-100 px-6 py-3 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}
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
            {products.map((p:any) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                  {p.imagem_url ? <img src={p.imagem_url} alt={p.name} className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">🍽️</div>}
                  <div>{p.name}</div>
                </td>
                <td className="px-6 py-4 font-black text-slate-900">R$ {Number(p.price).toFixed(2)}</td>
                <td className="px-6 py-4">{p.category || '-'}</td>
                <td className="px-6 py-4">
                  <button onClick={async () => {
                    try {
                      if (!categories || categories.length === 0) {
                        const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                        const res = await api.getCategories(estabId);
                        setCategories(res || []);
                      }
                    } catch (e) { console.error('Erro ao carregar categorias', e); }
                    setEditProductData({ ...p });
                    setEditImageFile(null);
                    setModalContent({ type: 'edit-product', product: p });
                    setModalOpen(true);
                  }} className="text-slate-400 hover:text-orange-600 transition-colors mr-4">Editar</button>
                  <button onClick={async () => {
                    if (!confirm('Excluir este produto?')) return;
                    try {
                      await api.deleteProduct(p.id);
                      setProducts(prev => prev.filter((x:any) => x.id !== p.id));
                    } catch (e) { console.error(e); alert('Erro ao excluir'); }
                  }} className="text-red-400 hover:text-red-600">Excluir</button>
                </td>
              </tr>
            ))}
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
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button onClick={async () => {
            if (!newCategoryName) return alert('Informe um nome');
            try {
              const res = await api.createCategory(newCategoryName);
              setCategories(prev => [...prev, res]);
              setNewCategoryName('');
            } catch (e) { console.error(e); alert('Erro ao criar categoria'); }
          }} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
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
            {categories.map((c:any) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{c.nome}</td>
                <td className="px-6 py-4">
                  <button onClick={async () => {
                    const novo = prompt('Novo nome', c.nome);
                    if (!novo) return;
                    try {
                      await api.updateCategory(c.id, novo);
                      setCategories(prev => prev.map(x => x.id === c.id ? { ...x, nome: novo } : x));
                    } catch (e) { console.error(e); alert('Erro ao atualizar'); }
                  }} className="text-slate-400 hover:text-orange-600 mr-4">Editar</button>
                  <button onClick={async () => {
                    if (!confirm('Excluir categoria?')) return;
                    try {
                      await api.deleteCategory(c.id);
                      setCategories(prev => prev.filter(x => x.id !== c.id));
                    } catch (e) { console.error(e); alert('Erro ao excluir'); }
                  }} className="text-red-400 hover:text-red-600 font-medium">Excluir</button>
                </td>
              </tr>
            ))}
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
          <input value={newWaiterName} onChange={e => setNewWaiterName(e.target.value)} type="text" placeholder="Nome do Garçom..." className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"/>
          <input value={newWaiterPassword} onChange={e => setNewWaiterPassword(e.target.value)} type="password" placeholder="Senha de Acesso..." className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <button disabled={creatingWaiter} onClick={async () => {
          if (!newWaiterName || !newWaiterPassword) return alert('Nome e senha são obrigatórios');
          try {
            setCreatingWaiter(true);
            const res = await api.createWaiter(newWaiterName, newWaiterPassword);
            setWaiters(prev => [...prev, res]);
            setNewWaiterName(''); setNewWaiterPassword('');
          } catch (e) { console.error('Erro ao criar garçom', e); alert('Erro ao criar garçom'); }
          finally { setCreatingWaiter(false); }
        }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all">
          {creatingWaiter ? 'Cadastrando...' : 'Cadastrar Garçom'}
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
            {waiters.map((w:any) => (
              <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                   <div>
                     <div className="font-bold">{w.nome}</div>
                     <div className="text-[10px] text-slate-400">{w.ativo ? 'Ativo' : 'Inativo'}</div>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <button onClick={async () => {
                    const novo = prompt('Novo nome', w.nome);
                    if (!novo) return;
                    const novaSenha = prompt('Nova senha (deixe vazio para manter)');
                    try {
                      await api.updateWaiter(w.id, { nome: novo, senha: novaSenha || undefined });
                      setWaiters(prev => prev.map(x => x.id === w.id ? { ...x, nome: novo } : x));
                    } catch (e) { console.error(e); alert('Erro ao atualizar'); }
                  }} className="text-slate-400 hover:text-orange-600 mr-4">Editar</button>
                  <button onClick={async () => {
                    if (!confirm('Remover garçom?')) return;
                    try {
                      await api.deleteWaiter(w.id);
                      setWaiters(prev => prev.filter(x => x.id !== w.id));
                    } catch (e) { console.error(e); alert('Erro ao excluir'); }
                  }} className="text-red-400 hover:text-red-600">Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAvaliacoes = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Avaliações dos Clientes</h2>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStarFilter(null)} className={`px-3 py-1 rounded-full text-sm font-bold ${starFilter === null ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Todas</button>
            {[5,4,3,2,1].map(s => (
              <button key={s} onClick={() => setStarFilter(s)} className={`px-3 py-1 rounded-full text-sm font-bold ${starFilter === s ? 'bg-yellow-400 text-white' : 'bg-white border'}`}>{'★'.repeat(s)}</button>
            ))}
          </div>
          <div className="text-sm text-slate-500">Total: {avaliacoes.length}</div>
        </div>
        {avaliacoes.length === 0 ? (
          <div className="text-center text-slate-500">Nenhuma avaliação recebida até o momento.</div>
        ) : (
          <div className="space-y-4">
            {avaliacoes.filter(a => starFilter === null || Number(a.estrelas) === starFilter).map((a:any) => (
              <div key={a.id || `${a.criadoEm}-${a.mesaId}-${a.estabelecimentoId}`} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold">{a.estabelecimentoId ? `Estab ${a.estabelecimentoId}` : ''} {a.mesaId ? `• Mesa ${a.mesaId}` : ''}</div>
                  <div className="text-sm text-slate-400">{new Date(a.criadoEm).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-yellow-400 font-black text-lg">{'★'.repeat(Math.max(0, Math.min(5, a.estrelas || 0)))}</div>
                  <div className="text-sm text-slate-600">{a.comentario || ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMesasFechadas = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Mesas Finalizadas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mesasFechadas.map((mesa:any) => {
          const pedidosCount = mesa.pedidos?.length || 0;
          const total = (mesa.pedidos || []).reduce((acc:any, p:any) => acc + (p.total || 0), 0);
          return (
            <div key={mesa.id || mesa.numero} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-slate-900">Mesa {mesa.numero}</h3>
                <span className="text-xs font-bold text-slate-400 uppercase">Pedidos: {pedidosCount}</span>
              </div>
              <div className="flex-grow space-y-3 mb-6">
                {(mesa.pedidos || []).map((p:any) => (
                  <div key={p.id} className="flex justify-between text-sm py-2 border-b border-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">Pedido #{p.id}</p>
                      <p className="text-[10px] text-slate-400">Itens: {p.itens?.length || 0}</p>
                    </div>
                    <p className="font-black text-slate-900">R$ {Number(p.total).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-auto">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
               <h4 className="text-2xl font-black text-emerald-600">R$ {Number(total).toFixed(2)}</h4>
               <p className="text-[10px] text-slate-400 italic mt-1">Taxa paga: {mesa.taxaPaga ? 'Sim' : 'Não'}</p>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAjustes = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Ajustes da Plataforma</h2>
      
      <AjustesForm />
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
             <div className="flex items-center gap-3 mt-1">
               <div className="flex items-center gap-2 text-slate-500 font-medium">
                 <span className="w-2 h-2 rounded-full bg-blue-500" />
                 Sessão Administrativa
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-500">•</div>
               <div className="flex items-center gap-3 text-sm text-slate-500">
                 <label className="flex items-center gap-2">
                   <input type="checkbox" checked={sseEnabled} onChange={(e) => { const v = e.target.checked; setSseEnabled(v); try { localStorage.setItem('gm_admin_sse_enabled', String(v)); } catch (err) {} }} />
                   Usar SSE
                 </label>
                 <div className="flex items-center gap-2">
                   <div>Polling (ms):</div>
                   <input value={String(pollInterval)} onChange={(e) => { const v = Number(e.target.value || 0); setPollInterval(v); try { localStorage.setItem('gm_admin_poll_interval', String(v)); } catch (err) {} }} className="w-20 px-2 py-1 border rounded text-sm" />
                 </div>
                 <div className="flex items-center gap-2">
                   <span className={`w-3 h-3 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-500' : sseStatus === 'connecting' ? 'bg-yellow-400' : sseStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'}`} title={`SSE: ${sseStatus}`} />
                   <div className="text-xs text-slate-400">{sseStatus === 'connected' ? 'SSE conectado' : sseStatus === 'connecting' ? 'SSE conectando' : sseStatus === 'error' ? 'SSE erro' : 'SSE off'}</div>
                 </div>
               </div>
             </div>
           </div>
           <div className="ml-auto" />
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'mesas' && renderMesas()}
        {activeTab === 'cardapio' && renderCardapio()}
        {activeTab === 'categorias' && renderCategorias()}
        {activeTab === 'equipe' && renderEquipe()}
        {activeTab === 'financeiro' && renderFinanceiro()}
        {activeTab === 'avaliacoes' && renderAvaliacoes()}
        {activeTab === 'mesas-fechadas' && renderMesasFechadas()}
        {activeTab === 'ajustes' && renderAjustes()}
      </div>
      {modalOpen && modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 z-40" onClick={() => setModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl p-6 z-50 max-w-3xl w-full mx-4 relative">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">{modalContent.title}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">Fechar</button>
            </div>
            <div className="space-y-4 text-sm text-slate-700">
              {modalContent.type === 'mesa-details' && modalContent.mesa ? (
                <div>
                  <h4 className="font-bold mb-3">Mesa {modalContent.mesa.numero}</h4>
                  {(modalContent.mesa.pedidos || []).map((p:any) => (
                    <div key={p.id} className="mb-4 border rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold">Pedido #{p.id}</div>
                        <div className="text-sm text-slate-500">Total: R$ {Number(p.total).toFixed(2)}</div>
                      </div>
                      <div className="space-y-2">
                        {(p.itens || []).map((it:any) => (
                          <div key={it.id} className="flex items-center justify-between">
                            <div>
                              <div className="font-bold">{(() => {
                                const prod = products.find((x:any) => Number(x.id) === Number(it.produtoId));
                                return prod ? `${prod.name} • R$ ${Number(it.precoUnitario).toFixed(2)}` : (it.produto && (it.produto.nome || it.produto.name) ? `${it.produto.nome || it.produto.name} • R$ ${Number(it.precoUnitario).toFixed(2)}` : `${it.produtoId} (produto)`);
                              })()}</div>
                              <div className="text-xs text-slate-400">R$ {Number(it.precoUnitario).toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input defaultValue={it.quantidade} type="number" min={0} className="w-16 px-2 py-1 border rounded" id={`qty-${it.id}`} />
                              <button onClick={async () => {
                                const el = document.getElementById(`qty-${it.id}`) as HTMLInputElement | null;
                                const q = el ? Number(el.value) : it.quantidade;
                                try { await updateItem(it.id, q); alert('Item atualizado'); }
                                catch (e) { alert('Erro ao atualizar item'); }
                              }} className="px-3 py-1 bg-blue-500 text-white rounded">Salvar</button>
                              <button onClick={async () => {
                                if (!confirm('Remover item?')) return;
                                try { await removeItem(it.id); alert('Item removido'); }
                                catch (e) { alert('Erro ao remover item'); }
                              }} className="px-3 py-1 bg-red-500 text-white rounded">Remover</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {modalContent.type === 'edit-product' && modalContent.product && (
                <div>
                  <h4 className="font-bold mb-3">Editar Produto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input value={editProductData?.name || editProductData?.nome || ''} onChange={e => setEditProductData((s:any) => ({ ...s, name: e.target.value }))} placeholder="Nome" className="px-4 py-3 bg-slate-50 border rounded-xl" />
                    <input type="number" value={editProductData?.price ?? editProductData?.preco ?? ''} onChange={e => setEditProductData((s:any) => ({ ...s, price: Number(e.target.value) }))} placeholder="Preço" className="px-4 py-3 bg-slate-50 border rounded-xl" />
                    <select value={editProductData?.category || editProductData?.categoria || ''} onChange={e => setEditProductData((s:any) => ({ ...s, category: e.target.value }))} className="px-4 py-3 bg-slate-50 border rounded-xl">
                      <option value=''>Sem categoria</option>
                      {categories.map((c:any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                    <div />
                  </div>
                  <textarea value={editProductData?.description || editProductData?.descricao || ''} onChange={e => setEditProductData((s:any) => ({ ...s, description: e.target.value }))} placeholder="Descrição" className="w-full px-4 py-3 bg-slate-50 border rounded-xl mb-4" />
                  <div className="flex gap-4 items-center mb-4">
                    <input type="text" placeholder="URL da imagem (opcional)" value={editProductData?.imagem_url || editProductData?.imageUrl || ''} onChange={e => setEditProductData((s:any) => ({ ...s, imagem_url: e.target.value }))} className="flex-grow px-4 py-3 bg-slate-50 border rounded-xl" />
                    <input type="file" onChange={e => setEditImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="px-3 py-2" />
                  </div>
                  <div className="flex gap-3">
                    <button disabled={isEditUploading} onClick={async () => {
                      try {
                        setIsEditUploading(true);
                        let imagem_url = editProductData?.imagem_url || editProductData?.imageUrl || null;
                        if (editImageFile) {
                          const up = await api.uploadProductImage(editImageFile);
                          imagem_url = up.url;
                        }
                        const payload:any = { nome: editProductData.name || editProductData.nome, preco: Number(editProductData.price || editProductData.preco || 0), descricao: editProductData.description || editProductData.descricao, imagem_url: imagem_url || undefined };
                        const cat = categories.find((c:any) => c.nome === (editProductData.category || editProductData.categoria));
                        if (cat) payload.categoriaId = cat.id;
                        await api.updateProduct(modalContent.product.id, payload);
                        const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                        const res = await api.getProducts(estabId);
                        setProducts(res || []);
                        setModalOpen(false);
                        setModalContent(null);
                        setEditProductData(null);
                        setEditImageFile(null);
                      } catch (err) {
                        console.error('Erro ao atualizar produto', err);
                        alert('Erro ao atualizar produto');
                      } finally { setIsEditUploading(false); }
                    }} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Salvar</button>
                    <button onClick={() => { setModalOpen(false); setModalContent(null); setEditProductData(null); setEditImageFile(null); }} className="bg-slate-100 px-6 py-3 rounded-xl">Cancelar</button>
                  </div>
                </div>
              )}

              {(modalContent.type !== 'mesa-details' && modalContent.type !== 'edit-product') && (
                <>
                  {modalContent.type === 'preview' && modalContent.previewType === 'reviews' ? (
                    <div>
                      <h4 className="font-bold mb-2">Avaliações 5★ recentes</h4>
                      <div className="space-y-3">
                        {Array.isArray(modalContent.body.reviews) && modalContent.body.reviews.length > 0 ? (
                          modalContent.body.reviews.map((r:any) => (
                            <div key={r.id || r.criadoEm} className="p-3 border rounded">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-bold">Mesa {r.mesaId ?? '—'}</div>
                                <div className="text-xs text-slate-400">{new Date(r.criadoEm).toLocaleString()}</div>
                              </div>
                              <div className="text-sm text-slate-700">{'★'.repeat(Math.max(0, Math.min(5, r.estrelas || 0)))} — {r.comentario || ''}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">Nenhuma avaliação 5★ disponível.</div>
                        )}
                      </div>
                    </div>
                  ) : modalContent.type === 'preview' && modalContent.previewType === 'categories' ? (
                    <div>
                      <h4 className="font-bold mb-3">Categorias mais vendidas</h4>
                      {Array.isArray(modalContent.body.categories) && modalContent.body.categories.length > 0 ? (
                        <div className="space-y-2">
                          {modalContent.body.categories.map((c:any, idx:number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="flex-1 text-sm">{c.categoria}</div>
                              <div className="w-40">
                                <div className="h-3 bg-slate-100 rounded overflow-hidden">
                                  <div style={{ width: `${Math.min(100, (c.quantidade / (modalContent.body.categories[0].quantidade || 1)) * 100)}%` }} className="h-full bg-blue-500 rounded"></div>
                                </div>
                              </div>
                              <div className="w-12 text-right font-black">{c.quantidade}</div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-sm text-slate-400">Nenhuma categoria</div>}
                    </div>
                  ) : modalContent.type === 'preview' && modalContent.previewType === 'products' ? (
                    <div>
                      <h4 className="font-bold mb-3">Produtos mais vendidos</h4>
                      {Array.isArray(modalContent.body.products) && modalContent.body.products.length > 0 ? (
                        <ol className="list-decimal pl-5 text-sm">
                          {modalContent.body.products.map((p:any) => (
                            <li key={p.id} className="flex items-center justify-between py-1">
                              <div>{p.nome}</div>
                              <div className="font-black">{p.quantidade}</div>
                            </li>
                          ))}
                        </ol>
                      ) : <div className="text-sm text-slate-400">Nenhum produto</div>}
                    </div>
                  ) : 
                  modalContent && modalContent.body && (modalContent.body.fechamento || Array.isArray(modalContent.body.mesas)) ? (
                    <div>
                      <div className="mb-4">
                        <div className="text-sm text-slate-500">Fechamento registrado em</div>
                        <div className="text-sm text-slate-700 font-bold">{modalContent.body.fechamento && modalContent.body.fechamento.fechadoEm ? new Date(modalContent.body.fechamento.fechadoEm).toLocaleString() : (modalContent.body.fechamento && modalContent.body.fechamento.criadoEm ? new Date(modalContent.body.fechamento.criadoEm).toLocaleString() : '—')}</div>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-bold mb-2">Mesas incluídas no fechamento</h4>
                        <div className="bg-white p-3 rounded overflow-auto max-h-60">
                          {Array.isArray(modalContent.body.mesas) && modalContent.body.mesas.length > 0 ? (
                            <div className="space-y-3">
                              {modalContent.body.mesas.map((mesa:any) => {
                                const pedidosCount = mesa.pedidos?.length || 0;
                                const total = (mesa.pedidos || []).reduce((acc:any, p:any) => acc + (p.total || 0), 0);
                                return (
                                  <div key={mesa.id || mesa.numero} className="p-3 border rounded">
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="font-bold">Mesa {mesa.numero}</div>
                                      <div className="text-sm text-slate-500">Pedidos: {pedidosCount}</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="text-sm text-slate-600">Itens: {(mesa.pedidos || []).reduce((acc:any, p:any) => acc + (p.itens?.length || 0), 0)}</div>
                                      <div className="font-black text-slate-900">{Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-400">Nenhuma mesa registrada no fechamento.</div>
                          )}
                        </div>
                      </div>
                      {/* Se o fechamento não trouxe estatísticas agregadas, exibir total geral calculado */}
                      <div className="mt-4">
                        <h4 className="font-bold mb-2">Resumo</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-3 bg-slate-50 rounded">
                            <div className="text-sm text-slate-500">Receita Total</div>
                            <div className="text-lg font-black text-slate-900">{
                              (() => {
                                const mesas = modalContent.body.mesas || [];
                                const total = mesas.reduce((acc:any, m:any) => acc + ((m.pedidos || []).reduce((s:any, p:any) => s + (p.total || 0), 0)), 0);
                                return Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                              })()
                            }</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded">
                            <div className="text-sm text-slate-500">Pedidos</div>
                            <div className="text-lg font-black text-slate-900">{(() => { const mesas = modalContent.body.mesas || []; return mesas.reduce((acc:any,m:any) => acc + ((m.pedidos || []).length || 0), 0); })()}</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded">
                            <div className="text-sm text-slate-500">Mesas</div>
                            <div className="text-lg font-black text-slate-900">{(modalContent.body.mesas || []).length}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : modalContent && modalContent.body && modalContent.body.totalRevenue !== undefined ? (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-slate-50 rounded">
                          <div className="text-sm text-slate-500">Receita Total</div>
                          <div className="text-2xl font-black text-slate-900">{Number(modalContent.body.totalRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded">
                          <div className="text-sm text-slate-500">Taxa (estimada)</div>
                          <div className="text-2xl font-black text-slate-900">{Number(modalContent.body.totalService || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded">
                          <div className="text-sm text-slate-500">Pedidos</div>
                          <div className="text-2xl font-black">{modalContent.body.ordersCount || 0}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded">
                          <div className="text-sm text-slate-500">Avaliações</div>
                          <div className="text-2xl font-black">{modalContent.body.avaliacoesCount || 0}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-slate-500">Janela de Dados</div>
                        <div className="text-sm text-slate-700">
                          {(() => {
                            try {
                              const s = modalContent.body.janela?.start ? new Date(modalContent.body.janela.start).toLocaleString() : '';
                              const e = modalContent.body.janela?.end ? new Date(modalContent.body.janela.end).toLocaleString() : '';
                              return s && e ? `${s} — ${e}` : (s || e || 'Período não especificado');
                            } catch (err) { return 'Período não especificado'; }
                          })()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold mb-2">Categorias mais vendidas</h4>
                          <div className="bg-white p-3 rounded overflow-auto max-h-48">
                            {Array.isArray(modalContent.body.categoriesMostSold) && modalContent.body.categoriesMostSold.length > 0 ? (
                              <ol className="list-decimal pl-5 text-sm">
                                {modalContent.body.categoriesMostSold.map((c:any, idx:number) => (
                                  <li key={idx} className="mb-1 flex justify-between"><span>{c.categoria}</span><span className="font-black">{c.quantidade}</span></li>
                                ))}
                              </ol>
                            ) : <div className="text-sm text-slate-400">Nenhuma categoria</div>}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold mb-2">Produtos mais vendidos</h4>
                          <div className="bg-white p-3 rounded overflow-auto max-h-48">
                            {Array.isArray(modalContent.body.productsMostSold) && modalContent.body.productsMostSold.length > 0 ? (
                              <table className="w-full text-sm">
                                <thead className="text-xs text-slate-500 text-left"><tr><th>Produto</th><th className="text-right">Qtd</th><th className="text-right">Preço</th></tr></thead>
                                <tbody>
                                  {modalContent.body.productsMostSold.map((p:any) => (
                                    <tr key={p.id} className="border-t"><td>{p.nome}</td><td className="text-right font-black">{p.quantidade}</td><td className="text-right">{Number(p.precoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : <div className="text-sm text-slate-400">Nenhum produto</div>}
                          </div>
                        </div>
                      </div>
                      {Array.isArray(modalContent.body.closures) && modalContent.body.closures.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-bold mb-2">Fechamentos no Período</h4>
                          <div className="space-y-2">
                            {modalContent.body.closures.map((c:any) => {
                              const mesasArr = c.mesas || [];
                              const total = mesasArr.reduce((acc:any, m:any) => acc + ((m.pedidos || []).reduce((s:any,p:any)=> s + (p.total||0), 0)), 0);
                              return (
                                <div key={c.id || c.fechadoEm} className="p-3 border rounded flex items-center justify-between">
                                  <div>
                                    <div className="font-bold">Fechamento {c.id ? `#${c.id}` : ''}</div>
                                    <div className="text-sm text-slate-500">{c.fechadoEm ? new Date(c.fechadoEm).toLocaleString() : (c.criadoEm ? new Date(c.criadoEm).toLocaleString() : '')} • {mesasArr.length} mesas</div>
                                  </div>
                                  <div className="font-black">{Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-xs bg-slate-50 p-4 rounded">{JSON.stringify(modalContent.body, null, 2)}</pre>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AjustesForm: React.FC = () => {
  const [taxa, setTaxa] = useState<number>(10);
  const [fundoGeral, setFundoGeral] = useState('#06120c');
  const [fundoCartoes, setFundoCartoes] = useState('#0d1f15');
  const [corTexto, setCorTexto] = useState('#fefce8');
  const [corPrimaria, setCorPrimaria] = useState('#d18a59');
  const [corDestaque, setCorDestaque] = useState('#c17a49');
  const [textoCardapio, setTextoCardapio] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const est = await api.getEstablishment();
      if (est) {
        setTaxa(est.taxa_servico ?? 10);
        setFundoGeral(est.tema_fundo_geral ?? '#06120c');
        setFundoCartoes(est.tema_fundo_cartoes ?? '#0d1f15');
        setCorTexto(est.tema_cor_texto ?? '#fefce8');
        setCorPrimaria(est.tema_cor_primaria ?? '#d18a59');
        setCorDestaque(est.tema_cor_destaque ?? '#c17a49');
        setTextoCardapio(est.texto_cardapio ?? '');
      }
    } catch (e) {
      console.error('Erro ao carregar ajustes', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      setLoading(true);
      await api.updateEstablishment({ taxa_servico: taxa, tema_fundo_geral: fundoGeral, tema_fundo_cartoes: fundoCartoes, tema_cor_texto: corTexto, tema_cor_primaria: corPrimaria, tema_cor_destaque: corDestaque, texto_cardapio: textoCardapio });
      alert('Ajustes salvos');
    } catch (e) {
      console.error('Erro ao salvar ajustes', e);
      alert('Erro ao salvar ajustes');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">⚡ Configurações de Serviço</h3>
          <label className="block text-sm font-bold text-slate-700 mb-2">Taxa de Serviço (%)</label>
          <div className="relative">
            <input type="number" value={taxa} onChange={e => setTaxa(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"/>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">🎨 Personalização de Tema</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-bold text-slate-700">Fundo Geral</span>
              <div className="flex items-center gap-3">
                <input value={fundoGeral} onChange={e => setFundoGeral(e.target.value)} className="text-xs font-mono text-slate-400 px-2 py-1 border rounded" />
                <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: fundoGeral }} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-bold text-slate-700">Fundo de Cartões</span>
              <div className="flex items-center gap-3">
                <input value={fundoCartoes} onChange={e => setFundoCartoes(e.target.value)} className="text-xs font-mono text-slate-400 px-2 py-1 border rounded" />
                <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: fundoCartoes }} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-bold text-slate-700">Cor de Texto</span>
              <div className="flex items-center gap-3">
                <input value={corTexto} onChange={e => setCorTexto(e.target.value)} className="text-xs font-mono text-slate-400 px-2 py-1 border rounded" />
                <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: corTexto }} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-bold text-slate-700">Cor Primária (Botões)</span>
              <div className="flex items-center gap-3">
                <input value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)} className="text-xs font-mono text-slate-400 px-2 py-1 border rounded" />
                <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: corPrimaria }} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-bold text-slate-700">Cor de Destaque</span>
              <div className="flex items-center gap-3">
                <input value={corDestaque} onChange={e => setCorDestaque(e.target.value)} className="text-xs font-mono text-slate-400 px-2 py-1 border rounded" />
                <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: corDestaque }} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Texto do Cardápio</label>
              <textarea value={textoCardapio} onChange={e => setTextoCardapio(e.target.value)} placeholder="Texto que aparece no cardápio público" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" rows={4} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button disabled={loading} onClick={save} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-100">{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
      </div>
    </div>
  );
};
