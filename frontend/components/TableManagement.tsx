
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Props {
  waiterName: string;
  onLogout: () => void;
  onOpenTable: (tableNumber: string) => void;
}

export const TableManagement: React.FC<Props> = ({ waiterName, onLogout, onOpenTable }) => {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableInput, setTableInput] = useState('');
  const [mesas, setMesas] = useState<Array<any>>([]);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [productsMap, setProductsMap] = useState<Record<number, any>>({});
  const [garcomMap, setGarcomMap] = useState<Record<number, string>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sseStatus, setSseStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const [notificationsList, setNotificationsList] = useState<Array<any>>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const handleConfirmTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableInput.trim()) {
      try { localStorage.setItem('gm_current_mesa', JSON.stringify({ numero: String(tableInput) })); } catch (e) {}
      (async () => {
        try {
          const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
          if (estabId) await api.createMesa(estabId, String(tableInput));
        } catch (e) { /* ignore create errors */ }
        try {
          const base = window.location.origin + window.location.pathname;
          const url = `${base}?mesa=${encodeURIComponent(String(tableInput))}`;
          window.open(url, '_blank');
        } catch (e) {
          // fallback to same-tab behavior
          onOpenTable(tableInput);
        }
      })();
      setIsTableModalOpen(false);
      setTableInput('');
    }
  };
  const loadMesas = async () => {
    try {
      setLoadingMesas(true);
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      const res = await api.getMesas(estabId, true);
      setMesas(res || []);
    } catch (e) {
      console.error('Erro ao carregar mesas', e);
    } finally { setLoadingMesas(false); }
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      o.start();
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        o.stop(ctx.currentTime + 0.25);
        ctx.close();
      }, 300);
    } catch (e) { /* ignore audio errors */ }
  };

  const notify = (title: string, body: string) => {
    try {
      // always play sound when a notification event arrives (helps even if Notification permission not granted)
      playNotificationSound();
      if (window.Notification && Notification.permission === 'granted') {
        // show notification if permission granted
        // eslint-disable-next-line no-new
        new Notification(title, { body });
      }
    } catch (e) {
      console.warn('Falha ao disparar notificação', e);
    }
  };

  const eventSourceHandler = (evt: MessageEvent, type: string) => {
    try {
      const payload = JSON.parse(evt.data);
      if (type === 'pedido_created') {
        const p = payload.pedido;
        const mesaNumero = p.mesaNumero || p.mesa?.numero || p.mesaId || '—';
        const itemsDesc = (p.itens || []).map((it: any) => {
          const prod = productsMap[Number(it.produtoId)];
          const name = prod?.name || prod?.nome || `Produto #${it.produtoId}`;
          return `${it.quantidade}x ${name}`;
        }).slice(0, 5).join(', ');
        notify(`Novo pedido — Mesa ${mesaNumero}`, itemsDesc || 'Novo pedido recebido');
        // add to history
        const item = { id: `pedido_${p.id}_${Date.now()}`, type: 'pedido_created', title: `Novo pedido — Mesa ${mesaNumero}`, body: itemsDesc || 'Novo pedido recebido', pedidoId: p.id, mesaNumero, timestamp: Date.now(), attended: false };
        setNotificationsList(prev => { const next = [item, ...prev]; try { localStorage.setItem('gm_notifications_list', JSON.stringify(next)); } catch(e){}; return next; });
      } else if (type === 'pedido_updated') {
        const p = payload.pedido;
        const mesaNumero = p.mesa?.numero || p.mesaNumero || p.mesaId || '—';
        notify(`Pedido atualizado — Mesa ${mesaNumero}`, `Pedido #${p.id} agora: ${p.status}`);
        const item = { id: `pedidoupd_${p.id}_${Date.now()}`, type: 'pedido_updated', title: `Pedido atualizado — Mesa ${mesaNumero}`, body: `Pedido #${p.id} agora: ${p.status}`, pedidoId: p.id, mesaNumero, timestamp: Date.now(), attended: false };
        setNotificationsList(prev => { const next = [item, ...prev]; try { localStorage.setItem('gm_notifications_list', JSON.stringify(next)); } catch(e){}; return next; });
      } else if (type === 'mesa_fechamento_solicitado') {
        const e = payload;
        const mesaNumero = e.mesaNumero || e.mesa?.numero || e.mesaId || '—';
        notify(`Fechamento solicitado — Mesa ${mesaNumero}`, `Total: R$ ${Number(e.total || 0).toFixed(2)}`);
        const item = { id: `fech_${e.mesaId}_${Date.now()}`, type: 'fechamento', title: `Fechamento solicitado — Mesa ${mesaNumero}`, body: `Total: R$ ${Number(e.total || 0).toFixed(2)}`, mesaId: e.mesaId, mesaNumero, timestamp: Date.now(), attended: false };
        setNotificationsList(prev => { const next = [item, ...prev]; try { localStorage.setItem('gm_notifications_list', JSON.stringify(next)); } catch(e){}; return next; });
      }
      else if (type === 'garcom_chamado') {
        const e = payload;
        const mesaNumero = e.mesaNumero || e.mesa?.numero || e.mesaId || '—';
        notify(`Garçom chamado — Mesa ${mesaNumero}`, e.body || `Cliente chamou o garçom na mesa ${mesaNumero}`);
        const item = { id: `garcom_${e.mesaId}_${Date.now()}`, type: 'garcom_chamado', title: `Garçom chamado — Mesa ${mesaNumero}`, body: e.body || `Cliente chamou o garçom na mesa ${mesaNumero}`, mesaId: e.mesaId, mesaNumero, timestamp: Date.now(), attended: false };
        setNotificationsList(prev => { const next = [item, ...prev]; try { localStorage.setItem('gm_notifications_list', JSON.stringify(next)); } catch(e){}; return next; });
      }
    } catch (e) { console.error('Erro ao processar evento SSE', e); }
    // refresh mesas when relevant and map is visible
    try {
      if (mapVisible && ['pedido_created', 'pedido_updated', 'mesa_fechamento_solicitado', 'garcom_chamado'].includes(type)) {
        loadMesas();
      }
    } catch (e) { /* ignore refresh errors */ }
  };

  const startSSE = async () => {
    if (eventSourceRef.current) return;
    if (!window.EventSource) { alert('SSE não suportado neste navegador'); setNotificationsEnabled(false); return; }
    setSseStatus('connecting');
    if (window.Notification && Notification.permission !== 'granted') {
      // request permission, but don't disable the user's preference if they dismiss the prompt (permission === 'default')
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'denied') {
          // explicit denial: reflect in UI and persist
          setNotificationsEnabled(false);
          try { localStorage.setItem('gm_notifications_enabled', 'false'); } catch (e) {}
          alert('Permissão de notificações negada. Ative manualmente nas configurações do navegador se quiser reativar.');
          return;
        }
        // if perm === 'default' (user dismissed), continue: we keep preference true and still open SSE for sound/history
      } catch (e) {
        console.warn('Erro ao solicitar permissão de Notification', e);
      }
    }
    const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
    const base = (((import.meta as any).VITE_API_URL) || 'http://localhost:4000').replace(/\/$/, '');
    const url = `${base}/api/notifications/stream?estabelecimentoId=${estabId}`;
    const es = new EventSource(url);
    es.addEventListener('pedido_created', (e: MessageEvent) => eventSourceHandler(e, 'pedido_created'));
    es.addEventListener('pedido_updated', (e: MessageEvent) => eventSourceHandler(e, 'pedido_updated'));
    es.addEventListener('garcom_chamado', (e: MessageEvent) => eventSourceHandler(e, 'garcom_chamado'));
    es.addEventListener('mesa_fechamento_solicitado', (e: MessageEvent) => eventSourceHandler(e, 'mesa_fechamento_solicitado'));
    es.onerror = (err) => { console.warn('SSE error', err); setSseStatus('error'); };
    es.onopen = () => {
      try { localStorage.setItem('gm_notifications_enabled', 'true'); } catch (e) {}
      setSseStatus('connected');
    };
    // not all browsers expose onclose; handle manual stopSSE instead
    eventSourceRef.current = es;
  };

  const stopSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      try { localStorage.setItem('gm_notifications_enabled', 'false'); } catch (e) {}
      setSseStatus('disconnected');
    }
  };

  useEffect(() => {
    if (notificationsEnabled) startSSE(); else stopSSE();
    return () => stopSSE();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsEnabled]);

  // load persisted notification preferences and history
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('gm_notifications_enabled') || '').toLowerCase();
      if (saved === 'true' || saved === '1' || saved === 'yes' || saved === 'on') setNotificationsEnabled(true);
    } catch (e) { /* ignore */ }
    try {
      const list = localStorage.getItem('gm_notifications_list');
      if (list) setNotificationsList(JSON.parse(list));
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (mapVisible) loadMesas();
  }, [mapVisible]);

  const openMesaDetails = async (mesa: any) => {
    setSelectedMesa(mesa);
    try {
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      const products = await api.getProducts(estabId);
      const map: Record<number, any> = {};
      products.forEach((p:any) => { map[p.id] = p; });
      setProductsMap(map);
      // carregar garçons para mostrar nome quem lançou o pedido
      try {
        const garcons = await api.getWaiters(estabId);
        const gmap: Record<number, string> = {};
        (garcons || []).forEach((g:any) => { gmap[g.id] = g.nome || g.name; });
        setGarcomMap(gmap);
      } catch (e) {
        console.warn('Não foi possível carregar garçons', e);
      }
    } catch (e) {
      console.error('Erro ao carregar produtos para modal', e);
    }
    setIsDetailsModalOpen(true);
  };

  const confirmPedido = async (pedidoId: number) => {
    try {
      await api.updateOrderStatus(pedidoId, 'SERVIDO');
      // reload mesas
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      const res = await api.getMesas(estabId, true);
      setMesas(res || []);
      // update selected
      const updated = res.find((m:any) => m.id === selectedMesa?.id);
      setSelectedMesa(updated);
    } catch (e) { console.error(e); alert('Erro ao confirmar pedido'); }
  };

  const handleOpenCardapioFromMesa = (mesa: any) => {
    // persist mesa data so MenuView can load account items
    try { localStorage.setItem('gm_current_mesa', JSON.stringify(mesa)); } catch (e) { /* ignore */ }
    (async () => {
      try { const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0); if (estabId) await api.createMesa(estabId, String(mesa.numero)); } catch(e) {}
      try {
        const base = window.location.origin + window.location.pathname;
        const url = `${base}?mesa=${encodeURIComponent(String(mesa.numero))}`;
        window.open(url, '_blank');
      } catch (e) {
        // fallback: open in same tab
        onOpenTable(String(mesa.numero));
      }
    })();
  };

  return (
    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
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
      
        {/* (Mapa será exibido ao clicar no card "Mapa de Mesas" abaixo) */}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Atendimento — Garçom</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Action Cards */}
        <button 
          onClick={() => setIsTableModalOpen(true)}
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

        <button onClick={() => { const next = !mapVisible; setMapVisible(next); if (next) loadMesas(); }} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group text-left">
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

        <button onClick={() => onOpenTable('')} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group text-left">
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

        <button onClick={() => setIsNotificationsModalOpen(true)} className={`flex items-center justify-between p-6 rounded-2xl border transition-all group text-left ${notificationsEnabled ? 'bg-emerald-50 border-emerald-200 shadow-md' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${notificationsEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-600'} rounded-xl flex items-center justify-center` }>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0v4l-2 2v1h16v-1l-2-2V8"/></svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800">Notificações</span>
              <p className="text-sm text-slate-500">Notificações de novos pedidos e atualizações</p>
            </div>
          </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-400">{notificationsEnabled ? 'Ativado' : 'Desativado'}</div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-500' : sseStatus === 'connecting' ? 'bg-yellow-400' : sseStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'}`} title={`SSE: ${sseStatus}`} />
                <div className="text-xs text-slate-400">{sseStatus === 'connected' ? 'Conectado' : sseStatus === 'connecting' ? 'Conectando' : sseStatus === 'error' ? 'Erro' : 'Off'}</div>
              </div>
            </div>
        </button>

        {/* Notifications Modal opener handled above; modal rendered below */}
      </div>

      {/* Mapa de Mesas (visível sob demanda) */}
      {mapVisible && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Mapa de Mesas</h3>
          {loadingMesas ? (
            <div className="text-slate-500">Carregando mesas...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mesas.map(mesa => (
                <div key={mesa.id || mesa.numero} className={`p-4 rounded-2xl shadow-sm border ${mesa.aberta ? 'bg-white border-orange-200' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between min-h-[150px]`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold">Mesa {mesa.numero}</div>
                      <div className="text-xs text-slate-400">{mesa.aberta ? 'Aberta' : 'Fechada'}</div>
                    </div>
                    <div className="text-sm text-slate-600">Pedidos: {mesa.pedidos?.length || 0}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button onClick={() => openMesaDetails(mesa)} className="flex-1 py-2 px-3 bg-white border rounded text-sm text-left">Detalhes</button>
                    {mesa.aberta && (
                      <button onClick={() => handleOpenCardapioFromMesa(mesa)} className="py-2 px-3 bg-emerald-600 text-white rounded text-sm shrink-0">Abrir</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table Number Modal */}
      {isTableModalOpen && (
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
                    onClick={() => { setIsTableModalOpen(false); setTableInput(''); }}
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

      {/* Details Modal (Pedidos da mesa) */}
      {isDetailsModalOpen && selectedMesa && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh]">
            <div className="p-6 border-b flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Detalhes — Mesa {selectedMesa.numero}</h3>
                <p className="text-sm text-slate-500">Visualize pedidos e itens</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-sm text-slate-500 hover:text-slate-700">Fechar</button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-auto max-h-[70vh]">
              {(!selectedMesa.pedidos || selectedMesa.pedidos.length === 0) && (
                <div className="text-sm text-slate-500">Nenhum pedido encontrado para esta mesa.</div>
              )}

              {selectedMesa.pedidos?.map((pedido:any) => {
                const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
                return (
                  <div key={pedido.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold">Pedido #{pedido.id}</div>
                      <div className="text-sm text-slate-500">Status: {pedido.status}</div>
                    </div>

                    <div className="space-y-2">
                      {pedido.itens?.map((it:any) => {
                        const pid = Number(it.produtoId);
                        const produto = productsMap[pid];
                        const nome = produto?.name || produto?.nome || `Produto #${it.produtoId}`;
                        const preco = (it.precoUnitario ?? produto?.price ?? produto?.preco ?? 0);
                        const subtotal = preco * (it.quantidade || 1);
                        const lan = garcomMap[pedido.garcomId] || garcomMap[Number(pedido.garcomId)] || pedido.garcomId || '—';
                        return (
                          <div key={it.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0">
                            <div className="w-12 text-center">
                              <div className="text-lg font-bold">{it.quantidade}x</div>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{nome}</div>
                              <div className="text-xs text-slate-500">Lançado por: {lan}</div>
                            </div>
                            <div className="w-28 text-right">
                              <div className="font-semibold">{formatter.format(subtotal)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-slate-600">Total: <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total || 0)}</span></div>
                      <div className="flex items-center gap-2">
                        {pedido.status !== 'SERVIDO' && (
                          <button onClick={() => confirmPedido(pedido.id)} className="py-2 px-3 bg-emerald-600 text-white rounded text-sm">Confirmar SERVIDO</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Notificações</h3>
                <p className="text-sm text-slate-500">Histórico de notificações</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={notificationsEnabled} onChange={(e) => { const v = e.target.checked; setNotificationsEnabled(v); try { localStorage.setItem('gm_notifications_enabled', String(v)); } catch(e){}; }} />
                  Ativar SSE
                </label>
                <button onClick={() => setIsNotificationsModalOpen(false)} className="text-sm text-slate-500">Fechar</button>
              </div>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto">
              {notificationsList.length === 0 && (
                <div className="text-sm text-slate-500">Nenhuma notificação recebida ainda.</div>
              )}
              <div className="space-y-3">
                {notificationsList.map((n:any) => (
                  <div key={n.id} className={`p-3 rounded-xl border ${n.attended ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{n.title}</div>
                        <div className="text-sm text-slate-500">{n.body}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!n.attended ? (
                          <button onClick={async () => {
                            // mark locally
                            setNotificationsList(prev => { const next = prev.map((x:any) => x.id === n.id ? { ...x, attended: true } : x); try { localStorage.setItem('gm_notifications_list', JSON.stringify(next)); } catch(e){}; return next; });
                            // if server notificationId exists, ack on backend
                            const serverId = n.notificationId || n.serverId || null;
                            if (serverId) {
                              try {
                                await fetch(((((import.meta as any).VITE_API_URL) || 'http://localhost:4000').replace(/\/$/, '')) + `/api/notifications/${serverId}/ack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                              } catch (e) { console.warn('Falha ao confirmar notificação no servidor', e); }
                            }
                          }} className="py-2 px-3 bg-emerald-600 text-white rounded text-sm">OK</button>
                        ) : (
                          <div className="text-xs text-slate-500 px-2 py-1">Atendido</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-between">
              <button onClick={() => { setNotificationsList([]); try { localStorage.removeItem('gm_notifications_list'); } catch(e){}; }} className="text-sm text-red-500">Limpar histórico</button>
              <button onClick={() => setIsNotificationsModalOpen(false)} className="py-2 px-4 bg-slate-900 text-white rounded">Fechar</button>
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
