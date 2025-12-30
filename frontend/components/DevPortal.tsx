import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const DevPortal: React.FC<{ onBack?: () => void; initialView?: 'register'|'login'|'dashboard' }> = ({ onBack, initialView }) => {
  const [view, setView] = useState<'register'|'login'|'dashboard'>(initialView || 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedUser, setLoggedUser] = useState<string | null>(null);
  const [estabId, setEstabId] = useState<number | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // load list of establishments if on dashboard
    if (view === 'dashboard' || view === 'login') {
      // nothing yet
    }
  }, []);

  const [establishments, setEstablishments] = useState<Array<any>>([]);
  const [loadingEsts, setLoadingEsts] = useState(false);
  const [selectedEst, setSelectedEst] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [newEst, setNewEst] = useState<{ nome?: string; documento?: string; cep?: string; endereco?: string; taxa_servico?: number; logo_url?: string }>({});

  const loadEstablishments = async () => {
    try {
      setLoadingEsts(true);
      const res = await api.listEstablishments();
      setEstablishments(res || []);
    } catch (e) {
      console.error('Erro ao listar estabelecimentos', e);
      setEstablishments([]);
    } finally { setLoadingEsts(false); }
  };

  const handleRegister = async () => {
    if (!username || !password) return alert('Informe usuário e senha');
    try {
      const res = await api.registerDev(username, password);
      if (res && res.sucesso) {
        setMessage('Usuário criado no servidor. Faça login.');
        setView('login');
      } else {
        setMessage('Falha ao registrar: ' + (res && (res as any).error ? (res as any).error : 'erro'));
      }
    } catch (e) {
      console.error(e);
      setMessage('Erro ao registrar usuário');
    }
  };

  const handleLogin = async () => {
    if (!username || !password) return alert('Informe usuário e senha');
    try {
      const res = await api.loginDev(username, password);
      if (res && (res as any).sucesso && (res as any).token) {
        setLoggedUser(username);
        setView('dashboard');
        setMessage(null);
        try { localStorage.setItem('gm_token', (res as any).token); } catch (e) { /* ignore */ }
        // load establishments once logged in
        setTimeout(() => loadEstablishments(), 100);
      } else {
        alert('Credenciais inválidas');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao autenticar');
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerFile) return alert('Selecione um arquivo');
    try {
      const up = await api.uploadProductImage(bannerFile);
      const url = up?.url || up?.imagem_url || up?.imageUrl || '';
      setBannerUrl(url);
      // If estabelecimento selected, try to save to backend
      if (estabId) {
        try {
          await api.updateEstablishmentById(estabId, { imagem_banner: url, tema_fonte: fontFamily });
          setMessage('Banner salvo no estabelecimento.');
        } catch (e) {
          console.warn('Erro ao salvar banner no backend', e);
          setMessage('Banner enviado, mas falha ao salvar no backend.');
        }
      } else {
        setMessage('Banner enviado. Informe um estabelecimento para salvar no servidor.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar imagem');
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (!estabId) return setMessage('Informe o ID do estabelecimento para salvar no backend.');
      await api.updateEstablishmentById(estabId, { imagem_banner: bannerUrl || undefined, tema_fonte: fontFamily || undefined });
      setMessage('Configurações salvas no estabelecimento.');
    } catch (e) {
      console.error(e);
      setMessage('Falha ao salvar configurações.');
    }
  };

  const handleSelectEst = async (est: any) => {
    setSelectedEst(est);
    // fetch counts
    try {
      const [prods, mesas, stats] = await Promise.all([
        api.getProducts(est.id).catch(() => []),
        api.getMesas(est.id).catch(() => []),
        api.getEstablishmentStats(est.id).catch(() => null)
      ]);
      setSelectedEst({ ...est, counts: { products: (prods || []).length, mesas: (mesas || []).length, pedidos: stats ? stats.ordersCount : 0 } });
    } catch (e) { console.error('Erro ao carregar detalhes do estabelecimento', e); }
  };

  const handleCreateEst = async () => {
    try {
      setCreating(true);
      // registerRestaurant expects RegistrationState shape; adapt minimal
      const payload: any = { establishment: { name: newEst.nome || 'Novo', document: newEst.documento || '', cep: newEst.cep || '', address: newEst.endereco || '', serviceTax: Number(newEst.taxa_servico || 0), logoUrl: newEst.logo_url || '' }, admin: { username: `admin_${Date.now()}`, password: 'changeme' } };
      const res = await api.registerRestaurant(payload as any);
      if (res && res.sucesso) {
        setMessage('Estabelecimento criado');
        await loadEstablishments();
        setNewEst({});
      } else {
        setMessage('Falha ao criar estabelecimento');
      }
    } catch (e) { console.error(e); setMessage('Erro ao criar estabelecimento'); }
    finally { setCreating(false); }
  };

  const handleDeleteEst = async (id: number) => {
    if (!confirm('Remover estabelecimento? A operação é irreversível.')) return;
    try {
      await api.deleteEstablishment(id);
      setMessage('Estabelecimento removido');
      await loadEstablishments();
    } catch (e:any) { console.error(e); alert('Erro ao remover estabelecimento: ' + (e?.message || '')) }
  };

  if (view === 'register') {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Registrar Desenvolvedor</h2>
          <p className="text-sm text-slate-500">Crie um usuário de desenvolvedor para gerenciar o app.</p>
        </div>
        <input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
        <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
        <div className="flex gap-2">
          <button onClick={handleRegister} className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-lg shadow">Registrar</button>
          <button onClick={() => setView('login')} className="flex-1 bg-slate-100 px-4 py-2 rounded-lg">Ir para Login</button>
        </div>
        <div className="mt-3 text-right">
          <button onClick={onBack} className="text-xs text-slate-500">Fechar</button>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Login Desenvolvedor</h2>
          <p className="text-sm text-slate-500">Acesse o painel para gerenciar estabelecimentos.</p>
        </div>
        {message && <div className="mb-3 text-sm text-emerald-600">{message}</div>}
        <input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
        <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
        <div className="flex gap-2">
            <button onClick={handleLogin} className="flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow">Entrar</button>
            <button onClick={() => setView('register')} className="flex-1 bg-slate-100 px-4 py-2 rounded-lg">Registrar</button>
          </div>
        <div className="mt-3 text-right">
          <button onClick={onBack} className="text-xs text-slate-500">Fechar</button>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Desenvolvedor — Estabelecimentos</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { setLoggedUser(null); setView('login'); localStorage.removeItem('gm_token'); }} className="px-3 py-2 bg-slate-100 rounded">Logout</button>
            <button onClick={loadEstablishments} className="px-3 py-2 bg-slate-50 rounded">Atualizar</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">Estabelecimentos ({establishments.length})</h4>
                <div className="text-sm text-slate-500">{loadingEsts ? 'Carregando...' : ''}</div>
              </div>
              <div className="space-y-2">
                {establishments.map((est:any) => (
                  <div key={est.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-bold">{est.nome}</div>
                      <div className="text-sm text-slate-500">ID: {est.id} • {est.documento || ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSelectEst(est)} className="px-3 py-1 bg-slate-100 rounded">Details</button>
                      <button onClick={() => handleDeleteEst(est.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded">Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedEst && (
              <div className="bg-white p-4 rounded shadow-sm border">
                <h4 className="font-bold mb-2">Detalhes — {selectedEst.nome}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-slate-500">Produtos</div>
                    <div className="font-black text-lg">{selectedEst.counts?.products ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Mesas</div>
                    <div className="font-black text-lg">{selectedEst.counts?.mesas ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Pedidos (período)</div>
                    <div className="font-black text-lg">{selectedEst.counts?.pedidos ?? '—'}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={async () => { try { const full = await api.getEstablishmentById(selectedEst.id); setSelectedEst(full); } catch (e) { console.error(e); } }} className="px-3 py-2 bg-slate-100 rounded">Atualizar</button>
                  <button onClick={() => setSelectedEst(null)} className="px-3 py-2 bg-slate-50 rounded">Fechar</button>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-white p-4 rounded shadow-sm border">
            <h4 className="font-bold mb-3">Criar Estabelecimento</h4>
            <input placeholder="Nome" value={newEst.nome || ''} onChange={e => setNewEst(s => ({ ...s, nome: e.target.value }))} className="w-full px-3 py-2 border rounded mb-2" />
            <input placeholder="Documento" value={newEst.documento || ''} onChange={e => setNewEst(s => ({ ...s, documento: e.target.value }))} className="w-full px-3 py-2 border rounded mb-2" />
            <input placeholder="Endereço" value={newEst.endereco || ''} onChange={e => setNewEst(s => ({ ...s, endereco: e.target.value }))} className="w-full px-3 py-2 border rounded mb-2" />
            <input placeholder="Taxa serviço (%)" type="number" value={newEst.taxa_servico ?? ''} onChange={e => setNewEst(s => ({ ...s, taxa_servico: Number(e.target.value) }))} className="w-full px-3 py-2 border rounded mb-2" />
            <div className="flex gap-2">
              <button onClick={handleCreateEst} disabled={creating} className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded">Criar</button>
              <button onClick={() => setNewEst({})} className="flex-1 bg-slate-100 px-3 py-2 rounded">Limpar</button>
            </div>
            {message && <div className="mt-3 text-sm text-slate-600">{message}</div>}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-6 border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Painel do Desenvolvedor</h2>
          <p className="text-sm text-slate-500">Gerencie banners, fontes e configurações dos estabelecimentos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">Logado como <strong className="text-slate-700">{loggedUser}</strong></div>
          <button onClick={() => { setLoggedUser(null); setView('login'); localStorage.removeItem('gm_token'); }} className="px-3 py-1 bg-slate-100 rounded">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-50 p-4 rounded">
          <h4 className="font-bold mb-3">Gerenciar Estabelecimento</h4>
          <p className="text-sm text-slate-500 mb-3">Informe o ID do estabelecimento que deseja gerenciar. As alterações serão aplicadas se o token permitir.</p>
          <input type="number" value={estabId ?? ''} onChange={e => setEstabId(e.target.value ? Number(e.target.value) : null)} placeholder="Estabelecimento ID" className="w-full px-3 py-2 border rounded mb-3" />
          <label className="block text-sm font-bold mb-1">Banner do Cardápio</label>
          <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="mb-3" />
          <div className="flex gap-2 mb-4">
            <button onClick={handleUploadBanner} className="bg-emerald-600 text-white px-4 py-2 rounded">Enviar Banner</button>
            <button onClick={handleSaveSettings} className="bg-orange-500 text-white px-4 py-2 rounded">Salvar Configurações</button>
            <button onClick={() => { setBannerUrl(''); setFontFamily('Inter'); setMessage('Reset concluído'); }} className="bg-slate-100 px-4 py-2 rounded">Reset</button>
          </div>
          {bannerUrl && <div className="mb-3"><div className="text-sm text-slate-500 mb-1">Preview</div><img src={bannerUrl} alt="banner" className="w-full h-36 object-cover rounded" /></div>}

          <div className="mt-4">
            <h5 className="font-bold mb-2">Aparência</h5>
            <p className="text-sm text-slate-500 mb-2">Escolha a fonte que aparecerá no cardápio público.</p>
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full px-3 py-2 border rounded mb-3">
              <option value="Inter">Inter (padrão)</option>
              <option value="Roboto">Roboto</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Georgia">Georgia</option>
              <option value="Arial">Arial</option>
            </select>
            {message && <div className="mt-2 text-sm text-slate-700">{message}</div>}
          </div>
        </div>

        <aside className="bg-white p-4 rounded shadow-sm border">
          <h5 className="font-bold mb-3">Preview do Cardápio</h5>
          <div className="border rounded overflow-hidden">
            {bannerUrl ? (
              <img src={bannerUrl} alt="banner" className="w-full h-28 object-cover" />
            ) : (
              <div className="w-full h-28 bg-gradient-to-r from-orange-200 to-rose-100 flex items-center justify-center text-slate-600">Sem banner</div>
            )}
            <div style={{ fontFamily: fontFamily }} className="p-3">
              <h3 className="text-lg font-bold">Nome do Estabelecimento</h3>
              <p className="text-sm text-slate-500">Exemplo de item • R$ 12,00</p>
              <p className="text-sm text-slate-400 mt-3">Fonte aplicada: <strong>{fontFamily}</strong></p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
