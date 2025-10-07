// ServiceEditPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchService, updateService } from '../slices/serviceSlice';
import ServiceForm from '../components/ServiceForm';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '@mui/material';

export default function ServiceEditPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { item } = useSelector(s => s.service);

  useEffect(() => {
    if (id) dispatch(fetchService(id));
  }, [dispatch, id]);

  async function handleSubmit(payload) {
    try {
      const res = await dispatch(updateService({ id, payload })).unwrap();
      navigate(`admin/services/${res.id}`);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Container>
      <h2>Edit Service</h2>
      <ServiceForm initialValues={item || {}} onSubmit={handleSubmit} />
    </Container>
  );
}
