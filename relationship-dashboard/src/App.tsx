import React, { useState } from 'react';
import { Home, TrendingUp, Message, Speed } from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import TrendsPage from './components/TrendsPage';
import NotesPage from './components/NotesPage';
import { DARK_THEME } from './types/metrics';
import './index.css';

type Page = 'home' | 'trends' | 'notes';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'trends':
        return <TrendsPage />;
      case 'notes':
        return <NotesPage />;
      default:
        return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home, color: DARK_THEME.neon.cyan },
    { id: 'trends', label: 'Analytics', icon: TrendingUp, color: DARK_THEME.neon.green },
    { id: 'notes', label: 'Messages', icon: Message, color: DARK_THEME.neon.purple }
  ];

  return (
    <div className="h-screen text-white overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {/* Compact Navigation */}
      <nav className="flex-shrink-0">
        <div 
          className="border-b px-6 py-3 backdrop-blur-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderBottomColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-gray-800/50 rounded-xl p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                    }`}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                      border: `1px solid ${item.color}40`,
                      boxShadow: `0 0 15px ${item.color}30`
                    } : {}}
                  >
                    <Icon 
                      sx={{ 
                        fontSize: 18, 
                        color: isActive ? item.color : '#9ca3af',
                      }} 
                    />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-2">
              <Speed sx={{ fontSize: 14, color: DARK_THEME.neon.green }} />
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
