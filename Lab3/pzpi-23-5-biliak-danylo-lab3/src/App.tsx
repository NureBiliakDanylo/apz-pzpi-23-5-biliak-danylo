import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Cloud, LayoutDashboard, PlusCircle, Settings, Search, Globe, LogOut, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dashboard from './pages/Dashboard';
import RegisterSensor from './pages/RegisterSensor';
import SensorDetail from './pages/SensorDetail';
import Admin from './pages/Admin';
import SearchSensors from './pages/SearchSensors';
import Login from './pages/Login';
import RegisterAdmin from './pages/RegisterAdmin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UnitProvider, useUnit } from './context/UnitContext';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppContent() {
  const { t, i18n } = useTranslation();
  const { token, logout } = useAuth();

  // Determine current display language (fallback to EN if not supported)
  const currentLang = i18n.resolvedLanguage || 'en';
  const displayLang = currentLang.startsWith('uk') ? 'UK' : 'EN';

  const toggleLanguage = () => {
    const newLang = currentLang.startsWith('uk') ? 'en' : 'uk';
    i18n.changeLanguage(newLang);
  };

  const { unit, setUnit } = useUnit();

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-brand">
            <Cloud size={24} />
            <span>WeatherNet</span>
          </div>
          <div className="nav-links">
            <Link to="/" title={t('nav.dashboard')}><LayoutDashboard size={20} /></Link>
            <Link to="/register" title={t('nav.register')}><PlusCircle size={20} /></Link>
            <Link to="/search" title={t('nav.search')}><Search size={20} /></Link>
            <Link to="/admin" title={t('nav.admin')}><Settings size={20} /></Link>
            
            <div className="unit-switcher" style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
              {(['C', 'F', 'K'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  style={{
                    background: unit === u ? 'white' : 'transparent',
                    color: unit === u ? 'var(--primary)' : 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  °{u === 'K' ? 'K' : u}
                </button>
              ))}
            </div>

            <button 
              onClick={toggleLanguage} 
              className="lang-switcher" 
              title="Switch Language"
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Globe size={20} />
              <span style={{ marginLeft: '6px', fontSize: '0.85rem', fontWeight: '700' }}>
                {displayLang}
              </span>
            </button>

            {token ? (
              <button 
                onClick={logout} 
                title="Logout"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={20} />
              </button>
            ) : (
              <Link 
                to="/login" 
                title="Login"
                style={{ color: 'inherit', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogIn size={20} />
              </Link>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<RegisterSensor />} />
            <Route path="/sensor/:id" element={<SensorDetail />} />
            <Route path="/search" element={<SearchSensors />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-admin" element={<RegisterAdmin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <UnitProvider>
        <AppContent />
      </UnitProvider>
    </AuthProvider>
  );
}

export default App;
