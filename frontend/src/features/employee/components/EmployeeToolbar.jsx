// src/features/employee/components/EmployeeToolbar.jsx
import React from 'react';
import { Box, Button, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function EmployeeToolbar({ query, onQueryChange, onAdd }) {
  return (
    <Box className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <TextField placeholder="Search employees..." size="small" value={query} onChange={(e) => onQueryChange(e.target.value)} />
      </div>

      <div>
        <Button startIcon={<AddIcon />} variant="contained" onClick={onAdd}>
          Add Employee
        </Button>
      </div>
    </Box>
  );
}
