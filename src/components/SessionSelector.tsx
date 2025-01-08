import React, { useState, useEffect } from 'react';
import { Session } from '../types/f1-types';
import { F1Service } from '../services/f1Service';

interface SessionSelectorProps {
  currentSession: Session | null;
  onSessionChange: (session: Session) => void;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({ currentSession, onSessionChange }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsData = await F1Service.getSessions(selectedYear);
        setSessions(sessionsData.sort((a, b) => 
          new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
        ));
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    fetchSessions();
  }, [selectedYear]);

  return (
    <div className="session-selector">
      <select 
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
      >
        {[2024, 2023, 2022].map(year => (
          <option key={year} value={year}>
            {year} Season
          </option>
        ))}
      </select>
      <select
        value={currentSession?.session_key || ''}
        onChange={(e) => {
          const session = sessions.find(s => s.session_key === Number(e.target.value));
          if (session) {
            onSessionChange(session);
          }
        }}
      >
        {sessions.map(session => (
          <option key={session.session_key} value={session.session_key}>
            {session.country_name} - {session.session_type}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SessionSelector; 