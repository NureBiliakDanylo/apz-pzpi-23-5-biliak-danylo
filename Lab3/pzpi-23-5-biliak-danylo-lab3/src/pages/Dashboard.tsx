import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSensors } from '../api';
import type { Sensor } from '../types';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUnit } from '../context/UnitContext';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { convertTemp } = useUnit();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSensors()
      .then(setSensors)
      .catch(err => {
        console.error(err);
        setError(t('common.error_load'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>{t('common.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>{t('dashboard.title')}</h1>
        <Link to="/register" className="btn btn-primary">{t('dashboard.add_sensor')}</Link>
      </div>

      {sensors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>{t('common.no_sensors')}</p>
          <Link to="/register" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>{t('dashboard.add_sensor')}</Link>
        </div>
      ) : (
        <div className="sensor-grid">
          {sensors.map(sensor => (
            <div key={sensor.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{sensor.name}</h3>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <MapPin size={16} /> {sensor.location}
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <Clock size={16} /> {t('common.last_seen')}: {sensor.last_seen_at ? new Date(sensor.last_seen_at).toLocaleString() : t('common.never')}
              </p>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${sensor.last_seen_at ? 'badge-success' : 'badge-gray'}`}>
                  {sensor.last_seen_at ? t('common.active') : t('common.inactive')}
                </span>
                <Link to={`/sensor/${sensor.id}`} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}>
                  {t('common.details')} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
