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
        {item.icon ? <img src={item.icon} alt={item.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} /> : <Box width={60} height={60} bgcolor="#eee" borderRadius={8} />}
        <Box> 
          <Typography variant="h5">{item.title}</Typography>

          <Typography variant="subtitle2" color="textSecondary">Service Slug: {item.slug}</Typography>
          </Box>
          <Chip label={item.is_active ? 'Active' : 'Inactive'} />
        </Box>
      <Divider sx={{ my: 2 }} />

      <Typography variant="body1">{item.description}</Typography>

      {/* <Box mt={2}>
        <Typography variant="subtitle2">Price</Typography>
        <Typography variant="h6">{item.price}</Typography>
      </Box>

      <Box mt={2}>
        <Typography variant="subtitle2">Price history</Typography>
        <PriceHistoryList histories={priceHistory} />
      </Box> */}
    </Box>
  );
}
