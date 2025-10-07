// ServiceCard.jsx
import React from 'react';
import { Card, CardContent, Typography, CardActions, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';

export default function ServiceCard({ service, onEdit, onView, onDelete }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="w-full">
      <Card variant="outlined" className="h-full flex flex-col">
        <CardContent className="flex-1">
          <div className="flex items-start justify-between">
            <Typography variant="h6">{service.title}</Typography>
            {service.is_active ? <Chip label="Active" size="small" /> : <Chip label="Inactive" size="small" />}
          </div>
          <Typography variant="body2" className="mt-2 line-clamp-3">
            {service.description}
          </Typography>

          <div className="mt-4">
            <Typography variant="subtitle2">Price</Typography>
            <Typography variant="h6">
              {Number(service.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption">VAT: {service.vat_percent}%</Typography>
          </div>
        </CardContent>

        <CardActions>
          <Button size="small" onClick={onView}>View</Button>
          <Button size="small" onClick={onEdit}>Edit</Button>
          <Button size="small" color="error" onClick={onDelete}>Delete</Button>
        </CardActions>
      </Card>
    </motion.div>
  );
}
