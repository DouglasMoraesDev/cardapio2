
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

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

  const openModal = (title: string, body: any) => {
    setModalContent({ title, body });
    setModalOpen(true);
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
    </div>
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
      if (activeTab === 'financeiro') {
        try {
          const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
          const s = await api.getDailyStats(estabId);
          setStats(s);
        } catch (e) {
          console.error('Erro ao carregar estatísticas', e);
        }
      }
    };
    load();
  }, [activeTab]);

  const renderCardapio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Menu</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNewProductForm(v => !v)} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center gap-2">
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
                    const novoNome = prompt('Novo nome', p.name);
                    if (!novoNome) return;
                    try {
                      await api.updateProduct(p.id, { nome: novoNome });
                      const estabId = Number(localStorage.getItem('gm_estabelecimentoId') || 0);
                      const res = await api.getProducts(estabId);
                      setProducts(res || []);
                    } catch (e) { console.error(e); alert('Erro ao atualizar'); }
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
        {activeTab === 'financeiro' && renderFinanceiro()}
        {activeTab === 'avaliacoes' && renderAvaliacoes()}
        {activeTab === 'mesas-fechadas' && renderMesasFechadas()}
        {activeTab === 'ajustes' && renderAjustes()}
      </div>
      {modalOpen && modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl p-6 z-60 max-w-3xl w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">{modalContent.title}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">Fechar</button>
            </div>
            <div className="space-y-4 text-sm text-slate-700">
              <pre className="whitespace-pre-wrap text-xs bg-slate-50 p-4 rounded">{JSON.stringify(modalContent.body, null, 2)}</pre>
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
      }
    } catch (e) {
      console.error('Erro ao carregar ajustes', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      setLoading(true);
      await api.updateEstablishment({ taxa_servico: taxa, tema_fundo_geral: fundoGeral, tema_fundo_cartoes: fundoCartoes, tema_cor_texto: corTexto, tema_cor_primaria: corPrimaria, tema_cor_destaque: corDestaque });
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
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button disabled={loading} onClick={save} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-100">{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
      </div>
    </div>
  );
};
