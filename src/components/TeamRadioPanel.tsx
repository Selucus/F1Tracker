import React, { useState, useEffect } from 'react';
import { TeamRadio, Driver } from '../types/f1-types';
import { F1Service } from '../services/f1Service';

interface TeamRadioPanelProps {
  sessionKey: number;
  isLive: boolean;
}

interface EnhancedTeamRadio extends TeamRadio {
  driver_name?: string;
}

const TeamRadioPanel: React.FC<TeamRadioPanelProps> = ({ sessionKey, isLive }) => {
  const [teamRadios, setTeamRadios] = useState<EnhancedTeamRadio[]>([]);
  const [drivers, setDrivers] = useState<Map<number, Driver>>(new Map());
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      const driversData = await F1Service.getDrivers(sessionKey);
      const driversMap = new Map(
        driversData.map(driver => [driver.driver_number, driver])
      );
      setDrivers(driversMap);
    };

    fetchDrivers();
  }, [sessionKey]);

  useEffect(() => {
    const fetchTeamRadios = async () => {
      try {
        const data = await F1Service.getTeamRadio(sessionKey);
        const enhanced = data.map(radio => ({
          ...radio,
          driver_name: drivers.get(radio.driver_number)?.broadcast_name
        }));
        setTeamRadios(enhanced);
      } catch (error) {
        console.error('Failed to fetch team radios:', error);
      }
    };

    fetchTeamRadios();

    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(fetchTeamRadios, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionKey, isLive, drivers]);

  const handlePlay = (url: string) => {
    if (currentlyPlaying === url) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(url);
    }
  };

  return (
    <div className="team-radio-panel">
      <h2>Team Radio Messages</h2>
      <div className="radio-messages">
        {teamRadios.map((radio, index) => (
          <div key={index} className="radio-message">
            <div className="radio-info">
              <span className="driver-name">{radio.driver_name}</span>
              <span className="timestamp">
                {new Date(radio.date).toLocaleTimeString()}
              </span>
            </div>
            <button 
              className="play-button"
              onClick={() => handlePlay(radio.recording_url)}
            >
              {currentlyPlaying === radio.recording_url ? 'Stop' : 'Play'}
            </button>
            {currentlyPlaying === radio.recording_url && (
              <audio 
                src={radio.recording_url} 
                autoPlay 
                controls 
                onEnded={() => setCurrentlyPlaying(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamRadioPanel; 