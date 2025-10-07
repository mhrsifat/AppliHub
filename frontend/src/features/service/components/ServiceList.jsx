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
  TableRow, TableContainer, Paper, Button, Pagination, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ServiceCard from './ServiceCard';

export default function ServiceList({ onEdit, onView }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.service);
  const { query, setQuery, debounced } = useServiceSearch('', 300);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    dispatch(fetchServices({ q: debounced, page, per_page: perPage }));
  }, [dispatch, debounced, page]);

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

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list?.data?.length ? list.data.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={() => onEdit?.(service)}
            onView={() => onView?.(service)}
            onDelete={() => dispatch(deleteService(service.id))}
          />
        )) : !loading && <Box>No services found.</Box>}
      </Box>

      <Box mt={4}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>VAT</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list?.data?.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.title}</TableCell>
                  <TableCell>{s.sku}</TableCell>
                  <TableCell>{s.price}</TableCell>
                  <TableCell>{s.vat_percent}%</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => onView?.(s)}><VisibilityIcon /></IconButton>
                    <IconButton size="small" onClick={() => onEdit?.(s)}><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => dispatch(deleteService(s.id))}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          count={Math.ceil((list?.meta?.total || (list?.data?.length || 0)) / perPage)}
          page={page}
          onChange={(e, v) => setPage(v)}
        />
      </Box>
    </Box>
  );
}
