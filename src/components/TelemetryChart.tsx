import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CarTelemetry, Driver, LapData, LapTelemetry } from '../types/f1-types';
import { F1Service } from '../services/f1Service';

interface TelemetryChartProps {
  sessionKey: number;
  isLive: boolean;
  selectedDriver?: number;
}

const TelemetryChart: React.FC<TelemetryChartProps> = ({ sessionKey, isLive, selectedDriver }) => {
  const [telemetryData, setTelemetryData] = useState<CarTelemetry[]>([]);
  const [laps, setLaps] = useState<LapData[]>([]);
  const [selectedLap, setSelectedLap] = useState<number | null>(null);
  const [lapTelemetry, setLapTelemetry] = useState<Map<number, LapTelemetry>>(new Map());
  const [timeRange, setTimeRange] = useState<'last30' | 'last60' | 'last120'>('last30');
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const CHUNK_SIZE = 30; // 20 seconds per chunk
  const DELAY_BETWEEN_CHUNKS = 100; // 300ms delay between chunks

  useEffect(() => {
    const fetchLapData = async () => {
      if (!selectedDriver) return;
      try {
        const lapData = await F1Service.getLapData(sessionKey, selectedDriver);
        console.log('Raw lap data from API:', {
          first_lap: lapData[0],
          all_fields: lapData[0] ? Object.keys(lapData[0]) : [],
          total_laps: lapData.length
        });
        
        // Just sort the laps by number
        const sortedLaps = lapData.sort((a, b) => a.lap_number - b.lap_number);
        setLaps(sortedLaps);
      } catch (error) {
        console.error('Failed to fetch lap data:', error);
      }
    };

    if (!isLive) {
      fetchLapData();
    }
  }, [sessionKey, selectedDriver, isLive]);

  useEffect(() => {
    const fetchTelemetry = async () => {
      if (!selectedDriver || !selectedLap) return;

      try {
        const lap = laps.find(l => l.lap_number === selectedLap);
        if (!lap) return;

        setIsLoading(true);
        setTelemetryData([]);

        try {
          // Parse start date from the full ISO string
          const startDate = new Date(lap.date_start);
          let endDate: Date;

          if (lap.date_end) {
            endDate = new Date(lap.date_end);
          } else if (lap.date_start && lap.lap_duration) {
            // Create end date by adding duration milliseconds to start date
            endDate = new Date(startDate.getTime() + (lap.lap_duration * 1000));
            // Format end date to match start date format
            const endDateString = endDate.toISOString().replace('Z', '+00:00');
            endDate = new Date(endDateString);
          } else {
            console.error('Cannot determine lap time range:', lap);
            return;
          }

          console.log('Date range:', {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            duration: lap.lap_duration
          });

          const totalDuration = (endDate.getTime() - startDate.getTime()) / 1000;
          const numberOfChunks = Math.max(1, Math.ceil(totalDuration / CHUNK_SIZE));

          console.log('Starting telemetry load:', {
            lap: selectedLap,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalDuration,
            numberOfChunks
          });
          console.log('start', endDate) 

          let allData: CarTelemetry[] = [];
          let failedChunks = 0;

          for (let i = 0; i < numberOfChunks; i++) {
            try {
              const chunkStart = new Date(startDate.getTime() + (i * CHUNK_SIZE * 1000));
              const chunkEnd = new Date(Math.min(
                startDate.getTime() + ((i + 1) * CHUNK_SIZE * 1000),
                endDate.getTime()
              ));

              console.log(`Loading chunk ${i + 1}/${numberOfChunks}`);
              
              // Add delay before each request
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
              
              const data = await F1Service.getCarTelemetry(
                sessionKey,
                selectedDriver,
                chunkStart.toISOString(),
                chunkEnd.toISOString()
              );

              if (data && data.length > 0) {
                allData = [...allData, ...data];
                const sortedData = allData.sort((a, b) => 
                  new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                setTelemetryData(sortedData);
                console.log(`Chunk ${i + 1} loaded: ${data.length} points`);
              } else {
                console.log(`No data in chunk ${i + 1}`);
                failedChunks++;
              }
            } catch (error) {
              console.error(`Error loading chunk ${i + 1}:`, error);
              failedChunks++;
              // Add extra delay after an error
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS * 2));
            }

            setLoadProgress(Math.round(((i + 1) / numberOfChunks) * 100));
          }

          console.log('Load complete:', {
            totalPoints: allData.length,
            failedChunks,
            successRate: `${Math.round(((numberOfChunks - failedChunks) / numberOfChunks) * 100)}%`
          });

          if (allData.length > 0) {
            setLapTelemetry(prev => new Map(prev).set(selectedLap, {
              lap_number: selectedLap,
              lap_time: formatLapTime(lap.lap_duration),
              telemetry: allData
            }));
          }
        } catch (error) {
          console.error('Failed to fetch telemetry:', error);
          setTelemetryData([]);
        } finally {
          setIsLoading(false);
          setLoadProgress(0);
        }
      } catch (error) {
        console.error('Failed to fetch telemetry:', error);
        setTelemetryData([]);
      }
    };

    if (!isLive && selectedLap) {
      fetchTelemetry();
    }
  }, [sessionKey, selectedDriver, selectedLap, laps, isLive]);

  const formatLapTime = (time: number | string): string => {
    if (!time) return 'No time';
    
    if (typeof time === 'string') {
      return time;
    }

    // Convert seconds to mm:ss.SSS format
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const getTimeInSeconds = (range: 'last30' | 'last60' | 'last120'): number => {
    switch (range) {
      case 'last30': return 30;
      case 'last60': return 60;
      case 'last120': return 120;
      default: return 30;
    }
  };

  const formatDrsStatus = (value: number): string => {
    if (value === 1 || value === 10 || value === 12 || value === 14) {
      return 'DRS on';
    }
    return 'DRS off';
  };

  const transformedData = telemetryData.map(d => ({
    ...d,
    drs_status: (d.drs === 1 || d.drs === 10 || d.drs === 12 || d.drs === 14) ? 1 : 0
  }));

  return (
    <div className="telemetry-chart">
      <h2>Car Telemetry</h2>
      <div className="chart-controls">
        {isLive ? (
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'last30' | 'last60' | 'last120')}
          >
            <option value="last30">Last 30 seconds</option>
            <option value="last60">Last 1 minute</option>
            <option value="last120">Last 2 minutes</option>
          </select>
        ) : (
          <select
            value={selectedLap || ''}
            onChange={(e) => setSelectedLap(Number(e.target.value))}
          >
            <option value="">Select Lap</option>
            {laps.map(lap => (
              <option key={lap.lap_number} value={lap.lap_number}>
                Lap {lap.lap_number} - {formatLapTime(lap.lap_duration)}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedLap && !isLive && (
        <div className="lap-info">
          <span>Lap {selectedLap}</span>
          {lapTelemetry.get(selectedLap) && (
            <span>Time: {lapTelemetry.get(selectedLap)?.lap_time}</span>
          )}
        </div>
      )}

      <div className="telemetry-charts">
        {/* Speed Chart */}
        <div className="chart-container">
          <h3>Speed</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis domain={[0, 'auto']} />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                formatter={(value) => [`${value} km/h`, 'Speed']}
              />
              <Line type="monotone" dataKey="speed" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Throttle and Brake Chart */}
        <div className="chart-container">
          <h3>Throttle & Brake</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Line type="monotone" dataKey="throttle" stroke="#82ca9d" name="Throttle" dot={false} />
              <Line type="monotone" dataKey="brake" stroke="#ff7300" name="Brake" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RPM Chart */}
        <div className="chart-container">
          <h3>Engine RPM</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis domain={[0, 'auto']} />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                formatter={(value) => [`${value} RPM`, 'Engine']}
              />
              <Line type="monotone" dataKey="rpm" stroke="#e74c3c" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gear and DRS Chart */}
        <div className="chart-container">
          <h3>Gear & DRS</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis yAxisId="gear" domain={[0, 8]} />
              <YAxis yAxisId="drs" orientation="right" domain={[0, 1]} />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                formatter={(value, name) => {
                  if (name === 'DRS') {
                    return [formatDrsStatus(Number(value)), name];
                  }
                  return [value, name];
                }}
              />
              <Line 
                yAxisId="gear" 
                type="stepAfter" 
                dataKey="n_gear" 
                stroke="#3498db" 
                name="Gear" 
                dot={false} 
              />
              <Line 
                yAxisId="drs" 
                type="stepAfter" 
                dataKey="drs_status" 
                stroke="#2ecc71" 
                name="DRS"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {telemetryData.length === 0 && (
        <div className="no-data-message">
          No telemetry data available for this lap
        </div>
      )}

      {telemetryData.length > 0 && (
        <div className="data-info">
          <span>Data points: {telemetryData.length}</span>
          <span>Time range: {new Date(telemetryData[0].date).toLocaleTimeString()} - {new Date(telemetryData[telemetryData.length-1].date).toLocaleTimeString()}</span>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          Loading telemetry data: {loadProgress}%
        </div>
      )}
    </div>
  );
};

export default TelemetryChart; 