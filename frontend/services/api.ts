
import { RegistrationState } from '../types';

const API_BASE = (process.env.API_URL || '').replace(/\/$/, '') || '';

export interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria?: string;
  descricao?: string;
}

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const api = {
  async registerRestaurant(data: RegistrationState): Promise<{ sucesso: boolean; estabelecimento?: any }> {
    const url = `${API_BASE}/api/estabelecimentos`;
    return fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  async getProducts(estabelecimentoId: number): Promise<Produto[]> {
    const query = new URLSearchParams({ estabelecimentoId: String(estabelecimentoId) });
    const url = `${API_BASE}/api/produtos?${query.toString()}`;
    return fetchJson(url);
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

