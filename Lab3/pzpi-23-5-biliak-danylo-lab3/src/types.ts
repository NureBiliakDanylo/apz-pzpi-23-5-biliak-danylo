export interface Sensor {
  id: string;
  name: string;
  location: string;
  api_key?: string;
  created_at: string;
  last_seen_at?: string | null;
  city_name?: string;
  country?: string;
}

export interface SensorReading {
  id: number;
  sensor_id: string;
  temperature: number;
  humidity: number;
  pressure: number;
  created_at: string;
}

export interface SensorLocation {
  sensor_id: string;
  city_name: string;
  country?: string;
  lat?: number;
  lon?: number;
  updated_at: string;
}

export interface LocalForecast {
  id: number;
  sensor_id: string;
  forecast_time: string;
  hours_ahead: number;
  predicted_temp: number;
  predicted_humidity: number;
  predicted_pressure: number;
  note: string;
}
