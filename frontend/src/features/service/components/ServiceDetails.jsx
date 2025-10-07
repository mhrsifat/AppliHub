// ServiceDetails.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchService, fetchPriceHistory } from '../slices/serviceSlice';
import { Box, Typography, Divider, Chip } from '@mui/material';
import PriceHistoryList from './PriceHistoryList';

export default function ServiceDetails({ id }) {
  const dispatch = useDispatch();
  const { item, priceHistory } = useSelector(s => s.service);

  useEffect(() => {
    if (id) {
      dispatch(fetchService(id));
      dispatch(fetchPriceHistory(id));
    }
  }, [dispatch, id]);

  if (!item) return <Box>Loading...</Box>;

  return (
    <Box>
      <Box className="flex items-center justify-between">
        <Typography variant="h5">{item.title}</Typography>
        <Chip label={item.is_active ? 'Active' : 'Inactive'} />
      </Box>

      <Typography variant="subtitle2" color="textSecondary">{item.sku} — {item.slug}</Typography>
      <Divider className="my-2" />

      <Typography variant="body1">{item.description}</Typography>

      <Box mt={2}>
        <Typography variant="subtitle2">Price</Typography>
        <Typography variant="h6">{item.price}</Typography>
      </Box>

      <Box mt={2}>
        <Typography variant="subtitle2">Price history</Typography>
        <PriceHistoryList histories={priceHistory} />
      </Box>
    </Box>
  );
}
