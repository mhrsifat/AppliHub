// src/pages/admin/Employees.jsx
import React from 'react';
import EmployeeList from '../../features/employee/components/EmployeeList';
import { Box, Typography } from '@mui/material';

export default function Employees() {
  return (
    <Box className="min-h-screen bg-background text-text p-6">
      <Typography variant="h5" className="mb-4">Employees</Typography>
      <EmployeeList />
    </Box>
  );
}
