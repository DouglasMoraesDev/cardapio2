
import { RegistrationState } from '../types';

// Prefer Vite env `VITE_API_URL`; when not set and running in browser, use same origin (production)
const viteUrl = (import.meta as any).VITE_API_URL;
// When developing on localhost prefer backend dev URL (http://localhost:4000). In production use same origin.
let defaultBase = 'http://localhost:4000';
if (typeof window !== 'undefined' && window.location) {
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    defaultBase = origin;
  }
}
let API_BASE = (viteUrl || defaultBase).replace(/\/$/, '');
// Allow developer override when accessing production UI: set localStorage 'gm_force_local_api' = 'true'
// in your browser to force API calls to `http://localhost:4000` (useful for testing against a local backend).
try {
  if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('gm_force_local_api') === 'true') {
    API_BASE = 'http://localhost:4000';
    // eslint-disable-next-line no-console
    console.info('API_BASE overridden to http://localhost:4000 via localStorage gm_force_local_api');
  }
} catch (e) {
  // ignore
}
export { API_BASE };

const TOKEN_KEY = 'gm_token';
const ESTAB_KEY = 'gm_estabelecimentoId';

export function salvarAuth(token: string, estabelecimentoId: number) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ESTAB_KEY, String(estabelecimentoId));
  } catch (e) {
    console.warn('Não foi possível salvar auth no localStorage', e);
  }
}

