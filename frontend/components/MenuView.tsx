
import React, { useState, useEffect } from 'react';
import { api, Product } from '../services/api';

interface CartItem extends Product {
  quantity: number;
}

interface Props {
  onBack: () => void;
  waiterName: string;
  tableNumber: string;
}

export const MenuView: React.FC<Props> = ({ onBack, waiterName, tableNumber }) => {
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [accountItems, setAccountItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Carrega produtos do "backend" ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
        if (!estabId) {
          console.error('EstabelecimentoId não encontrado no localStorage');
          setProducts([]);
          return;
        }
        const data = await api.getProducts(estabId);
        setProducts(data);
        // carregar conta atual se abrir via mapa de mesas (localStorage) ou buscar mesa no servidor
        try {
          const cm = localStorage.getItem('gm_current_mesa');
          let mesaObj: any = null;
          if (cm) {
            mesaObj = JSON.parse(cm);
          } else {
            // tentar buscar mesa pelo query param `mesa` (caso a guia tenha sido aberta com ?mesa=)
            try {
              const qp = new URLSearchParams(window.location.search);
              const mesaParam = qp.get('mesa');
              if (mesaParam) {
                    const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                    let mesas = [] as any[];
                    if (estabId) {
                      try { mesas = await api.getMesas(estabId); } catch (e) { mesas = []; }
                    }
                    mesaObj = (mesas || []).find((m:any) => String(m.numero) === String(mesaParam) || String(m.id) === String(mesaParam));
                    if (!mesaObj && estabId) {
                      // ensure mesa exists on backend (create if necessary)
                      try {
                        const resp: any = await api.createMesa(estabId, String(mesaParam));
                        if (resp && resp.sucesso && resp.mesa) mesaObj = resp.mesa;
                      } catch (e) { /* ignore */ }
                    }
                    if (mesaObj) {
                      try { localStorage.setItem('gm_current_mesa', JSON.stringify(mesaObj)); } catch (e) {}
                    }
              }
            } catch (e) {
              console.warn('Erro ao buscar mesa por query param', e);
            }
          }
          if (mesaObj) {
            const itensFromMesa: any[] = [];
            (mesaObj.pedidos || []).forEach((p:any) => {
              (p.itens || []).forEach((it:any) => itensFromMesa.push({ produtoId: it.produtoId, quantidade: it.quantidade }));
            });
            if (itensFromMesa.length > 0) {
              const agg: Record<number, number> = {};
              itensFromMesa.forEach(i => { agg[i.produtoId] = (agg[i.produtoId] || 0) + i.quantidade; });
              const account: CartItem[] = Object.keys(agg).map(pid => {
                const prod = data.find(p => p.id === Number(pid));
                return { ...(prod || { id: Number(pid), name: 'Produto', price: 0 }), quantity: agg[Number(pid)] } as CartItem;
              });
              setAccountItems(account);
            }
          }
        } catch (e) { console.error('Erro ao carregar conta da mesa', e); }
      } catch (error) {
        console.error("Erro ao carregar cardápio", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    return () => {
      try { localStorage.removeItem('gm_current_mesa'); } catch (e) {}
    };
  }, []);

  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category ?? 'Sem Categoria')) )];

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const next = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        // show toast
        setToastMessage(`${product.name} adicionado ao carrinho`);
        setTimeout(() => setToastMessage(null), 1600);
        return next;
      }
      const next = [...prev, { ...product, quantity: 1 }];
      setToastMessage(`${product.name} adicionado ao carrinho`);
      setTimeout(() => setToastMessage(null), 1600);
      return next;
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const sendOrderToKitchen = async () => {
    try {
      setIsLoading(true);
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      if (!estabId) { alert('Estabelecimento não identificado. Recarregue a página ou entre pelo painel.'); return; }
      const itens = cartItems.map(ci => ({ produtoId: ci.id, quantidade: ci.quantity }));
      const res = await api.sendOrder(estabId, tableNumber, itens);
      if (res && res.sucesso) {
        setAccountItems(prev => {
          const updatedAccount = [...prev];
          cartItems.forEach(cartItem => {
            const existing = updatedAccount.find(accItem => accItem.id === cartItem.id);
            if (existing) {
              existing.quantity += cartItem.quantity;
            } else {
              updatedAccount.push({ ...cartItem });
            }
          });
          return updatedAccount;
        });
        setCartItems([]);
        setIsCartOpen(false);
      }
    } catch (e) {
      alert("Erro ao enviar pedido");
    } finally {
      setIsLoading(false);
    }
  };

  const requestBill = async () => {
    try {
      setIsLoading(true);
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      await api.requestBill(estabId, Number(tableNumber));
      alert('Solicitação de fechamento enviada!');
      setIsAccountOpen(false);
      // abrir modal de avaliação
      setRatingStars(5);
      setRatingComment('');
      setShowRatingModal(true);
    } catch (e) {
      alert("Erro ao solicitar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async () => {
    try {
      setSubmittingRating(true);
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      await api.createAvaliacao({ estrelas: ratingStars, comentario: ratingComment || undefined, mesaId: Number(tableNumber), estabelecimentoId: estabId });
      setShowRatingModal(false);
      alert('Obrigado pela sua avaliação!');
    } catch (e) {
      console.error('Erro ao enviar avaliação', e);
      alert('Erro ao enviar avaliação');
    } finally {
      setSubmittingRating(false);
    }
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const accountTotal = accountItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const combinedProductsTotal = cartTotal + accountTotal;
  const totalCartItems = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [establishment, setEstablishment] = useState<any>(null);
  const [taxaServico, setTaxaServico] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logoutUser, setLogoutUser] = useState('');
  const [logoutPass, setLogoutPass] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    const loadEstab = async () => {
      try {
        const est = await api.getEstablishment();
        if (est) {
          setEstablishment(est);
          setTaxaServico(Number(est.taxa_servico || 0));
        }
      } catch (e) { /* ignore */ }
    };
    loadEstab();
    try {
      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
      const base = (((import.meta as any).VITE_API_URL) || 'http://localhost:4000').replace(/\/$/, '');
      es = new EventSource(`${base}/api/notifications/stream?estabelecimentoId=${estabId}`);
      es.addEventListener('estabelecimento_updated', (ev: any) => {
        try {
          const payload = JSON.parse(ev.data);
          setEstablishment(payload);
          setTaxaServico(Number(payload.taxa_servico || 0));
        } catch (e) { console.warn('Erro ao processar estabelecimento_updated', e); }
      });

      // Play a short beep only when a pedido is marked as SERVIDO (delivered) — play once per notification
      const playedNotifications = new Set<number>();
      const playBeepOnce = (notificationId?: number) => {
        try {
          if (!notificationId || playedNotifications.has(notificationId)) return;
          playedNotifications.add(notificationId);
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 880;
          g.gain.value = 0.0015;
          o.connect(g);
          g.connect(ctx.destination);
          o.start();
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
          o.stop(ctx.currentTime + 0.36);
          setTimeout(() => { try { ctx.close(); } catch (e) {} }, 1000);
        } catch (e) { /* ignore */ }
      };

      es.addEventListener('pedido_updated', (ev: any) => {
        try {
          const payload = JSON.parse(ev.data);
          const notifId = payload.notificationId || payload.notification?.id;
          const pedido = payload.pedido || payload;
          if (pedido && (pedido.status === 'SERVIDO' || pedido.status === 'ENVIADO')) {
            playBeepOnce(notifId ? Number(notifId) : undefined);
          }
        } catch (e) { console.warn('Erro ao processar pedido_updated', e); }
      });
    } catch (e) { /* ignore */ }
    return () => { try { if (es) es.close(); } catch (e) {} };
  }, []);

  // Apply background color to whole document to avoid white borders
  useEffect(() => {
    try {
      const prevMargin = document.body.style.margin || '';
      // do not modify document background here — MenuView root handles its own background
      document.body.style.margin = '0';
      return () => {
        document.body.style.margin = prevMargin;
      };
    } catch (e) {
      // ignore in non-browser env
    }
  }, [establishment]);

  // Prevent browser back button from leaving the cardápio without garçom confirmation
  useEffect(() => {
    try {
      const pushStateSafe = () => {
        try { window.history.pushState(null, '', window.location.href); } catch (e) {}
      };
      const onPop = (e: PopStateEvent) => {
        // Stop the back navigation and require garçom credentials
        e.preventDefault();
        setShowLogoutModal(true);
        // restore state so successive back attempts will still trigger popstate
        pushStateSafe();
      };
      pushStateSafe();
      window.addEventListener('popstate', onPop);
      return () => {
        try { window.removeEventListener('popstate', onPop); } catch (e) {}
      };
    } catch (e) {
      // ignore in non-browser env
    }
  }, []);

  const totalWithTax = (amount: number) => {
    const t = Number(taxaServico || 0);
    return amount + (amount * (t / 100));
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p className="font-bold animate-pulse">Carregando Cardápio...</p>
      </div>
    );
  }

  const primaryColor = establishment?.tema_cor_primaria || '#0f172a';
  const cardBg = establishment?.tema_fundo_cartoes || '#ffffff';
  const textColor = establishment?.tema_cor_texto || undefined;
  const visibleText = textColor || '#fefce8';
  const accentColor = establishment?.tema_cor_destaque || '#f59e0b';
  const placeholderBg = (establishment?.tema_fundo_cartoes && establishment.tema_fundo_cartoes !== '#ffffff') ? 'rgba(255,255,255,0.04)' : '#f3f4f6';
  const cardBorder = (establishment?.tema_fundo_cartoes && establishment.tema_fundo_cartoes !== '#ffffff') ? 'rgba(255,255,255,0.08)' : '#e6e6e6';

  return (
    <div style={{ backgroundColor: establishment?.tema_fundo_geral || undefined, color: textColor, width: '100vw', minHeight: '100vh' }} className="w-screen min-h-screen flex justify-center">
      {toastMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 top-6 z-50">
          <div className="px-4 py-3 rounded-full shadow-lg bg-black/70 text-white font-bold">{toastMessage}</div>
        </div>
      )}
      <div className="w-full max-w-6xl min-h-[80vh] px-6 lg:px-12 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden" style={{ color: textColor }}>
      {/* Header */}
      <div style={{ backgroundColor: cardBg, color: textColor }} className="px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm rounded-t-2xl">
        <div className="flex items-center gap-3">
           <h1 className="text-xl font-black" style={{ color: textColor || '#0f172a' }}>Mesa {tableNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowLogoutModal(true); }} className="font-bold text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors" style={{ color: textColor || '#ef4444' }}>
            Sair
          </button>
          <button onClick={async () => {
            try {
              const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
              await api.callWaiter(estabId, tableNumber);
              alert('Garçom chamado.');
            } catch (e) { console.error(e); alert('Erro ao chamar garçom'); }
          }} className="px-3 py-1.5 rounded-lg font-bold text-sm" style={{ backgroundColor: accentColor, color: '#fff' }}>Chamar Garçom</button>
          <button onClick={() => { setIsAccountOpen(true); setIsCartOpen(false); }} className="px-3 py-1.5 rounded-lg font-bold text-sm" style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}>Conta</button>
        </div>
      </div>

      <div className="p-6 flex-grow pb-40">
        <h2 className="text-2xl font-bold mb-4">Qual será a pedida de hoje?</h2>

        {/* Search */}
        <div className="mb-4">
          <div className="w-full max-w-full">
            <div className="relative">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Qual será a pedida de hoje?" className="w-full rounded-full px-4 py-3 bg-transparent border" style={{ borderColor: cardBorder, color: textColor }} />
              <div className="absolute left-3 top-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textColor || '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide justify-center">
          {categories.map((cat, idx) => (
            <button
              key={`${cat ?? 'sem'}-${idx}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all`}
              style={activeCategory === cat ? { backgroundColor: primaryColor, color: textColor || '#fff', boxShadow: '0 8px 24px rgba(2,6,23,0.4)' } : { backgroundColor: cardBg, color: textColor ? textColor : '#94a3b8', border: `1px solid ${cardBorder}` }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from(new Set(products.map(p => p.category || 'Sem Categoria'))).map((cat) => {
            const list = products.filter(p => (cat === 'Sem Categoria' ? (p.category === null || p.category === undefined) : p.category === cat) && (activeCategory === 'Todas' || activeCategory === cat) && (String(p.name).toLowerCase().includes(searchQuery.toLowerCase()) || String(p.description || '').toLowerCase().includes(searchQuery.toLowerCase())));
            if (!list || list.length === 0) return null;
            return (
              <div key={`cat-${cat}`}>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">{cat}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {list.map(product => (
                    <div key={`product-${product.id}`} className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition relative" style={{ backgroundColor: 'transparent' }}>
                      <div className="w-full h-32 overflow-hidden">
                        {product.imagem_url ? (
                          <img src={product.imagem_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ backgroundColor: placeholderBg }}>{product.category === 'Cerveja' ? '🍺' : '🍽️'}</div>
                        )}
                      </div>
                      <div className="px-4 py-4" style={{ backgroundColor: cardBg, color: textColor, borderTop: `1px solid ${cardBorder}` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black text-base leading-tight" style={{ color: textColor }}>{product.name}</h4>
                            <div className="text-xs mt-1" style={{ color: textColor ? textColor : '#94a3b8' }}>
                              {product.description ? (
                                <>
                                  <span>{String(product.description).split('\n')[0]}</span>
                                  {((product.description || '').indexOf('\n') >= 0 || (product.description || '').length > 120) && (
                                    <button onClick={() => setSelectedProduct(product)} className="ml-2 text-sm font-bold underline" style={{ color: accentColor }}>
                                      Ler mais
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="opacity-60">Sem descrição</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-emerald-500">R$ {Number(product.price).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <button onClick={() => handleAddToCart(product)} className="py-2 px-3 rounded-md font-bold text-sm" style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}>Adicionar</button>
                          <button onClick={() => handleAddToCart(product)} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: accentColor, color: '#fff' }}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared Overlay */}
      {(isCartOpen || isAccountOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] animate-in fade-in duration-300" onClick={() => { setIsCartOpen(false); setIsAccountOpen(false); }} />
      )}

      {/* Rating Modal Overlay */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 z-40" onClick={() => { if (!submittingRating) setShowRatingModal(false); }} />
          <div className="rounded-2xl shadow-2xl p-6 z-50 max-w-md w-full mx-4" style={{ backgroundColor: cardBg, color: textColor }}>
            <h3 className="text-xl font-bold mb-4">Avalie sua experiência</h3>
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRatingStars(s)} className={`text-3xl ${ratingStars >= s ? 'text-yellow-400' : 'text-slate-300'}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Comentário (opcional)" className="w-full px-4 py-3 border rounded-xl mb-4" style={{ backgroundColor: placeholderBg, color: textColor }} />
            <div className="flex gap-3">
              <button disabled={submittingRating} onClick={submitRating} className="flex-1 py-3 rounded-xl font-bold" style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}>{submittingRating ? 'Enviando...' : 'Enviar Avaliação'}</button>
              <button disabled={submittingRating} onClick={() => setShowRatingModal(false)} className="px-6 py-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textColor || '#111' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal (garçom credentials) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 z-40" onClick={() => { if (!logoutLoading) setShowLogoutModal(false); }} />
          <div className="rounded-2xl shadow-2xl p-6 z-50 max-w-sm w-full mx-4" style={{ backgroundColor: cardBg, color: textColor }}>
            <h3 className="text-xl font-bold mb-4">Confirmação do Garçom</h3>
            <p className="text-sm mb-4" style={{ color: visibleText }}>Informe usuário e senha do garçom para sair do cardápio.</p>
            <input value={logoutUser} onChange={e => setLogoutUser(e.target.value)} placeholder="Usuário" className="w-full px-4 py-3 border rounded-xl mb-3" style={{ backgroundColor: placeholderBg, color: textColor }} />
            <input value={logoutPass} onChange={e => setLogoutPass(e.target.value)} placeholder="Senha" type="password" className="w-full px-4 py-3 border rounded-xl mb-3" style={{ backgroundColor: placeholderBg, color: textColor }} />
            {logoutError && <div className="text-sm text-red-500 mb-2">{logoutError}</div>}
            <div className="flex gap-3">
              <button disabled={logoutLoading} onClick={async () => {
                try {
                  setLogoutLoading(true);
                  setLogoutError(null);
                  const base = (((import.meta as any).VITE_API_URL) || 'http://localhost:4000').replace(/\/$/, '');
                  const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                  const res = await fetch(`${base}/api/auth/garcom`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: logoutUser, senha: logoutPass, estabelecimentoId: estabId }) });
                  if (!res.ok) {
                    const txt = await res.text();
                    setLogoutError(txt || 'Credenciais inválidas');
                    setLogoutLoading(false);
                    return;
                  }
                  // success: allow leaving cardapio
                  try { localStorage.removeItem('gm_current_mesa'); } catch (e) {}
                  setShowLogoutModal(false);
                  setLogoutUser(''); setLogoutPass(''); setLogoutError(null);
                  onBack();
                } catch (e:any) {
                  setLogoutError('Erro ao validar credenciais');
                } finally { setLogoutLoading(false); }
              }} className="flex-1 py-3 rounded-xl font-bold" style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}>{logoutLoading ? 'Validando...' : 'Confirmar'}</button>
              <button disabled={logoutLoading} onClick={() => { setShowLogoutModal(false); setLogoutError(null); }} className="px-6 py-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textColor || '#111' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal (Ler mais / Ler menos) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/70 z-40" onClick={() => setSelectedProduct(null)} />
          <div className="rounded-2xl shadow-2xl p-4 z-50 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: cardBg, color: textColor }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-xl font-black">{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="px-3 py-1 rounded-lg" style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}>Ler menos</button>
            </div>
            {selectedProduct.imagem_url ? (
              <div className="w-full mb-4 flex items-center justify-center">
                <img src={selectedProduct.imagem_url} alt={selectedProduct.name} className="w-full max-h-[48vh] object-contain rounded-lg" />
              </div>
            ) : null}
            <div className="prose" style={{ color: textColor, whiteSpace: 'pre-wrap' }}>
              {selectedProduct.description || 'Sem descrição'}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[50] transition-transform duration-500 shadow-2xl ${isCartOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ backgroundColor: cardBg, color: textColor }}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
          <div className="p-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black" style={{ color: visibleText }}>Pedido</h3>
            <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="min-h-[200px] max-h-[40vh] overflow-y-auto mb-8 scrollbar-hide">
              {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl">🛒</div>
                <p className="font-bold" style={{ color: visibleText }}>Sua sacola está vazia</p>
              </div>
            ) : (
              <div className="space-y-6">
                    {cartItems.map(item => (
                      <div key={`cart-${item.id}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: '#fff' }}>{item.quantity}</div>
                          <div>
                            <p className="font-black uppercase text-sm" style={{ color: visibleText }}>{item.name}</p>
                            <p className="text-xs font-bold" style={{ color: '#10b981' }}>R$ {(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-1 rounded-xl" style={{ backgroundColor: cardBg }}>
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textColor }}>-</button>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textColor }}>+</button>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
                <span className="font-bold uppercase text-xs tracking-widest" style={{ color: visibleText }}>Total do Pedido</span>
                <span className="text-3xl font-black" style={{ color: '#10b981' }}>R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                disabled={isLoading}
                onClick={sendOrderToKitchen}
                className="w-full font-black py-5 rounded-2xl shadow-2xl transition-all text-lg disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}
              >
                {isLoading ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[50] transition-transform duration-500 shadow-2xl ${isAccountOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ backgroundColor: cardBg, color: textColor }}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
          <div className="p-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black" style={{ color: visibleText }}>Minha Conta</h3>
            <button onClick={() => setIsAccountOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="min-h-[200px] max-h-[40vh] overflow-y-auto mb-8 scrollbar-hide">
            {accountItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl">📄</div>
                <p className="font-bold" style={{ color: visibleText }}>Nenhum consumo registrado</p>
              </div>
            ) : (
              <div className="space-y-6">
                {accountItems.map(item => (
                  <div key={`account-${item.id}`} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black" style={{ color: visibleText }}>{item.quantity}x</div>
                      <div>
                        <p className="font-bold uppercase text-xs" style={{ color: visibleText }}>{item.name}</p>
                        <p className="text-[10px] font-medium" style={{ color: visibleText }}>Lançado por: {waiterName}</p>
                      </div>
                    </div>
                    <span className="font-black text-sm" style={{ color: visibleText }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
            <div className="space-y-4">
            <div className="flex flex-col gap-2 py-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[12px]" style={{ color: visibleText }}>Subtotal</span>
                  <span className="font-bold" style={{ color: visibleText }}>{`R$ ${accountTotal.toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[12px]" style={{ color: visibleText }}>Serviço</span>
                  <span className="font-bold" style={{ color: visibleText }}>{`R$ ${(accountTotal * (taxaServico/100)).toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[12px]" style={{ color: visibleText }}>Total</span>
                  <span className="text-3xl font-black" style={{ color: '#10b981' }}>R$ {(accountTotal + (accountTotal * (taxaServico/100))).toFixed(2)}</span>
                </div>
            </div>
            <button 
              disabled={accountTotal === 0 || isLoading}
              onClick={requestBill}
              className="w-full font-black py-5 rounded-2xl shadow-2xl transition-all text-lg flex items-center justify-center gap-3"
              style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9m3 3-3-3 3-3M4 17h9m-3-3 3 3-3 3"/></svg>
              {isLoading ? 'Processando...' : 'Pedir Fechamento (Trazer Conta)'}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="max-w-6xl mx-auto p-6 rounded-t-3xl shadow-2xl flex items-center justify-center gap-6" style={{ backgroundColor: 'transparent', color: visibleText }}>
          <button onClick={async () => { try { const estabId = Number(localStorage.getItem('gm_estabelecimentoId')||0); await api.callWaiter(estabId, tableNumber); alert('Garçom chamado.'); } catch(e){ alert('Erro ao chamar garçom'); } }} className="w-16 h-16 rounded-full flex items-center justify-center flex-col font-bold" style={{ backgroundColor: cardBg, color: textColor, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm">GARÇOM</div>
          </button>

            <button onClick={() => { setIsCartOpen(true); setIsAccountOpen(false); }} className="px-8 py-4 rounded-full flex flex-col items-center justify-center shadow-2xl meu-pedido-btn" style={{ backgroundColor: accentColor, color: '#fff' }}>
            <div className="flex items-center gap-3 font-black">
              <div style={{ minWidth: 34, minHeight: 34 }} className="rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                {totalCartItems}
              </div>
              <div>MEU PEDIDO</div>
            </div>
            <div className="text-xs mt-1" style={{ color: visibleText }}>Total: R$ {combinedProductsTotal.toFixed(2)}</div>
          </button>

          <button onClick={() => { setIsAccountOpen(true); setIsCartOpen(false); }} className="w-16 h-16 rounded-full flex items-center justify-center flex-col font-bold" style={{ backgroundColor: cardBg, color: textColor, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm">CONTA</div>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
