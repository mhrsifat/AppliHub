// src/features/employee/pages/EmployeesPage.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Pagination, CircularProgress } from '@mui/material';
import EmployeeToolbar from '../components/EmployeeToolbar';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeForm from '../components/EmployeeForm';
import useEmployees from '../hooks/useEmployees';

export default function EmployeesPage() {
  const {
    list,
    meta,
    loading,
    error,
    page,
    search,
    load,
    onSearch,
    onPage,
    onCreate,
    onUpdate,
    onDelete,
    onRestore,
    onForceDelete,
    setSelectedItem,
  } = useEmployees(1, 15);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rolesOptions] = useState(['admin', 'manager', 'staff']);

  useEffect(() => {
    load(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAdd() {
    setEditing(null);
    setOpenForm(true);
  }

  function handleEdit(item) {
    setEditing(item);
    setOpenForm(true);
  }

  async function handleSubmit(formData) {
    try {
      if (editing) {
        await onUpdate(editing.id, formData);
      } else {
        await onCreate(formData);
      }
      setOpenForm(false);
      load(meta.current_page || 1, search);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  return (
    <Box className="min-h-screen bg-background text-text p-6">
      <Container>
        <Typography variant="h5" className="mb-4">
          Employees
        </Typography>

        <EmployeeToolbar query={search} onQueryChange={(q) => onSearch(q)} onAdd={handleAdd} />

        {loading ? (
          <div className="flex justify-center py-12">
            <CircularProgress />
          </div>
        ) : (
          <>
            <EmployeeTable
              rows={list || []}
              onEdit={handleEdit}
              onDelete={(r) => {
                if (confirm('Delete employee?')) onDelete(r.id).then(() => load(meta.current_page || 1, search));
              }}
              onRestore={(r) => onRestore(r.id).then(() => load(meta.current_page || 1, search))}
              onForceDelete={(r) => {
                if (confirm('Permanently delete?')) onForceDelete(r.id).then(() => load(meta.current_page || 1, search));
              }}
            />

            <div className="flex justify-end mt-4">
              <Pagination
                count={meta.last_page || 1}
                page={meta.current_page || 1}
                onChange={(e, p) => {
                  onPage(p);
                  load(p, search);
                }}
                color="primary"
              />
            </div>
          </>
        )}

        <EmployeeForm open={openForm} onClose={() => setOpenForm(false)} onSubmit={handleSubmit} initial={editing} rolesOptions={rolesOptions} />
      </Container>
    </Box>
  );
}
