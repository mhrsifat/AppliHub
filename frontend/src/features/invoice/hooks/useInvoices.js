import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, fetchInvoice, createInvoice, updateInvoice } from '../slices/invoiceSlice';

export default function useInvoices({ initialPage = 1, perPage = 15 } = {}) {
  const dispatch = useDispatch();
  const { list, meta, loading, error, current } = useSelector((s) => s.invoice || {});
  const [page, setPage] = useState(initialPage);
  const [orderId, setOrderId] = useState(null);

  const load = useCallback((params = {}) => {
    dispatch(fetchInvoices({ page: params.page ?? page, per_page: params.per_page ?? perPage, order_id: params.order_id ?? orderId }));
  }, [dispatch, page, perPage, orderId]);

  useEffect(() => { load(); }, [load]);

  const getOne = (id) => dispatch(fetchInvoice(id));
  const create = (payload) => dispatch(createInvoice(payload));
  const save = (id, payload) => dispatch(updateInvoice({ id, payload }));

  return { list, meta, loading, error, current, page, setPage, orderId, setOrderId, load, getOne, create, save };
}
