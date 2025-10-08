import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, fetchOrder, createOrder, updateOrder } from '../slices/orderSlice';

export default function useOrders({ initialPage = 1, perPage = 15 } = {}) {
  const dispatch = useDispatch();
  const { list, meta, loading, error, current } = useSelector((s) => s.order || {});
  const [page, setPage] = useState(initialPage);
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    dispatch(fetchOrders({ page, per_page: perPage, q }));
  }, [dispatch, page, perPage, q]);

  useEffect(() => { load(); }, [load]);

  const search = (term) => { setQ(term); setPage(1); dispatch(fetchOrders({ page: 1, per_page: perPage, q: term })); };
  const getOne = (id) => dispatch(fetchOrder(id));
  const create = (payload) => dispatch(createOrder(payload));
  const save = (id, payload) => dispatch(updateOrder({ id, payload }));

  return { list, meta, loading, error, current, page, setPage, q, setQ, load, search, getOne, create, save };
}
