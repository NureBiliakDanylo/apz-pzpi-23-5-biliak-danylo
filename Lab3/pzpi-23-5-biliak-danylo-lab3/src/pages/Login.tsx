import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isRegistered } = useAuth();
  const navigate = useNavigate();

  if (!isRegistered) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
        <h2>System Not Initialized</h2>
        <p>No administrator account found. Please register the first admin account.</p>
        <Link to="/register-admin" className="btn btn-primary">Register Admin</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/auth/login', { username, password });
      login(res.data.token);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }}>
          <Lock size={32} color="var(--primary)" />
        </div>
        <h2>Admin Login</h2>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Login</button>
      </form>
    </div>
  );
};

export default Login;
