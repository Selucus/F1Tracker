export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string;
}

export interface Position {
  driver_number: number;
  position: number;
  date: string;
}

export interface WeatherData {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: number;
  date: string;
}

export interface TeamRadio {
  date: string;
  driver_number: number;
  recording_url: string;
}

export interface CarTelemetry {
  date: string;
  driver_number: number;
  speed: number;
  throttle: number;
  brake: number;
  rpm: number;
  drs: number;
  n_gear: number;
}

export interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  circuit_short_name: string;
  country_name: string;
}

export interface LapData {
  driver_number: number;
  lap_number: number;
  lap_duration: number;
  date_start: string;
  date_end: string;
  segment_1: string;
  segment_2: string;
  segment_3: string;
  is_pit_out_lap: boolean;
  is_pit_in_lap: boolean;
  is_valid: boolean;
}

export interface LapTelemetry {
  lap_number: number;
  lap_time: string;
  telemetry: CarTelemetry[];
} 