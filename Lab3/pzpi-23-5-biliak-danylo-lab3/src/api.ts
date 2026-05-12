import axios from 'axios';
import type { Sensor, SensorReading, LocalForecast } from './types';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getSensors = async (): Promise<Sensor[]> => {
  const response = await api.get('/admin/sensors');
  return response.data;
};

export const registerSensor = async (name: string, location: string): Promise<Sensor> => {
  const response = await api.post('/sensors', { name, location });
  return response.data;
};

export const getSensorReadings = async (id: string): Promise<SensorReading[]> => {
  const response = await api.get(`/admin/sensors/${id}/readings`);
  return response.data;
};

export const getLocalForecast = async (sensorId: string, hoursAhead: number = 1): Promise<LocalForecast> => {
  const response = await api.get(`/local-forecasts/${sensorId}`, {
    params: { hours_ahead: hoursAhead },
  });
  return response.data;
};

export const deleteSensor = async (id: string): Promise<void> => {
  await api.delete(`/admin/sensors/${id}`);
};

export const findSensorsByLocation = async (locationName: string): Promise<Sensor[]> => {
  const response = await api.get(`/locations/${locationName}`);
  return response.data;
};

// IoT Simulator helpers (for manual data input)
export const postReading = async (apiKey: string, temperature: number, humidity: number, pressure: number) => {
  return await api.post('/readings', { temperature, humidity, pressure }, {
    headers: { 'x-api-key': apiKey }
  });
};

export const postLocation = async (apiKey: string, cityName: string, country?: string, lat?: number, lon?: number) => {
  return await api.post('/sensor_locations', { city_name: cityName, country, lat, lon }, {
    headers: { 'x-api-key': apiKey }
  });
};

export default api;