export function limparAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ESTAB_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getEstabelecimentoId(): number | null {
  const v = localStorage.getItem(ESTAB_KEY);
  return v ? Number(v) : null;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
  description?: string;
  imagem_url?: string;
}

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const headers = new Headers(init?.headers as any || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...(init || {}), headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const api = {
  async registerRestaurant(data: RegistrationState): Promise<{ sucesso: boolean; token?: string; estabelecimentoId?: number; estabelecimento?: any }> {
    const url = `${API_BASE}/api/estabelecimentos`;
    const res = await fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res && res.sucesso && res.token && res.estabelecimentoId) {
      salvarAuth(res.token, res.estabelecimentoId);
    }
    return res;
  },

  async getProducts(estabelecimentoId: number): Promise<Product[]> {
    const query = new URLSearchParams({ estabelecimentoId: String(estabelecimentoId) });
    const url = `${API_BASE}/api/produtos?${query.toString()}`;
    const raw = await fetchJson(url);
    // map backend fields (pt-BR) to frontend-friendly names
    return (raw || []).map((p: any) => ({
      id: p.id,
      name: p.nome ?? p.name,
      price: p.preco ?? p.price,
      category: p.categoria?.nome ?? p.categoria ?? p.category ?? null,
      description: p.descricao ?? p.description,
      imagem_url: p.imagem_url ?? p.imagemUrl ?? p.imageUrl ?? null,
    }));
  },

  async loginAdmin(usuario: string, senha: string) {
    const url = `${API_BASE}/api/auth/admin`;
    const res = await fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario, senha }) });
    if (res && res.sucesso && res.token && res.estabelecimentoId) {
      salvarAuth(res.token, res.estabelecimentoId);
    }
    return res;
  },

  async loginGarcom(nome: string, senha: string, estabelecimentoId: number) {
    const url = `${API_BASE}/api/auth/garcom`;
    const res = await fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, senha, estabelecimentoId }) });
    if (res && res.sucesso && res.token && res.estabelecimentoId) {
      salvarAuth(res.token, res.estabelecimentoId);
    }
    return res;
  },

  // --- Categorias ---
  async getCategories(estabelecimentoId: number) {
    const url = `${API_BASE}/api/categorias?estabelecimentoId=${estabelecimentoId}`;
    return fetchJson(url);
  },

  async createCategory(nome: string) {
    const url = `${API_BASE}/api/categorias`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome }) });
  },

  async updateCategory(id: number, nome: string) {
    const url = `${API_BASE}/api/categorias/${id}`;
    return fetchJson(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome }) });
  },

  async deleteCategory(id: number) {
    const url = `${API_BASE}/api/categorias/${id}`;
    return fetchJson(url, { method: 'DELETE' });
  },

  // --- Produtos ---
  async createProduct(data: { nome: string; preco: number; descricao?: string; categoriaId?: number; imagem_url?: string }) {
    const url = `${API_BASE}/api/produtos`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  async updateProduct(id: number, data: { nome?: string; preco?: number; descricao?: string; categoriaId?: number; imagem_url?: string }) {
    const url = `${API_BASE}/api/produtos/${id}`;
    return fetchJson(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  async deleteProduct(id: number) {
    const url = `${API_BASE}/api/produtos/${id}`;
    return fetchJson(url, { method: 'DELETE' });
  },

  async uploadProductImage(file: File) {
    const url = `${API_BASE}/api/produtos/upload`;
    const token = getToken();
    const fd = new FormData();
    fd.append('file', file);
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: fd, headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // --- Garçons ---
  async getWaiters(estabelecimentoId: number) {
    const url = `${API_BASE}/api/garcons?estabelecimentoId=${estabelecimentoId}`;
    return fetchJson(url);
  },

  async getMesas(estabelecimentoId: number, aberta?: boolean) {
    const qs = new URLSearchParams({ estabelecimentoId: String(estabelecimentoId) });
    if (typeof aberta === 'boolean') qs.set('aberta', aberta ? 'true' : 'false');
    const url = `${API_BASE}/api/mesas?${qs.toString()}`;
    return fetchJson(url);
  },

  async createMesa(estabelecimentoId: number, numero: string) {
    const url = `${API_BASE}/api/mesas`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numero, estabelecimentoId }) });
  },

  async closeMesa(mesaIdOrNumero: number | string, taxaPaga: boolean) {
    const url = `${API_BASE}/api/mesas/${mesaIdOrNumero}/fechar`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taxaPaga }) });
  },

  async updateItem(itemId: number, quantidade: number) {
    const url = `${API_BASE}/api/pedidos/itens/${itemId}`;
    return fetchJson(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantidade }) });
  },

  async deleteItem(itemId: number) {
    const url = `${API_BASE}/api/pedidos/itens/${itemId}`;
    return fetchJson(url, { method: 'DELETE' });
  },

  async updateOrderStatus(pedidoId: number, status: string) {
    const url = `${API_BASE}/api/pedidos/${pedidoId}/status`;
    return fetchJson(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
  },

  // --- Stats ---
  async getDailyStats(estabelecimentoId: number) {
    const url = `${API_BASE}/api/stats/daily?estabelecimentoId=${estabelecimentoId}`;
    return fetchJson(url);
  },
  async getStatsPeriod(estabelecimentoId: number, startIso: string, endIso: string) {
    const qs = new URLSearchParams({ estabelecimentoId: String(estabelecimentoId), start: startIso, end: endIso });
    const url = `${API_BASE}/api/stats/period?${qs.toString()}`;
    return fetchJson(url);
  },
  async getClosures() {
    const url = `${API_BASE}/api/stats/closures`;
    return fetchJson(url);
  },
  async closeDay(mesas?: any[]) {
    const url = `${API_BASE}/api/stats/close`;
    const body = mesas ? { mesas } : undefined;
    return fetchJson(url, { method: 'POST', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  },
  async getEstablishment() {
    const url = `${API_BASE}/api/estabelecimentos/me`;
    return fetchJson(url);
  },
  async updateEstablishment(data: { taxa_servico?: number; tema_fundo_geral?: string; tema_fundo_cartoes?: string; tema_cor_texto?: string; tema_cor_primaria?: string; tema_cor_destaque?: string }) {
    const url = `${API_BASE}/api/estabelecimentos/me`;
    return fetchJson(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  async createWaiter(nome: string, senha: string) {
    const url = `${API_BASE}/api/garcons`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, senha }) });
  },

  async updateWaiter(id: number, data: { nome?: string; senha?: string; ativo?: boolean }) {
    const url = `${API_BASE}/api/garcons/${id}`;
    return fetchJson(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  async deleteWaiter(id: number) {
    const url = `${API_BASE}/api/garcons/${id}`;
    return fetchJson(url, { method: 'DELETE' });
  },

  async sendOrder(estabelecimentoId: number, mesaNumero: string, itens: Array<{ produtoId: number; quantidade: number; observacoes?: string }>) {
    const url = `${API_BASE}/api/pedidos`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estabelecimentoId, mesaNumero, itens }) });
  },

  async requestBill(estabelecimentoId: number, mesaId: number) {
    const url = `${API_BASE}/api/mesas/${mesaId}/fechar`;
    return fetchJson(url, { method: 'POST' });
  }
  ,
  async callWaiter(estabelecimentoId: number, mesaIdOrNumero: number | string) {
    const url = `${API_BASE}/api/mesas/${mesaIdOrNumero}/chamar`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estabelecimentoId }) });
  }
  ,
  async createAvaliacao(data: { estrelas: number; comentario?: string; mesaId?: number | string; pedidoId?: number | string; estabelecimentoId?: number }) {
    const url = `${API_BASE}/api/avaliacoes`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  async getAvaliacoes(estabelecimentoId?: number) {
    const qs = estabelecimentoId ? `?estabelecimentoId=${estabelecimentoId}` : '';
    const url = `${API_BASE}/api/avaliacoes${qs}`;
    return fetchJson(url);
  }
};

