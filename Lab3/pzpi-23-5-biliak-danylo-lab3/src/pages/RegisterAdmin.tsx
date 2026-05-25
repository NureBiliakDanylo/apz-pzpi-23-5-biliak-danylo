import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const RegisterAdmin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { checkRegistration, isRegistered } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRegistered) {
      navigate('/login');
    }
  }, [isRegistered, navigate]);

  if (isRegistered) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('http://localhost:8080/auth/register', { username, password, role: 'admin' });
      await checkRegistration();
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '450px', margin: '3rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)', marginBottom: '1.25rem' }}>
          <UserPlus size={40} color="var(--primary)" />
        </div>
        <h2>Register Admin</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Create the first administrator account to get started.</p>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter admin username" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a strong password" required />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create Admin Account</button>
      </form>
    </div>
  );
};

export default RegisterAdmin;
