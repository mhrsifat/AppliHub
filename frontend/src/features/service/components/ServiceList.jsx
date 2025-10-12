// ServiceList.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchServices,
  deleteService
} from '../slices/serviceSlice';
import useServiceSearch from '../hooks/useServiceSearch';
import {
  Box, TextField, IconButton, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Paper, Button, Pagination, Stack,
  Dialog, DialogTitle, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Loader from '@/components/common/Loader';

export default function ServiceList({ onEdit, onView }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.service);
  const { query, setQuery, debounced } = useServiceSearch('', 300);
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const perPage = 12;

  useEffect(() => {
    dispatch(fetchServices({ q: debounced, page, per_page: perPage }));
  }, [dispatch, debounced, page]);

  const handleDeleteClick = (service) => {
    setSelectedService(service);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedService) {
      dispatch(deleteService(selectedService.id));
    }
    setConfirmOpen(false);
    setSelectedService(null);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Search services by title / SKU..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Button variant="contained" onClick={() => dispatch(fetchServices({}))}>Refresh</Button>
      </Stack>

      {loading && <Loader />}
      {!loading && (
        <Box mt={4}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Icon</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell align="right" sx={{ width: 100 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list?.data?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      {s.icon
                        ? <img src={s.icon} alt={s.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                        : <Box width={40} height={40} bgcolor="#eee" borderRadius={4} />}
                    </TableCell>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.description}</TableCell>
                    <TableCell>{s.is_active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>{s.slug}</TableCell>
                    <TableCell align="right" sx={{ width: 100, whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => onView?.(s)}><VisibilityIcon /></IconButton>
                      <IconButton size="small" onClick={() => onEdit?.(s)}><EditIcon /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(s)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          count={Math.ceil((list?.meta?.total || (list?.data?.length || 0)) / perPage)}
          page={page}
          onChange={(e, v) => setPage(v)}
        />
      </Box>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>
          Are you sure you want to delete <strong>{selectedService?.title}</strong>?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
