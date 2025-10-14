// Filepath: src/features/order/hooks/useOrders.js
import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  assignOrder,
  unassignOrder,
} from "../slices/orderSlice";
import {
  selectAllOrders,
  selectOrderMeta,
  selectOrderLoading,
  selectOrderError,
  selectCurrentOrder,
} from "../slices/orderSlice";

export default function useOrders({ initialPage = 1, perPage = 15 } = {}) {
  const dispatch = useDispatch();

  const list = useSelector(selectAllOrders, shallowEqual);
  const meta = useSelector(selectOrderMeta, shallowEqual);
  const loading = useSelector(selectOrderLoading, shallowEqual);
  const error = useSelector(selectOrderError);
  const current = useSelector(selectCurrentOrder, shallowEqual);

  const [page, setPage] = useState(initialPage);
  const [q, setQ] = useState("");
  const [localPerPage, setLocalPerPage] = useState(perPage);

  const debounceRef = useRef(null);
  const debouncedFetch = useCallback(
    (term) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatch(fetchOrders({ page: 1, per_page: localPerPage, q: term }));
        setPage(1);
      }, 400);
    },
    [dispatch, localPerPage]
  );

  const load = useCallback(() => {
    dispatch(fetchOrders({ page, per_page: localPerPage, q }));
  }, [dispatch, page, localPerPage, q]);

  useEffect(() => {
    load();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [load]);

  const search = useCallback(
    (term) => {
      setQ(term);
      debouncedFetch(term);
    },
    [debouncedFetch]
  );

  const getOne = useCallback((id) => dispatch(fetchOrder(id)), [dispatch]);
  const create = useCallback(
    (payload) => dispatch(createOrder(payload)),
    [dispatch]
  );
  const save = useCallback(
    (id, payload) => dispatch(updateOrder({ id, payload })),
    [dispatch]
  );

  // assign an employee/user to an order
  // new signature: (orderId, employeeId, employeeType = 'employee')
  const assign = useCallback(
    (orderId, employeeId, employeeType = "employee") => {
      return dispatch(assignOrder({ orderId, employeeId, employeeType }));
    },
    [dispatch]
  );

  // unassign an order (no payload required)
  const unassign = useCallback(
    (orderId) => {
      return dispatch(unassignOrder(orderId));
    },
    [dispatch]
  );

  return {
    list,
    meta,
    loading,
    error,
    current,
    page,
    setPage,
    q,
    setQ,
    perPage: localPerPage,
    setPerPage: setLocalPerPage,
    load,
    search,
    getOne,
    create,
    save,
    assign,
    unassign,
  };
}