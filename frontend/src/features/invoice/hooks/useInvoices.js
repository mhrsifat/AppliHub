import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
} from "../slices/invoiceSlice";
import {
  selectAllInvoices,
  selectInvoiceMeta,
  selectInvoiceLoading,
  selectInvoiceError,
  selectCurrentInvoice,
} from "../slices/invoiceSlice";

export default function useInvoices({
  initialPage = 1,
  perPage = 15,
  initialOrderId = null,
} = {}) {
  const dispatch = useDispatch();

  // selectors (provide normalized / memoized access)
  const list = useSelector(selectAllInvoices, shallowEqual);
  const meta = useSelector(selectInvoiceMeta, shallowEqual);
  const loading = useSelector(selectInvoiceLoading, shallowEqual);
  const error = useSelector(selectInvoiceError, shallowEqual);
  const current = useSelector(selectCurrentInvoice, shallowEqual);

  const [page, setPage] = useState(initialPage);
  const [orderId, setOrderId] = useState(initialOrderId);
  const [localPerPage, setLocalPerPage] = useState(perPage);

  const load = useCallback(
    (opts = {}) => {
      const p = opts.page ?? page;
      const pp = opts.per_page ?? localPerPage;
      const oid = opts.order_id ?? orderId;
      dispatch(fetchInvoices({ page: p, per_page: pp, order_id: oid }));
    },
    [dispatch, page, localPerPage, orderId]
  );

  // auto-load on mount and when page/perPage/orderId changes
  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(
    () => load({ page, per_page: localPerPage, order_id: orderId }),
    [load, page, localPerPage, orderId]
  );

  const getOne = useCallback((id) => dispatch(fetchInvoice(id)), [dispatch]);
  const create = useCallback(
    (payload) => dispatch(createInvoice(payload)),
    [dispatch]
  );
  const save = useCallback(
    (id, payload) => dispatch(updateInvoice({ id, payload })),
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
    orderId,
    setOrderId,
    perPage: localPerPage,
    setPerPage: setLocalPerPage,
    load,
    refresh,
    getOne,
    create,
    save,
  };
}
