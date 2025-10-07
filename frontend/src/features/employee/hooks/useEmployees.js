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
  clearError,
  setItem,
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

  const onCreate = async (formData) => {
    return dispatch(createEmployee(formData)).unwrap();
  };

  const onUpdate = async (id, formData) => {
    return dispatch(updateEmployee({ id, formData })).unwrap();
  };

  const onDelete = async (id) => {
    return dispatch(deleteEmployee(id)).unwrap();
  };

  const onRestore = async (id) => {
    return dispatch(restoreEmployee(id)).unwrap();
  };

  const onForceDelete = async (id) => {
    return dispatch(forceDeleteEmployee(id)).unwrap();
  };

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
    setSelectedItem,
    clearErrors,
  };
}
