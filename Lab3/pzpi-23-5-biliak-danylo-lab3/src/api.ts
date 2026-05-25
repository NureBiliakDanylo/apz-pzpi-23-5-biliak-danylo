import axios from 'axios';
import type { Sensor, SensorReading, LocalForecast, Backup, User } from './types';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getSensors = async (): Promise<Sensor[]> => {
  const response = await api.get('/sensors');
  return response.data;
};

export const getAdminSensors = async (limit: number = 10, offset: number = 0): Promise<{ sensors: Sensor[], total: number }> => {
  const response = await api.get('/admin/sensors', {
    params: { limit, offset }
  });
  return response.data;
};

export const registerSensor = async (name: string, location: string): Promise<Sensor> => {
  const response = await api.post('/sensors', { name, location });
  return response.data;
};

export const getSensorReadings = async (id: string): Promise<SensorReading[]> => {
  const response = await api.get(`/sensors/${id}/readings`);
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

// Admin User Management
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const registerUser = async (username: string, password: string, role: string) => {
  const response = await api.post('/admin/users', { username, password, role });
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

// Database Backups
export const getBackups = async (): Promise<Backup[]> => {
  const response = await api.get('/admin/backups');
  return response.data;
};

export const createBackup = async (): Promise<{ message: string; filename: string }> => {
  const response = await api.post('/admin/backups');
  return response.data;
};

export const restoreBackup = async (filename: string): Promise<{ message: string }> => {
  const response = await api.post('/admin/backups/restore', { filename });
  return response.data;
};

export const downloadDump = async () => {
    const response = await api.get('/admin/dump', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'weather_database_dump.sql');
    document.body.appendChild(link);
    link.click();
    link.remove();
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
