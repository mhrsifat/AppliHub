// ServiceCreatePage.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { createService } from '../slices/serviceSlice';
import ServiceForm from '../components/ServiceForm';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';

export default function ServiceCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(payload) {
    try {
      const res = await dispatch(createService(payload)).unwrap();
      navigate(`admin/services/${res.id}`);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Container>
      <h2>Create Service</h2>
      <ServiceForm onSubmit={handleSubmit} />
    </Container>
  );
}
