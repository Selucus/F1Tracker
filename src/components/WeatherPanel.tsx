import React, { useState, useEffect } from 'react';
import { WeatherData } from '../types/f1-types';
import { F1Service } from '../services/f1Service';

interface WeatherPanelProps {
  sessionKey: number;
  isLive: boolean;
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ sessionKey, isLive }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await F1Service.getWeather(sessionKey);
        if (data.length > 0) {
          setWeatherData(data[data.length - 1]); // Get most recent weather data
        }
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
      }
    };

    fetchWeather();
    
    // If live, update every minute
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(fetchWeather, 60000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionKey, isLive]);

  if (!weatherData) {
    return <div>Loading weather data...</div>;
  }

  return (
    <div className="weather-panel">
      <h2>Track Conditions</h2>
      <div className="weather-grid">
        <div className="weather-item">
          <label>Air Temperature</label>
          <span>{weatherData.air_temperature}°C</span>
        </div>
        <div className="weather-item">
          <label>Track Temperature</label>
          <span>{weatherData.track_temperature}°C</span>
        </div>
        <div className="weather-item">
          <label>Humidity</label>
          <span>{weatherData.humidity}%</span>
        </div>
        <div className="weather-item">
          <label>Wind Speed</label>
          <span>{weatherData.wind_speed} m/s</span>
        </div>
        <div className="weather-item">
          <label>Wind Direction</label>
          <span>{weatherData.wind_direction}°</span>
        </div>
        <div className="weather-item">
          <label>Rainfall</label>
          <span>{weatherData.rainfall ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel; 