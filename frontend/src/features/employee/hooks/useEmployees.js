// src/features/employee/hooks/useEmployees.js
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  restoreEmployee,
  forceDeleteEmployee,
  addSalary,
  listSalaries,
  deleteSalary,
  setItem,
  clearError,
} from '../slices/employeeSlice';

export default function useEmployees(initialPage = 1, perPage = 15) {
  const dispatch = useDispatch();
  const { list, meta, loading, error, item } = useSelector((s) => s.employee || {});

  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState('');

  const load = useCallback(
    (p = 1, s = '') => {
      dispatch(fetchEmployees({ page: p, per_page: perPage, search: s }));
      setPage(p);
    },
    [dispatch, perPage]
  );

  useEffect(() => {
    load(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initial load only

  const onSearch = (q) => {
    setSearch(q);
    load(1, q);
  };

  const onPage = (p) => {
    load(p, search);
  };

  const onCreate = async (formData) => dispatch(createEmployee(formData)).unwrap();
  const onUpdate = async (id, formData) => dispatch(updateEmployee({ id, formData })).unwrap();
  const onDelete = async (id) => dispatch(deleteEmployee(id)).unwrap();
  const onRestore = async (id) => dispatch(restoreEmployee(id)).unwrap();
  const onForceDelete = async (id) => dispatch(forceDeleteEmployee(id)).unwrap();

  // Salary / Promotion
  const onAddSalary = async (id, payload) => dispatch(addSalary({ id, payload })).unwrap();
  const onListSalaries = async (id, params) => dispatch(listSalaries({ id, params })).unwrap();
  const onDeleteSalary = async (id, salaryId) => dispatch(deleteSalary({ id, salaryId })).unwrap();

  const setSelectedItem = (payload) => dispatch(setItem(payload));
  const clearErrors = () => dispatch(clearError());

  return {
    list,
    meta,
    loading,
    error,
    item,
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
    onAddSalary,
    onListSalaries,
    onDeleteSalary,
    setSelectedItem,
    clearErrors,
  };
}