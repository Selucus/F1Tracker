import React, { useState, useEffect } from 'react';
import { Session } from '../types/f1-types';
import { F1Service } from '../services/f1Service';
import RaceOrder from './RaceOrder';
import WeatherPanel from './WeatherPanel';
import TeamRadioPanel from './TeamRadioPanel';
import SessionSelector from './SessionSelector';

const Dashboard: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching current session...');
        const session = await F1Service.getCurrentSession();
        console.log('Received session:', session);
        
        if (!session) {
          throw new Error('No session data received');
        }
        
        setCurrentSession(session);
        setSelectedSession(session);
      } catch (error: any) {
        console.error('Dashboard initialization error:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const handleSessionChange = (session: Session) => {
    setSelectedSession(session);
    setIsLive(session.session_key === currentSession?.session_key);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading F1 Dashboard...</h2>
        <p>Connecting to F1 data services</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="dashboard-error">
        <h2>No Session Available</h2>
        <p>There is currently no active F1 session.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>F1 Live Dashboard</h1>
        <SessionSelector 
          currentSession={currentSession} 
          onSessionChange={handleSessionChange}
        />
      </header>
      
      <div className="dashboard-grid">
        <div className="grid-item">
          <RaceOrder 
            sessionKey={selectedSession.session_key} 
            isLive={isLive} 
          />
        </div>
        
        <div className="grid-item">
          <WeatherPanel 
            sessionKey={selectedSession.session_key} 
            isLive={isLive} 
          />
        </div>
        
        <div className="grid-item">
          <TeamRadioPanel 
            sessionKey={selectedSession.session_key} 
            isLive={isLive} 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 