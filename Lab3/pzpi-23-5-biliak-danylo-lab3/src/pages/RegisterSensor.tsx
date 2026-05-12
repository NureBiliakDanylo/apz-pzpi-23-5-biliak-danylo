import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerSensor } from '../api';
import { useTranslation } from 'react-i18next';

const RegisterSensor: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sensor = await registerSensor(name, location);
      setApiKey(sensor.api_key || null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || t('register.error_fail'));
    } finally {
      setLoading(false);
    }
  };

  if (apiKey) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--success)', marginBottom: '1.5rem' }}>{t('register.success_title')}</h2>
        <p>{t('register.success_key')}</p>
        <div style={{ background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--primary-light)', fontFamily: 'monospace', margin: '1.5rem 0', wordBreak: 'break-all', fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)' }}>
          {apiKey}
        </div>
        <div className="error-message" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
          <strong>{t('register.success_important')}</strong>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%' }}>{t('register.go_to_dashboard')}</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h1>{t('register.title')}</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('register.name')}</label>
          <input 
            type="text" 
            placeholder={t('register.placeholder_name')} 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>{t('register.location')}</label>
          <input 
            type="text" 
            placeholder={t('register.placeholder_location')} 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
          {loading ? t('register.submitting') : t('register.submit')}
        </button>
      </form>
    </div>
  );
};

export default RegisterSensor;
