import React, { useEffect, useState } from 'react';
import { TextField, Button, Typography, Box, Avatar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import api, { setAccessToken } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function Register() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

    // Redirect if already logged in
    useEffect(() => {
      if (isAuthenticated && user) {
        navigate('/');
      }
    }, [isAuthenticated, user, navigate]);

  const validate = (values) => {
    const errs = {};
    if (!values.name.trim()) errs.name = 'Name is required';
    if (!values.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) errs.email = 'Enter a valid email';
    if (!values.password) errs.password = 'Password is required';
    else if (values.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (values.password_confirmation !== values.password) errs.password_confirmation = 'Passwords do not match';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const v = validate(form);
  setErrors(v);
  if (Object.keys(v).length) return;

  setSubmitting(true);
  try {
    const res = await api.post('/auth/register', form);
    setForm({ name: '', email: '', password: '', password_confirmation: '' });
    navigate('/');
    const user = res?.data?.user ?? null;
    const token = res?.data?.access_token ?? null;
    if (user) dispatch(setUser(user));
    if (token) setAccessToken(token);
  } catch (err) {
  if (err.response?.data?.errors) {
    const backendErrors = {};
    Object.keys(err.response.data.errors).forEach((key) => {
      backendErrors[key] = err.response.data.errors[key][0];
    });
    setErrors(backendErrors);
  } else {
    alert('Sorry, registration failed!');
  }
} finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Box
        component="form"
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white shadow-md rounded-lg p-6"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <div className="flex flex-col items-center">
          <Avatar className="mb-2 bg-blue-500">
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Create an account
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-1">
            Fill the form to get started
          </Typography>
        </div>

        <TextField label="Name" name="name" value={form.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} fullWidth />
        <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} fullWidth />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} fullWidth />
        <TextField label="Confirm Password" name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange} error={!!errors.password_confirmation} helperText={errors.password_confirmation} fullWidth />

        <Button type="submit" variant="contained" disabled={submitting} className="mt-2">
          {submitting ? 'Submitting...' : 'Register'}
        </Button>

        <Typography variant="caption" className="text-gray-500 mt-2">
          By registering you agree to our terms.
        </Typography>
      </Box>
    </div>
  );
}
