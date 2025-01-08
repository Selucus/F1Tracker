import React, { useState, useEffect } from 'react';
import { Driver, Position } from '../types/f1-types';
import { F1Service } from '../services/f1Service';

interface RaceOrderProps {
  sessionKey: number;
  isLive: boolean;
}

interface DriverPosition extends Driver {
  position: number;
}

const RaceOrder: React.FC<RaceOrderProps> = ({ sessionKey, isLive }) => {
  const [positions, setPositions] = useState<DriverPosition[]>([]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const [driversData, positionsData] = await Promise.all([
          F1Service.getDrivers(sessionKey),
          F1Service.getCurrentPositions(sessionKey)
        ]);

        const combinedData = driversData.map(driver => {
          const position = positionsData.find(pos => pos.driver_number === driver.driver_number);
          return {
            ...driver,
            position: position?.position || 999
          };
        }).sort((a, b) => a.position - b.position);

        setPositions(combinedData);
      } catch (error) {
        console.error('Failed to fetch race order:', error);
      }
    };

    fetchPositions();

    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(fetchPositions, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionKey, isLive]);

  return (
    <div className="race-order">
      <h2>Race Order</h2>
      <div className="positions-list">
        {positions.map((driver) => (
          <div 
            key={driver.driver_number}
            className="position-item"
            style={{ borderLeft: `4px solid ${driver.team_colour}` }}
          >
            <span className="position">{driver.position}</span>
            <div className="driver-info">
              <span className="driver-name">{driver.broadcast_name}</span>
              <span className="team-name">{driver.team_name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaceOrder; 