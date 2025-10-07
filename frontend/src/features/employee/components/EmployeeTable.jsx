// src/features/employee/components/EmployeeTable.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export default function EmployeeTable({ rows = [], onEdit, onDelete, onRestore, onForceDelete }) {
  return (
    <TableContainer component={Paper} className="bg-background">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-surface">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar src={r.avatar ?? undefined} alt={r.name} />
                  <div>
                    <Typography component="div" className="text-text font-medium">
                      {r.name}
                    </Typography>
                    <Typography variant="body2" className="text-muted-text text-sm">
                      {r.email}
                    </Typography>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-text">{r.email}</TableCell>
              <TableCell className="text-text">{r.phone || '—'}</TableCell>
              <TableCell className="text-text">{(r.roles || []).join(', ')}</TableCell>
              <TableCell>
                <span
                  className={
                    'px-2 py-1 rounded text-sm ' +
                    (r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700')
                  }
                >
                  {r.status}
                </span>
              </TableCell>

              <TableCell align="right">
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => onEdit(r)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                {!r.deleted_at ? (
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => onDelete(r)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <>
                    <Tooltip title="Restore">
                      <IconButton size="small" onClick={() => onRestore(r)}>
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Permanently">
                      <IconButton size="small" onClick={() => onForceDelete(r)}>
                        <DeleteForeverIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-text">
                No employees found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
