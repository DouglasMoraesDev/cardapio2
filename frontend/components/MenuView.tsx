
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

  // Carrega produtos do "backend" ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: substituir estabelecimentoId fixo pelo contexto/estado real após login
        const ESTABELECIMENTO_ID = 1;
        const data = await api.getProducts(ESTABELECIMENTO_ID);
        setProducts(data);
      } catch (error) {
        console.error("Erro ao carregar cardápio", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const categories = ['Todas', ...new Set(products.map(p => p.category))];

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
      const res = await api.sendOrder(tableNumber, cartItems);
      if (res.success) {
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
      await api.requestBill(tableNumber);
      alert('Solicitação de fechamento enviada!');
      setIsAccountOpen(false);
    } catch (e) {
      alert("Erro ao solicitar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const accountTotal = accountItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p className="font-bold animate-pulse">Carregando Cardápio...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-slate-50 min-h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm rounded-t-2xl">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
           </button>
           <h1 className="text-xl font-black text-slate-800">Mesa {tableNumber}</h1>
        </div>
        <button onClick={onBack} className="text-red-500 font-bold text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
          Sair
        </button>
      </div>

      <div className="p-6 flex-grow pb-40">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Qual será a pedida de hoje?</h2>
        
        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeCategory === cat 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{activeCategory}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products
              .filter(p => activeCategory === 'Todas' || p.category === activeCategory)
              .map(product => (
                <div key={product.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl">
                    {product.category === 'Cerveja' ? '🍺' : '🍴'}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-800 text-lg leading-tight uppercase">{product.name}</h4>
                      <span className="font-black text-emerald-600 whitespace-nowrap">R$ {product.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Shared Overlay */}
      {(isCartOpen || isAccountOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] animate-in fade-in duration-300" onClick={() => { setIsCartOpen(false); setIsAccountOpen(false); }} />
      )}

      {/* Cart Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[50] transition-transform duration-500 shadow-2xl ${isCartOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-8 max-w-2xl mx-auto">
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
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">{item.quantity}</div>
                      <div>
                        <p className="font-black text-slate-800 uppercase text-sm">{item.name}</p>
                        <p className="text-xs text-emerald-600 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm">-</button>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-t border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-xs tracking-widest">Total do Pedido</span>
                <span className="text-3xl font-black text-slate-900">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                disabled={isLoading}
                onClick={sendOrderToKitchen}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-2xl transition-all text-lg disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Drawer */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[50] transition-transform duration-500 shadow-2xl ${isAccountOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
        <div className="p-8 max-w-2xl mx-auto">
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
            <div className="flex justify-between items-center py-4 border-t border-slate-100">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Total a Pagar</span>
                <span className="text-3xl font-black text-emerald-600">R$ {accountTotal.toFixed(2)}</span>
              </div>
            </div>
            <button 
              disabled={accountTotal === 0 || isLoading}
              onClick={requestBill}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-black py-5 rounded-2xl shadow-2xl transition-all text-lg flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9m3 3-3-3 3-3M4 17h9m-3-3 3 3-3 3"/></svg>
              {isLoading ? 'Processando...' : 'Pedir Fechamento (Trazer Conta)'}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-2xl mx-auto bg-slate-900 text-white p-6 rounded-t-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs">👤</div>
              <span className="text-xs font-bold text-slate-400">Garçom: <span className="text-white">{waiterName}</span></span>
            </div>
            <button onClick={() => { setIsCartOpen(true); setIsAccountOpen(false); }} className={`text-xs font-black uppercase transition-all flex items-center gap-1 px-3 py-1.5 rounded-full ${isCartOpen ? 'bg-orange-500 text-white' : 'text-orange-400 hover:text-orange-300'}`}>
              Meu Pedido
              <div className="ml-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">{cartItems.length}</div>
            </button>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Atual</p>
              <h4 className="text-2xl font-black">R$ {(cartTotal + accountTotal).toFixed(2)}</h4>
            </div>
            <button onClick={() => { setIsAccountOpen(true); setIsCartOpen(false); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
