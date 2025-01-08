import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import LapAnalysis from './components/LapAnalysis';

type Tab = 'dashboard' | 'analysis';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="app">
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Live Dashboard
        </button>
        <button 
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Lap Analysis
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'analysis' && <LapAnalysis />}
      </div>
    </div>
  );
};

export default App; 