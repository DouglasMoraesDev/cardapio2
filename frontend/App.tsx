import React, { useState } from 'react';
import { useEffect } from 'react';
import { RegistrationForm } from './components/RegistrationForm';
import { SuccessScreen } from './components/SuccessScreen';
import { Header } from './components/Header';
import { DevPortal } from './components/DevPortal';
import { WaiterLogin } from './components/WaiterLogin';
import { AdminLogin } from './components/AdminLogin';
import { TableManagement } from './components/TableManagement';
import { AdminDashboard } from './components/AdminDashboard';
import { MenuView } from './components/MenuView';
import { RegistrationState } from './types';

type View = 'register' | 'waiter-login' | 'admin-login' | 'success' | 'tables' | 'admin-dashboard' | 'menu';

const App: React.FC = () => {
  const [view, setView] = useState<View>('register');
  const [formData, setFormData] = useState<RegistrationState | null>(null);
  const [waiterName, setWaiterName] = useState('Douglas');
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [devView, setDevView] = useState<'dev-register'|'dev-login'|'dev-dashboard' | null>(null);

  const handleSubmitRegistration = (data: RegistrationState) => {
    setFormData(data);
    setTimeout(() => {
      setView('success');
    }, 1500);
  };

  const handleWaiterLogin = (data: { username: string }) => {
    setWaiterName(data.username || 'Douglas');
    setView('tables');
  };

  const handleAdminLogin = (data: any) => {
    setView('admin-dashboard');
  };

  const handleLogout = () => {
    setView('register');
  };

  const handleOpenTable = (tableNumber: string) => {
    setActiveTable(tableNumber);
    setView('menu');
  };

  // If opened with ?mesa= in URL, auto-open menu for that mesa
  useEffect(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      const mesa = qp.get('mesa');
      if (mesa) {
        setActiveTable(mesa);
        setView('menu');
      }
    } catch (e) { /* ignore */ }
    // open dev portal when path is /dev or /dev/login or /dev/register
    try {
      const path = window.location.pathname || '';
      if (path === '/dev' || path === '/dev/login') {
        setDevView('dev-login');
      } else if (path === '/dev/register') {
        setDevView('dev-register');
      }
    } catch (e) { /* ignore */ }
  }, []);

  const mainClass = view === 'menu' ? 'flex-grow flex items-stretch justify-center p-0' : 'flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      {view !== 'tables' && view !== 'admin-dashboard' && view !== 'menu' && (
        <Header 
          onWaiterLoginClick={() => setView('waiter-login')} 
          onAdminLoginClick={() => setView('admin-login')}
        />
      )}
      
      <main className={mainClass}>
        {view === 'register' && (
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-6 sm:p-10">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Novo Restaurante</h1>
                <p className="text-slate-500 mt-2 text-lg">Configure sua plataforma de gestão em poucos passos.</p>
              </div>
              
              <RegistrationForm onSubmit={handleSubmitRegistration} />
            </div>
          </div>
        )}

        {view === 'waiter-login' && (
          <WaiterLogin 
            onBack={() => setView('register')} 
            onLogin={handleWaiterLogin}
          />
        )}

        {view === 'admin-login' && (
          <AdminLogin 
            onBack={() => setView('register')} 
            onLogin={handleAdminLogin}
          />
        )}

        {view === 'tables' && (
          <TableManagement 
            waiterName={waiterName} 
            onLogout={handleLogout} 
            onOpenTable={handleOpenTable}
          />
        )}

        {view === 'admin-dashboard' && (
          <AdminDashboard onLogout={handleLogout} />
        )}

        {devView && (
          <div className="w-full flex justify-center">
            <DevPortal initialView={devView === 'dev-login' ? 'login' : (devView === 'dev-dashboard' ? 'dashboard' : 'register')} onBack={() => setDevView(null)} />
          </div>
        )}

        {/* If user visits /dev path directly, open DevPortal on login view */}

        {view === 'menu' && (
          <MenuView 
            onBack={() => setView('tables')} 
            waiterName={waiterName}
            tableNumber={activeTable || '0'}
          />
        )}

        {view === 'success' && (
          <SuccessScreen restaurantName={formData?.establishment.name || ''} />
        )}
      </main>

      {view !== 'menu' && (
        <footer className="py-6 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} GastroManager Pro. Todos os direitos reservados.
        </footer>
      )}
    </div>
  );
};

export default App;
