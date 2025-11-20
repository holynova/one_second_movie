import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          One Second Movie
        </h1>
        <nav>
          <a href="#" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
        </nav>
      </header>
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  );
};
