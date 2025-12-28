
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
                const mesas = await api.getMesas(estabId);
                mesaObj = (mesas || []).find((m:any) => String(m.numero) === String(mesaParam) || String(m.id) === String(mesaParam));
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
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
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

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [establishment, setEstablishment] = useState<any>(null);
  const [taxaServico, setTaxaServico] = useState<number>(0);

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
    } catch (e) { /* ignore */ }
    return () => { try { if (es) es.close(); } catch (e) {} };
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
  const accentColor = establishment?.tema_cor_destaque || '#f59e0b';
  const placeholderBg = (establishment?.tema_fundo_cartoes && establishment.tema_fundo_cartoes !== '#ffffff') ? 'rgba(255,255,255,0.04)' : '#f3f4f6';
  const cardBorder = (establishment?.tema_fundo_cartoes && establishment.tema_fundo_cartoes !== '#ffffff') ? 'rgba(255,255,255,0.08)' : '#e6e6e6';

  return (
    <div style={{ backgroundColor: establishment?.tema_fundo_geral || undefined, color: textColor }} className="w-full min-h-screen flex justify-center">
      <div className="w-full max-w-6xl min-h-[80vh] px-6 lg:px-12 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden" style={{ color: textColor }}>
      {/* Header */}
      <div style={{ backgroundColor: cardBg, color: textColor }} className="px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm rounded-t-2xl">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
           </button>
           <h1 className="text-xl font-black" style={{ color: textColor || '#0f172a' }}>Mesa {tableNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="font-bold text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors" style={{ color: textColor || '#ef4444' }}>
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
              <div key={cat}>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">{cat}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {list.map(product => (
                    <div key={product.id} className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition relative" style={{ backgroundColor: 'transparent' }}>
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
                            <p className="text-xs mt-1" style={{ color: textColor ? textColor : '#94a3b8' }}>{product.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-emerald-500">R$ {Number(product.price).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <button onClick={() => handleAddToCart(product)} className="py-2 px-3 rounded-md font-bold text-sm" style={{ backgroundColor: primaryColor, color: textColor || '#fff' }}>Adicionar</button>
                          <button onClick={() => setCartItems(prev => [{ ...(product as any), quantity: 1 }, ...prev])} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: accentColor, color: '#fff' }}>+</button>
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

      {/* Cart Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[50] transition-transform duration-500 shadow-2xl ${isCartOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ backgroundColor: cardBg, color: textColor }}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900">Pedido</h3>
            <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="min-h-[200px] max-h-[40vh] overflow-y-auto mb-8 scrollbar-hide">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl">🛒</div>
                <p className="font-bold text-slate-500">Sua sacola está vazia</p>
              </div>
            ) : (
              <div className="space-y-6">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor, color: '#fff' }}>{item.quantity}</div>
                          <div>
                            <p className="font-black uppercase text-sm" style={{ color: textColor }}>{item.name}</p>
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
                <span className="font-bold text-slate-400 uppercase text-xs tracking-widest">Total do Pedido</span>
                <span className="text-3xl font-black text-slate-900">R$ {cartTotal.toFixed(2)}</span>
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
            <h3 className="text-2xl font-black text-slate-900">Minha Conta</h3>
            <button onClick={() => setIsAccountOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="min-h-[200px] max-h-[40vh] overflow-y-auto mb-8 scrollbar-hide">
            {accountItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl">📄</div>
                <p className="font-bold text-slate-500">Nenhum consumo registrado</p>
              </div>
            ) : (
              <div className="space-y-6">
                {accountItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black text-slate-400">{item.quantity}x</div>
                      <div>
                        <p className="font-bold text-slate-800 uppercase text-xs">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Lançado por: {waiterName}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
            <div className="space-y-4">
            <div className="flex justify-between items-center py-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
                <div>
                <span className="font-bold uppercase text-[10px] tracking-widest block mb-1" style={{ color: textColor || '#94a3b8' }}>Total (sem taxa)</span>
                <span className="text-lg font-bold" style={{ color: textColor }}>{`R$ ${accountTotal.toFixed(2)}`}</span>
                <div className="text-xs" style={{ color: textColor || '#94a3b8' }}>Taxa de serviço: {taxaServico}%</div>
              </div>
              <div>
                <span className="font-bold uppercase text-[10px] tracking-widest block mb-1" style={{ color: textColor || '#94a3b8' }}>Total com taxa</span>
                <span className="text-3xl font-black" style={{ color: '#10b981' }}>R$ {totalWithTax(accountTotal).toFixed(2)}</span>
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
        <div className="max-w-6xl mx-auto p-6 rounded-t-3xl shadow-2xl flex items-center justify-center gap-6" style={{ backgroundColor: 'transparent', color: textColor || '#fff' }}>
          <button onClick={async () => { try { const estabId = Number(localStorage.getItem('gm_estabelecimentoId')||0); await api.callWaiter(estabId, tableNumber); alert('Garçom chamado.'); } catch(e){ alert('Erro ao chamar garçom'); } }} className="w-16 h-16 rounded-full flex items-center justify-center flex-col font-bold" style={{ backgroundColor: cardBg, color: textColor, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm">GARÇOM</div>
          </button>

          <button onClick={() => { setIsCartOpen(true); setIsAccountOpen(false); }} className="px-8 py-4 rounded-full flex flex-col items-center justify-center shadow-2xl" style={{ backgroundColor: accentColor, color: '#fff', minWidth: 360 }}>
            <div className="flex items-center gap-3 font-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/></svg>
              <div>MEU PEDIDO</div>
            </div>
            <div className="text-xs mt-1">Total: R$ {accountTotal.toFixed(2)}</div>
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
