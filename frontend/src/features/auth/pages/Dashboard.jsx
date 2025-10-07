// src/features/auth/pages/Dashboard.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../slices/authSlice';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = async () => {
    try {
      // call backend to clear refresh cookie
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Error logging out', err);
    }

    // clear redux state
    dispatch(clearUser());

    // redirect
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dashboard</h2>
      <p>Welcome, {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
