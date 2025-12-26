
import React, { useState } from 'react';
import { RegistrationState } from '../types';
import { api } from '../services/api';

interface Props {
  onSubmit: (data: RegistrationState) => void;
}

export const RegistrationForm: React.FC<Props> = ({ onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegistrationState>({
    establishment: {
      name: '',
      document: '',
      cep: '',
      address: '',
      serviceTax: 10,
      logoUrl: ''
    },
    admin: {
      username: '',
      password: ''
    }
  });

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    setFormData(prev => ({ ...prev, establishment: { ...prev.establishment, document: value.slice(0, 18) } }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
    setFormData(prev => ({ ...prev, establishment: { ...prev.establishment, cep: value.slice(0, 9) } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.registerRestaurant(formData);
      if (response && response.sucesso) {
        onSubmit(formData);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">1</div>
          <h2 className="text-xl font-semibold text-slate-800">Dados do Estabelecimento</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Restaurante</label>
            <input required type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.establishment.name} onChange={e => setFormData(prev => ({ ...prev, establishment: { ...prev.establishment, name: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CPF / CNPJ</label>
            <input required type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.establishment.document} onChange={handleDocumentChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
            <input required type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.establishment.cep} onChange={handleCEPChange} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
            <input required type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.establishment.address} onChange={e => setFormData(prev => ({ ...prev, establishment: { ...prev.establishment, address: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Taxa de Serviço (%)</label>
            <input required type="number" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.establishment.serviceTax} onChange={e => setFormData(prev => ({ ...prev, establishment: { ...prev.establishment, serviceTax: Number(e.target.value) } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL do Logo</label>
            <input required type="url" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.establishment.logoUrl} onChange={e => setFormData(prev => ({ ...prev, establishment: { ...prev.establishment, logoUrl: e.target.value } }))} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">2</div>
          <h2 className="text-xl font-semibold text-slate-800">Acesso Administrativo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário de Login</label>
            <input required type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.admin.username} onChange={e => setFormData(prev => ({ ...prev, admin: { ...prev.admin, username: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha do Painel</label>
            <input required type="password" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.admin.password} onChange={e => setFormData(prev => ({ ...prev, admin: { ...prev.admin, password: e.target.value } }))} />
          </div>
        </div>
      </section>

      <div className="pt-4">
        <button disabled={isLoading} type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-70">
          {isLoading ? 'Conectando ao servidor...' : 'Concluir e Abrir Estabelecimento'}
        </button>
      </div>
    </form>
  );
};
