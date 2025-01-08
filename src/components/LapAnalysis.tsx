import React, { useState, useEffect } from 'react';
import { Session, Driver, LapData, CarTelemetry } from '../types/f1-types';
import { F1Service } from '../services/f1Service';
import TelemetryChart from './TelemetryChart';

const LapAnalysis: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsData = await F1Service.getSessions(selectedYear);
        setSessions(sessionsData);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    fetchSessions();
  }, [selectedYear]);

  useEffect(() => {
    const fetchDrivers = async () => {
      if (!selectedSession) return;
      try {
        const driversData = await F1Service.getDrivers(selectedSession.session_key);
        setDrivers(driversData);
      } catch (error) {
        console.error('Failed to fetch drivers:', error);
      }
    };

    fetchDrivers();
  }, [selectedSession]);

  return (
    <div className="lap-analysis">
      <h1>Historical Session Analysis</h1>
      <div className="session-selection">
        <div className="control-group">
          <label>Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedSession(null);
              setSelectedDriver(null);
            }}
          >
            {[2024, 2023, 2022].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Session:</label>
          <select
            value={selectedSession?.session_key || ''}
            onChange={(e) => {
              const session = sessions.find(s => s.session_key === Number(e.target.value));
              setSelectedSession(session || null);
              setSelectedDriver(null);
            }}
          >
            <option value="">Select Session</option>
            {sessions.map(session => (
              <option key={session.session_key} value={session.session_key}>
                {session.country_name} - {session.session_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSession && (
        <div className="telemetry-section">
          <h2>Car Telemetry</h2>
          <div className="telemetry-controls">
            <div className="control-group">
              <label>Driver:</label>
              <select
                value={selectedDriver || ''}
                onChange={(e) => setSelectedDriver(Number(e.target.value))}
              >
                <option value="">Select Driver</option>
                {drivers.map(driver => (
                  <option key={driver.driver_number} value={driver.driver_number}>
                    {driver.broadcast_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedDriver && (
            <TelemetryChart 
              sessionKey={selectedSession.session_key}
              isLive={false}
              selectedDriver={selectedDriver}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LapAnalysis; 