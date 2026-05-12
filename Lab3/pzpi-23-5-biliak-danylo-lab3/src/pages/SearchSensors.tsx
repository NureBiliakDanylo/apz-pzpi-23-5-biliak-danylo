import React, { useState } from 'react';
import { findSensorsByLocation } from '../api';
import type { Sensor } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, Search as SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SearchSensors: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await findSensorsByLocation(query);
      setResults(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setResults([]);
        setError(t('search.no_found'));
      } else {
        setError(t('search.error_search'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{t('search.title')}</h1>
      <div className="card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <input 
              type="text" 
              placeholder={t('search.placeholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SearchIcon size={18} /> {t('search.submit')}
          </button>
        </form>
      </div>

      {loading && <p>{t('search.searching')}</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {results.length > 0 && (
        <div className="sensor-grid" style={{ marginTop: '2rem' }}>
          {results.map(sensor => (
            <div key={sensor.id} className="card">
              <h3>{sensor.name}</h3>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
                <MapPin size={16} /> {sensor.location}
              </p>
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/sensor/${sensor.id}`} className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  {t('search.view_data')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSensors;
