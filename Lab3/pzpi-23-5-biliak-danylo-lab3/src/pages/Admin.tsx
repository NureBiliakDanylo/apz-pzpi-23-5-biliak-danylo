import React, { useEffect, useState } from 'react';
import { getAdminSensors, deleteSensor, downloadDump, registerUser, getBackups, createBackup, restoreBackup, getUsers, deleteUser } from '../api';
import type { Sensor, Backup, User } from '../types';
import { Trash2, Shield, Key, Download, Database, Users, PlusCircle, RefreshCw, ChevronLeft, ChevronRight, UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const { role, currentUser } = useAuth();
  
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalSensors, setTotalSensors] = useState(0);
  const pageSize = 10;

  // New User Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState('junior_admin');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      if (role === 'admin' || role === 'junior_admin') {
        const { sensors: sensorData, total } = await getAdminSensors(pageSize, (page - 1) * pageSize);
        setSensors(sensorData);
        setTotalSensors(total);
      }
      if (role === 'admin' || role === 'db_admin') {
        const backupData = await getBackups();
        setBackups(backupData);
      }
      if (role === 'admin') {
        const userData = await getUsers();
        setUsers(userData);
      }
    } catch (err) {
      console.error(err);
      setError(t('admin.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [role, page]);

  const handleDeleteSensor = async (id: string, name: string) => {
    if (!window.confirm(t('admin.delete_confirm', { name }))) return;
    try {
      await deleteSensor(id);
      if (sensors.length === 1 && page > 1) {
          setPage(page - 1);
      } else {
          fetchInitialData();
      }
      alert(t('admin.delete_success'));
    } catch (err: any) {
      alert(t('admin.delete_fail') + ': ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(username, password, newRole);
      alert(t('admin.add_user_success'));
      setUsername('');
      setPassword('');
      if (role === 'admin') {
        const userData = await getUsers();
        setUsers(userData);
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(t('admin.delete_user_confirm', { defaultValue: `Are you sure you want to delete user ${name}?` }))) return;
    try {
      await deleteUser(id);
      const userData = await getUsers();
      setUsers(userData);
      alert(t('admin.delete_user_success', { defaultValue: 'User deleted successfully' }));
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup();
      alert(t('admin.backup_success'));
      const backupData = await getBackups();
      setBackups(backupData);
    } catch (err: any) {
      alert('Backup failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRestore = async (filename: string) => {
    if (!window.confirm(t('admin.restore_confirm'))) return;
    try {
      await restoreBackup(filename);
      alert(t('admin.restore_success'));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      const details = err.response?.data?.details || '';
      alert(`Restore failed: ${errorMsg}\n${details}`);
    }
  };

  const handleDownloadDump = async () => {
    try {
      await downloadDump();
    } catch (err: any) {
      alert('Failed to download dump: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>{t('common.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  const totalPages = Math.ceil(totalSensors / pageSize);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
          <Shield size={32} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{t('admin.title')}</h1>
          <span className="badge badge-primary">{t(`admin.role_${role === 'junior_admin' ? 'junior' : role === 'db_admin' ? 'db' : 'admin'}`)}</span>
        </div>
      </div>

      {/* SENSOR MANAGEMENT SECTION */}
      {(role === 'admin' || role === 'junior_admin') && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3><Shield size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {t('admin.manage_sensors')}</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.table.name')}</th>
                  <th>{t('admin.table.api_key')}</th>
                  <th style={{ textAlign: 'right' }}>{t('admin.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map(sensor => (
                  <tr key={sensor.id}>
                    <td><strong>{sensor.name}</strong></td>
                    <td><Key size={14} /> <code>{sensor.api_key}</code></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger" onClick={() => handleDeleteSensor(sensor.id, sensor.name)}>
                        <Trash2 size={16} /> {t('admin.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem' }}
              >
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                {t('common.page', { defaultValue: 'Page' })} {page} / {totalPages}
              </span>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ACCOUNT MANAGEMENT SECTION */}
      {role === 'admin' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3><Users size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {t('admin.manage_accounts')}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4>{t('admin.add_new_user', { defaultValue: 'Add New User' })}</h4>
              <form onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>{t('admin.username')}</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>{t('admin.password')}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>{t('admin.role')}</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} className="btn btn-secondary" style={{ width: '100%', textAlign: 'left' }}>
                    <option value="junior_admin">{t('admin.role_junior')}</option>
                    <option value="db_admin">{t('admin.role_db')}</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <PlusCircle size={18} /> {t('admin.add_user')}
                </button>
              </form>
            </div>

            <div>
              <h4>{t('admin.existing_users', { defaultValue: 'Existing Users' })}</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('admin.table.username', { defaultValue: 'Username' })}</th>
                      <th>{t('admin.table.role', { defaultValue: 'Role' })}</th>
                      <th style={{ textAlign: 'right' }}>{t('admin.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.username !== currentUser).map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.username}</strong></td>
                        <td><span className="badge badge-secondary">{u.role}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title={t('admin.delete_user', { defaultValue: 'Delete User' })}
                          >
                            <UserMinus size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DATABASE MANAGEMENT SECTION */}
      {(role === 'admin' || role === 'db_admin') && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3><Database size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {t('admin.manage_backups')}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={handleDownloadDump}>
                <Download size={18} /> {t('admin.download_dump')}
              </button>
              <button className="btn btn-primary" onClick={handleCreateBackup}>
                <RefreshCw size={18} /> {t('admin.create_backup')}
              </button>
            </div>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.backup_history')}</th>
                  <th>Size</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(backup => (
                  <tr key={backup.filename}>
                    <td>
                      <div><strong>{new Date(backup.createdAt).toLocaleString()}</strong></div>
                      <small style={{ color: 'var(--text-muted)' }}>{backup.filename}</small>
                    </td>
                    <td>{(backup.size / 1024).toFixed(2)} KB</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" onClick={() => handleRestore(backup.filename)}>
                        <RefreshCw size={16} /> {t('admin.restore')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
