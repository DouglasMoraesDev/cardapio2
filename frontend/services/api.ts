
import { RegistrationState, RestaurantData } from '../types';

// Aqui você configurará a URL do seu backend futuramente
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
}

export const api = {
  // Configuração Inicial
  async registerRestaurant(data: RegistrationState): Promise<{ success: boolean }> {
    console.log('Enviando para o backend:', data);
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));
    localStorage.setItem('restaurant_config', JSON.stringify(data));
    return { success: true };
  },

  // Cardápio
  async getProducts(): Promise<Product[]> {
    // Simulação de busca no banco de dados
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { id: 1, name: 'dark', price: 31.00, category: 'Cerveja', description: 'Cerveja artesanal dark de alta fermentação.' },
      { id: 2, name: 'Pilsen Gold', price: 18.00, category: 'Cerveja', description: 'Pilsen clássica e refrescante.' },
      { id: 3, name: 'IPA Explosive', price: 25.00, category: 'Cerveja', description: 'Amargor intenso e aroma cítrico.' }
    ];
  },

  // Pedidos
  async sendOrder(tableId: string, items: any[]): Promise<{ success: boolean }> {
    console.log(`Enviando pedido da mesa ${tableId} para a cozinha:`, items);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  },

  // Fechamento
  async requestBill(tableId: string): Promise<{ success: boolean }> {
    console.log(`Solicitando fechamento da mesa ${tableId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
};
