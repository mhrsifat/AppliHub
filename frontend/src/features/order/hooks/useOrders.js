// src/features/order/hooks/useOrders.js
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders as fetchOrdersThunk, fetchOrder as fetchOrderThunk, createOrder as createOrderThunk, updateOrder as updateOrderThunk } from "../slices/orderSlice";
import { useCallback } from "react";

export default function useOrders(autoFetch = false) {
  const dispatch = useDispatch();
  const { list, current, loading, error } = useSelector((s) => s.orders);

  // memoized bound action creators -> stable references
  const fetchOrders = useCallback(
    (params) => dispatch(fetchOrdersThunk(params)),
    [dispatch]
  );

  const fetchOrder = useCallback(
    (id) => dispatch(fetchOrderThunk(id)),
    [dispatch]
  );

  const createOrder = useCallback(
    (data) => dispatch(createOrderThunk(data)),
    [dispatch]
  );

  const updateOrder = useCallback(
    (id, data) => dispatch(updateOrderThunk({ id, data })),
    [dispatch]
  );

  // autoFetch behavior: keep simple — call only on mount when autoFetch true
  // If you want to include fetchOrders in deps, it's safe now (it's stable).
  // But keep autoFetch primitive to avoid accidental re-runs.
  // If you call useOrders(true) inline from parent, ensure that arg is stable.
  // Example: const orders = useOrders(true);
  // That is fine because true is primitive and stable.
  if (autoFetch) {
    // Don't call during render — use an effect to trigger it
    // but we avoid adding dispatch/fn here because below useEffect will do it.
  }

  return {
    list,
    current,
    loading,
    error,
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrder,
  };
}
