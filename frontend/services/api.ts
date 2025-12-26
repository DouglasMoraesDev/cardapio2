
import { RegistrationState } from '../types';

const API_BASE = (process.env.API_URL || '').replace(/\/$/, '') || '';

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

export interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria?: string;
  descricao?: string;
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

  async getProducts(estabelecimentoId: number): Promise<Produto[]> {
    const query = new URLSearchParams({ estabelecimentoId: String(estabelecimentoId) });
    const url = `${API_BASE}/api/produtos?${query.toString()}`;
    return fetchJson(url);
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

  async sendOrder(estabelecimentoId: number, mesaNumero: string, itens: Array<{ produtoId: number; quantidade: number; observacoes?: string }>) {
    const url = `${API_BASE}/api/pedidos`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estabelecimentoId, mesaNumero, itens }) });
  },

  async requestBill(estabelecimentoId: number, mesaId: number) {
    const url = `${API_BASE}/api/mesas/${mesaId}/fechar`;
    return fetchJson(url, { method: 'POST' });
  }
};

