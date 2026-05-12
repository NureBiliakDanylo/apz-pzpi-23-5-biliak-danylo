import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSensorReadings, getLocalForecast, getSensors, postReading, postLocation } from '../api';
import type { Sensor, SensorReading, LocalForecast } from '../types';
import { Thermometer, Droplets, Gauge, TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUnit } from '../context/UnitContext';

const SensorDetail: React.FC = () => {
  const { t } = useTranslation();
  const { convertTemp } = useUnit();
  const { id } = useParams<{ id: string }>();
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [forecast, setForecast] = useState<LocalForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoursAhead, setHoursAhead] = useState(1);

  // Simulation state
  const [showSim, setShowSim] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [simTemp, setSimTemp] = useState(20);
  const [simHum, setSimHum] = useState(50);
  const [simPress, setSimPress] = useState(1013);
  const [simCity, setSimCity] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [allSensors, sensorReadings] = await Promise.all([
        getSensors(),
        getSensorReadings(id)
      ]);
      
      const currentSensor = allSensors.find(s => s.id === id);
      setSensor(currentSensor || null);
      setReadings(sensorReadings.reverse()); // Newest first

      // Try to get forecast if there are readings
      if (sensorReadings.length >= 2) {
        const f = await getLocalForecast(id, hoursAhead);
        setForecast(f);
      }
    } catch (err) {
      console.error(err);
      setError(t('detail.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, t]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert(t('detail.simulator.key_required'));
      return;
    }
    try {
      await postReading(apiKey, simTemp, simHum, simPress);
      if (simCity) {
        await postLocation(apiKey, simCity);
      }
      alert(t('detail.simulator.success'));
      fetchData();
    } catch (err: any) {
      alert(t('detail.simulator.fail') + (err.response?.data?.error || err.message));
    }
  };

  const updateForecast = async () => {
    if (!id) return;
    try {
      const f = await getLocalForecast(id, hoursAhead);
      setForecast(f);
    } catch (err) {
      console.error(err);
      alert(t('detail.forecast.update_fail'));
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;
  if (error || !sensor) return <div className="error">{error || t('detail.sensor_not_found')}</div>;

  const latest = readings[0];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>{sensor.name}</h1>
        <button className="btn btn-secondary" onClick={() => setShowSim(!showSim)}>
          {showSim ? t('detail.hide_sim') : t('detail.show_sim')}
        </button>
      </div>

      {showSim && (
        <div className="card" style={{ border: '2px dashed var(--primary)', backgroundColor: 'var(--primary-light)' }}>
          <h3>{t('detail.simulator.title')}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('detail.simulator.description')}</p>
          <form onSubmit={handleSimulate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>{t('detail.simulator.api_key')}</label>
              <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={t('detail.simulator.api_key_placeholder')} required />
            </div>
            <div className="form-group">
              <label>{t('detail.simulator.temp')}</label>
              <input type="number" step="0.1" value={simTemp} onChange={e => setSimTemp(parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label>{t('detail.simulator.hum')}</label>
              <input type="number" step="0.1" value={simHum} onChange={e => setSimHum(parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label>{t('detail.simulator.press')}</label>
              <input type="number" step="0.1" value={simPress} onChange={e => setSimPress(parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label>{t('detail.simulator.city')}</label>
              <input type="text" value={simCity} onChange={e => setSimCity(e.target.value)} placeholder={t('detail.simulator.city_placeholder')} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>{t('detail.simulator.submit')}</button>
          </form>
        </div>
      )}

      <div className="sensor-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>{t('detail.latest.title')}</h3>
          </div>
          {latest ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              <div className="stat-card stat-temp">
                <Thermometer size={24} />
                <div className="stat-value">{convertTemp(latest.temperature)}</div>
                <div className="stat-label">{t('detail.latest.temp')}</div>
              </div>
              <div className="stat-card stat-hum">
                <Droplets size={24} />
                <div className="stat-value">{latest.humidity}%</div>
                <div className="stat-label">{t('detail.latest.hum')}</div>
              </div>
              <div className="stat-card stat-press" style={{ gridColumn: '1 / -1' }}>
                <Gauge size={24} />
                <div className="stat-value">{latest.pressure} hPa</div>
                <div className="stat-label">{t('detail.latest.press')}</div>
              </div>
            </div>
          ) : (
            <p>{t('detail.latest.no_readings')}</p>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>{t('detail.forecast.title')}</h3>
          </div>
          {readings.length < 2 ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start', color: 'var(--text-muted)' }}>
              <AlertCircle size={20} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('detail.forecast.need_more_data')}</p>
            </div>
          ) : (
            <div>
              <div className="form-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ margin: 0, whiteSpace: 'nowrap' }}>{t('detail.forecast.hours_ahead')}</label>
                <select value={hoursAhead} onChange={e => setHoursAhead(parseInt(e.target.value))} style={{ width: 'auto', flex: 1 }}>
                  {[1, 3, 6, 12, 24].map(h => <option key={h} value={h}>{h}{t('detail.forecast.hour_unit')}</option>)}
                </select>
                <button className="btn btn-primary" onClick={updateForecast} style={{ padding: '0.5rem 1rem' }}>{t('detail.forecast.update')}</button>
              </div>
              {forecast && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    {t('detail.forecast.prediction_for')} {new Date(forecast.forecast_time).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>{t('detail.forecast.temp')} <b>{convertTemp(forecast.predicted_temp)}</b></span>
                    <span>{t('detail.forecast.hum')} <b>{forecast.predicted_humidity.toFixed(1)}%</b></span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {t('detail.forecast.press')} <b>{forecast.predicted_pressure.toFixed(1)} hPa</b>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>{t('detail.history.title')}</h3>
        <div className="table-container" style={{ maxHeight: '400px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('detail.history.time')}</th>
                <th>{t('detail.history.temp')}</th>
                <th>{t('detail.history.hum')}</th>
                <th>{t('detail.history.press')}</th>
              </tr>
            </thead>
            <tbody>
              {readings.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{convertTemp(r.temperature)}</td>
                  <td style={{ fontWeight: 600 }}>{r.humidity}%</td>
                  <td style={{ fontWeight: 600 }}>{r.pressure} hPa</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SensorDetail;
