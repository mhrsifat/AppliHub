// src/features/order/hooks/useOrders.js
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, fetchOrder, createOrder, updateOrder } from "../slices/orderSlice";
import { useEffect } from "react";

export default function useOrders(autoFetch = false) {
  const dispatch = useDispatch();
  const { list, current, loading, error } = useSelector((s) => s.orders);

  useEffect(() => {
    if (autoFetch) dispatch(fetchOrders());
  }, [autoFetch, dispatch]);

  return {
    list,
    current,
    loading,
    error,
    fetchOrders: (params) => dispatch(fetchOrders(params)),
    fetchOrder: (id) => dispatch(fetchOrder(id)),
    createOrder: (data) => dispatch(createOrder(data)),
    updateOrder: (id, data) => dispatch(updateOrder({ id, data })),
  };
}
