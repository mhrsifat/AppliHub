// filepath: src/features/client/pages/TrackOrder.jsx
import React, { useState, useEffect, lazy, useRef } from "react";
import api from "@/services/api";

const API_BASE = import.meta.env.VITE_API_BASE;

const Navbar = lazy(() => import("@/features/client/components/Navbar"));
const Footer = lazy(() => import("@/features/client/components/Footer"));

export default function TrackOrder() {
  const popupRef = useRef(null);
  const pollRef = useRef(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [payInvoice, setPayInvoice] = useState(null);
  const [payGateway, setPayGateway] = useState("sslcommerz");
  const [processingPay, setProcessingPay] = useState(false);

  const safeOrigin = typeof window !== "undefined" ? window.location.origin : "";

  // Helper: calculate paid amount for an invoice
  const calcPaid = (inv) => {
    const explicitPaid = inv.paid_amount ?? null;
    if (explicitPaid !== null && explicitPaid !== undefined) return Number(explicitPaid || 0);
    if (inv.payments && Array.isArray(inv.payments)) {
      return inv.payments.reduce((s, p) => s + (p.status === "completed" ? Number(p.amount || 0) : 0), 0);
    }
    return 0;
  };

  const calcDue = (inv) => {
    return Number(inv.grand_total || 0) - calcPaid(inv);
  };

  // fetch track data
  const search = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!query.trim()) {
      setError("Please enter order number, invoice number, email or phone.");
      return;
    }
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const res = await api.get("/public/track-order", {
        params: { q: query.trim() },
        headers: { Accept: "application/json" },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Not found or server error.");
    } finally {
      setLoading(false);
    }
  };

  const clearPopupAndPoll = () => {
    try {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (popupRef.current && !popupRef.current.closed) {
        try {
          popupRef.current.close();
        } catch (e) {
          // ignore cross-origin close errors
        }
      }
      popupRef.current = null;
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const messageHandler = (event) => {
      // validate origin for security
      try {
        if (event.origin !== safeOrigin) {
          // ignore messages from other origins
          return;
        }
      } catch (e) {
        // if safeOrigin not available, ignore check (rare)
      }

      if (event.data === "payment_completed") {
        clearPopupAndPoll();

        // If q param present, set it so search knows what to query
        try {
          const params = new URLSearchParams(window.location.search);
          const q = params.get("q");
          if (q) setQuery(q);
        } catch (e) {
          // ignore
        }

        // re-fetch
        search();
        setNotice("Payment successful. Updated information shown below.");
        setProcessingPay(false);
        setPayInvoice(null);
      }
    };

    window.addEventListener("message", messageHandler);

    // If this page is opened as popup after redirect (popup=1), notify opener and close self
    try {
      const params = new URLSearchParams(window.location.search);
      const isPopup = params.get("popup") === "1";
      const payment = params.get("payment");
      if (isPopup && (payment === "success" || payment === "failed" || payment === "cancelled")) {
        if (window.opener) {
          try {
            window.opener.postMessage("payment_completed", window.location.origin);
          } catch (e) {
            // fallback to wildcard if strict fails
            try {
              window.opener.postMessage("payment_completed", "*");
            } catch (err) {
              // ignore
            }
          }
        }
        // close this popup
        try {
          window.close();
        } catch (e) {
          // ignore if unable
        }
      }
    } catch (e) {
      // ignore
    }

    return () => {
      window.removeEventListener("message", messageHandler);
      clearPopupAndPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-run search if q param present (main tab flow)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const payment = params.get("payment");
      if (payment) {
        if (payment === "success") setNotice("Payment successful. Updated information shown below.");
        else if (payment === "failed") setError("Payment failed. See details below.");
        else if (payment === "cancelled") setError("Payment was cancelled.");
      }
      if (q) {
        setQuery(q);
        setTimeout(() => search(), 50);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPayModal = (invoice) => {
    setPayInvoice(invoice);
    setPayGateway("sslcommerz");
  };

  const closePayModal = () => {
    setPayInvoice(null);
    setProcessingPay(false);
  };

  const initiatePayment = async () => {
    if (!payInvoice) return;
    setProcessingPay(true);

    try {
      const res = await api.post("/payments/initiate", {
        invoice_id: payInvoice.id,
        gateway: payGateway,
      });

      const checkoutUrl = res.data.checkout_url || res.data.data?.checkout_url;
      if (!checkoutUrl) throw new Error("No checkout URL returned from server.");

      const popup = window.open(checkoutUrl, "paywin", "width=900,height=700");
      popupRef.current = popup;

      // fallback poll: if popup closed without messaging back, refresh
      pollRef.current = setInterval(async () => {
        try {
          if (!popupRef.current || popupRef.current.closed) {
            clearPopupAndPoll();
            await search();
            setProcessingPay(false);
            setPayInvoice(null);
          }
        } catch (e) {
          // ignore
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      const backend = err.response?.data;
      const gatewayReason =
        backend?.gateway_response?.failedreason ||
        backend?.gateway_response?.failedReason ||
        backend?.failedreason;
      const message =
        backend?.message ||
        gatewayReason ||
        err.message ||
        "Payment initiation failed";
      setError(message);
      // eslint-disable-next-line no-alert
      alert(message);
      setProcessingPay(false);
    }
  };

  const downloadPdf = (invoice) => {
    const base = API_BASE?.replace(/\/$/, "") || "";
    const url = `${base}/invoices/${invoice.id}/pdf`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        {(loading || processingPay) && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white p-4 rounded shadow flex items-center gap-3">
              <svg
                className="animate-spin h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <div>{processingPay ? "Processing payment..." : "Searching..."}</div>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Track Order / Invoice</h2>

        <form onSubmit={search} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter order #, invoice #, email or phone"
            className="flex-1 border rounded px-3 py-2"
            disabled={loading || processingPay}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading || processingPay}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {notice && <div className="text-green-600 mb-4">{notice}</div>}

        {!data && !loading && <div className="text-sm text-gray-600">Enter your order number or invoice number to see status and payment options.</div>}

        {data && (
          <div>
            {data.order ? (
              <div className="mb-6 border rounded p-4 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm text-gray-500">Order</div>
                    <div className="text-lg font-medium">{data.order.order_number || `#${data.order.id}`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Status</div>
                    <div className="font-medium">{data.order.payment_status || data.order.status}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <div className="text-gray-500">Customer</div>
                    <div>{data.order.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Email / Phone</div>
                    <div>
                      {data.order.customer_email} {data.order.customer_phone ? ` / ${data.order.customer_phone}` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Created</div>
                    <div>{new Date(data.order.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-sm text-gray-600">No order record attached to this invoice.</div>
            )}

            {data.summary && (
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow-sm text-center">
                  <div className="text-sm text-gray-500">Total Payable</div>
                  <div className="text-lg font-semibold">
                    {data.summary.total_payable.toFixed ? data.summary.total_payable.toFixed(2) : data.summary.total_payable} BDT
                  </div>
                </div>
                <div className="p-4 bg-white rounded shadow-sm text-center">
                  <div className="text-sm text-gray-500">Total Paid</div>
                  <div className="text-lg font-semibold">
                    {data.summary.total_paid.toFixed ? data.summary.total_paid.toFixed(2) : data.summary.total_paid} BDT
                  </div>
                </div>
                <div className="p-4 bg-white rounded shadow-sm text-center">
                  <div className="text-sm text-gray-500">Total Due</div>
                  <div className="text-lg font-semibold">
                    {data.summary.total_due.toFixed ? data.summary.total_due.toFixed(2) : data.summary.total_due} BDT
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {data.invoices && data.invoices.length ? (
                data.invoices.map((inv) => (
                  <div key={inv.id} className="p-4 bg-white border rounded shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500">Invoice</div>
                        <div className="text-lg font-medium">{inv.invoice_number || `#${inv.id}`}</div>
                        <div className="text-sm text-gray-600 mt-1">Created: {new Date(inv.created_at).toLocaleString()}</div>
                      </div>

                      <div className="text-right">
                        <div className={`inline-block px-3 py-1 rounded text-sm ${inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {inv.status}
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-gray-500">Grand Total</div>
                          <div className="font-semibold">{Number(inv.grand_total).toFixed(2)} BDT</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => downloadPdf(inv)} className="px-3 py-2 bg-gray-800 text-white rounded text-sm">
                        Download PDF
                      </button>

                      {inv.status !== "paid" && data.pay_options?.sslcommerz?.enabled ? (
                        <button onClick={() => openPayModal(inv)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
                          Pay Now
                        </button>
                      ) : null}

                      <div className="ml-auto text-sm text-gray-600">
                        Paid:{" "}
                        <strong>
                          {calcPaid(inv).toFixed(2)} BDT
                        </strong>
                        &nbsp;|&nbsp; Due:{" "}
                        <strong>
                          {calcDue(inv).toFixed(2)} BDT
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">No invoices found for this order.</div>
              )}
            </div>
          </div>
        )}

        {payInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pay Invoice #{payInvoice.invoice_number || payInvoice.id}</h3>
                <button onClick={closePayModal} className="text-gray-500">✕</button>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                Amount: <strong>{Number(payInvoice.grand_total).toFixed(2)} BDT</strong>
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="radio" name="gateway" checked={payGateway === "sslcommerz"} onChange={() => setPayGateway("sslcommerz")} />
                  <span>SSLCommerz</span>
                </label>

                <label className="flex items-center gap-2 opacity-50">
                  <input type="radio" name="gateway" disabled />
                  <span>bKash (coming soon)</span>
                </label>

                <label className="flex items-center gap-2 opacity-50">
                  <input type="radio" name="gateway" disabled />
                  <span>Nagad (coming soon)</span>
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={closePayModal} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={initiatePayment} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={processingPay}>
                  {processingPay ? "Processing..." : "Proceed to Pay"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}