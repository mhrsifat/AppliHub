// src/features/service/pages/ServiceDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ServiceDetails from '../components/ServiceDetails';
import { fetchService, deleteService, clearItem } from '../slices/serviceSlice';
import {
  Container,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { item, loading } = useSelector((s) => s.service);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchService(id));
    return () => {
      dispatch(clearItem());
    };
  }, [dispatch, id]);

  async function handleDelete() {
    try {
      setDeleting(true);
      await dispatch(deleteService(id)).unwrap();
      setDeleting(false);
      setConfirmOpen(false);
      // after deletion, go back to list
      navigate('/services');
    } catch (err) {
      console.error('Delete failed', err);
      setDeleting(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/services')}
            variant="outlined"
            size="small"
          >
            Back
          </Button>

          <Typography variant="h4" component="h1">
            Service Details
          </Typography>
        </Box>

        <Box>
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            sx={{ mr: 1 }}
            onClick={() => navigate(`/services/${id}/edit`)}
            disabled={loading || !item}
          >
            Edit
          </Button>

          <Button
            startIcon={<DeleteIcon />}
            color="error"
            variant="outlined"
            onClick={() => setConfirmOpen(true)}
            disabled={loading || !item}
          >
            Delete
          </Button>
        </Box>
      </Stack>

      <Box>
        {loading && !item ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : item ? (
          <ServiceDetails id={id} />
        ) : (
          <Typography>No service found.</Typography>
        )}
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete service</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the service{' '}
            <strong>{item?.title ?? ''}</strong>? This will soft-delete the record and can be restored later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}