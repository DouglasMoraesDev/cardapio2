import React from 'react';
import { Header } from '../components/Header';
import { DevPortal } from '../components/DevPortal';

const DevPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      <Header onWaiterLoginClick={() => {}} onAdminLoginClick={() => {}} />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-4xl p-6">
          <DevPortal />
        </div>
      </main>
      <footer className="py-6 text-center text-slate-400 text-sm">&copy; {new Date().getFullYear()} GastroManager Pro.</footer>
    </div>
  );
};

export default DevPage;
