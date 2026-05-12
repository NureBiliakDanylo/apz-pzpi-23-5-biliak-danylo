import React, { useEffect, useState } from 'react';
import { getSensors } from '../api';
import type { Sensor } from '../types';
import { Trash2, Shield, Key, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      const data = await getSensors();
      setSensors(data);
    } catch (err) {
      console.error(err);
      setError(t('admin.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t('admin.delete_confirm', { name }))) {
      return;
    }

    try {
      // Use protected endpoint for deletion
      await axios.delete(`http://localhost:3000/admin/sensors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSensors(sensors.filter(s => s.id !== id));
      alert(t('admin.delete_success'));
    } catch (err: any) {
      console.error(err);
      alert(t('admin.delete_fail') + ': ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDownloadDump = async () => {
    try {
      const response = await axios.get('http://localhost:3000/admin/dump', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'weather_database_dump.sql');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error(err);
      alert('Failed to download dump: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>{t('common.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <Shield size={32} color="var(--primary)" />
          </div>
          <h1 style={{ margin: 0 }}>{t('admin.title')}</h1>
        </div>
        <button className="btn btn-secondary" onClick={handleDownloadDump}>
          <Download size={18} /> {t('admin.download_dump')}
        </button>
      </div>

      <div className="card">
        <h3>{t('admin.manage_sensors')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>{t('admin.description')}</p>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.table.name')}</th>
                <th>{t('admin.table.id')}</th>
                <th>{t('admin.table.api_key')}</th>
                <th>{t('admin.table.registered_at')}</th>
                <th style={{ textAlign: 'right' }}>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map(sensor => (
                <tr key={sensor.id}>
                  <td><strong style={{ color: 'var(--text-main)' }}>{sensor.name}</strong></td>
                  <td><code style={{ fontSize: '0.75rem', background: 'var(--bg-app)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>{sensor.id}</code></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Key size={14} /> <code>{sensor.api_key}</code>
                    </div>
                  </td>
                  <td>{new Date(sensor.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                      onClick={() => handleDelete(sensor.id, sensor.name)}
                    >
                      <Trash2 size={16} /> {t('admin.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
