import axios from 'axios';
import { Driver, Position, WeatherData, TeamRadio, CarTelemetry, Session, LapData } from '../types/f1-types';

const BASE_URL = 'https://api.openf1.org/v1';

export class F1Service {
  static async getCurrentSession(): Promise<Session> {
    try {
      const response = await axios.get(`${BASE_URL}/sessions?year=2024`, {
        headers: {
          'Origin': 'http://localhost:3002'
        }
      });
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error('No session data available');
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  static async getDrivers(sessionKey: number): Promise<Driver[]> {
    const response = await axios.get(`${BASE_URL}/drivers?session_key=${sessionKey}`, {
      headers: {
        'Origin': 'http://localhost:3002'
      }
    });
    return response.data;
  }

  static async getCurrentPositions(sessionKey: number): Promise<Position[]> {
    const response = await axios.get(`${BASE_URL}/position?session_key=${sessionKey}`, {
      headers: {
        'Origin': 'http://localhost:3002'
      }
    });
    return response.data;
  }

  static async getWeather(sessionKey: number): Promise<WeatherData[]> {
    const response = await axios.get(`${BASE_URL}/weather?session_key=${sessionKey}`, {
      headers: {
        'Origin': 'http://localhost:3002'
      }
    });
    return response.data;
  }

  static async getTeamRadio(sessionKey: number): Promise<TeamRadio[]> {
    const response = await axios.get(`${BASE_URL}/team_radio?session_key=${sessionKey}`, {
      headers: {
        'Origin': 'http://localhost:3002'
      }
    });
    return response.data;
  }

  static async getCarTelemetry(
    sessionKey: number,
    driverNumber: number,
    startTime: string,
    endTime: string
  ): Promise<CarTelemetry[]> {
    try {
      const url = `${BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&date>${startTime}&date<${endTime}`;

      console.log('Requesting car data:', {
        url,
        params: {
          session_key: sessionKey,
          driver_number: driverNumber,
          dateStart: startTime,
          dateEnd: endTime
        }
      });

      const response = await axios.get(url, {
        headers: {
          'Origin': 'http://localhost:3002'
        }
      });

      console.log('Car data response:', {
        status: response.status,
        dataPoints: response.data?.length || 0,
        firstPoint: response.data?.[0]?.date,
        lastPoint: response.data?.[response.data?.length - 1]?.date
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching car data:', error);
      throw error;
    }
  }

  static async getSessions(year: number): Promise<Session[]> {
    const response = await axios.get(`${BASE_URL}/sessions?year=${year}`, {
      headers: {
        'Origin': 'http://localhost:3002'
      }
    });
    return response.data;
  }

  static async getLapData(
    sessionKey: number,
    driverNumber: number
  ): Promise<LapData[]> {
    const response = await axios.get(
      `${BASE_URL}/laps?session_key=${sessionKey}&driver_number=${driverNumber}`,
      {
        headers: {
          'Origin': 'http://localhost:3002'
        }
      }
    );
    return response.data;
  }
} 