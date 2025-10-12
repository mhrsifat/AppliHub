// src/features/client/pages/TrackOrder.jsx
import React, { useState, useEffect, lazy } from "react";
import api from "@/services/api";

const API_BASE = import.meta.env.VITE_API_BASE;

const Navbar = lazy(() => import("@/features/client/components/Navbar"));
const Footer = lazy(() => import("@/features/client/components/Footer"));

/**
 * Anonymous Track Order page
 *
 * - Enter order number / invoice number / email / phone
 * - Shows order details, invoices, totals (total payable, paid, due)
 * - Each invoice: PDF download link + Pay button (if unpaid)
 *
 * Requirements:
 * - Backend public route: GET /api/public/track-order?q=...
 *   (see provided backend snippet)
 * - Payment initiation endpoint: POST /api/payments/initiate
 *   NOTE: If initiate endpoint requires auth in your backend, either:
 *     - make a public variant for invoice-payments, or
 *     - add a pay-token to the invoice and send it in the initiate request.
 */

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // payment modal state
  const [payInvoice, setPayInvoice] = useState(null);
  const [payGateway, setPayGateway] = useState("sslcommerz");
  const [processingPay, setProcessingPay] = useState(false);

  const search = async (e) => {
    if (e) e.preventDefault();
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

  // If page was opened with ?q=...&payment=success|failed, auto-run search and show notice
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const payment = params.get("payment");
      if (payment) {
        if (payment === "success")
          setNotice("Payment successful. Updated information shown below.");
        else if (payment === "failed")
          setError("Payment failed. See details below.");
        else if (payment === "cancelled") setError("Payment was cancelled.");
      }

      if (q) {
        setQuery(q);
        // small delay to let state settle
        setTimeout(() => search(), 50);
      }
    } catch {
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

  // initiate payment (will open popup)
  const initiatePayment = async () => {
    if (!payInvoice) return;
    setProcessingPay(true);

    try {
      // If your backend requires auth for initiate, modify backend to allow public invoice payments,
      // or generate a secure pay token and use it here.
      const res = await api.post("/payments/initiate", {
        invoice_id: payInvoice.id,
        gateway: payGateway,
      });

      const checkoutUrl = res.data.checkout_url || res.data.data?.checkout_url;
      if (!checkoutUrl)
        throw new Error("No checkout URL returned from server.");

      const popup = window.open(checkoutUrl, "paywin", "width=900,height=700");

      // poll popup closed then re-fetch track data
      const poll = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(poll);
          // re-fetch latest track data to reflect payment
          await search();
          closePayModal();
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      // Prefer gateway failure reason when available
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
      // show a friendly message in the UI
      setError(message);
      alert(message);
      setProcessingPay(false);
    }
  };

  const downloadPdf = (invoice) => {
    // invoice pdf endpoint (public route added earlier)
    // build absolute URL to backend PDF endpoint (VITE_API_BASE already includes /api)
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
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              <div>
                {processingPay ? "Processing payment..." : "Searching..."}
              </div>
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
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading || processingPay}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {notice && <div className="text-green-600 mb-4">{notice}</div>}

        {!data && !loading && (
          <div className="text-sm text-gray-600">
            Enter your order number or invoice number to see status and payment
            options.
          </div>
        )}

        {data && (
          <div>
            {/* Order summary */}
            {data.order ? (
              <div className="mb-6 border rounded p-4 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm text-gray-500">Order</div>
                    <div className="text-lg font-medium">
                      {data.order.order_number || `#${data.order.id}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Status</div>
                    <div className="font-medium">
                      {data.order.payment_status || data.order.status}
                    </div>
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
                      {data.order.customer_email}{" "}
                      {data.order.customer_phone
                        ? ` / ${data.order.customer_phone}`
                        : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Created</div>
                    <div>
                      {new Date(data.order.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-sm text-gray-600">
                No order record attached to this invoice.
              </div>
            )}

            {/* Summary totals */}
            {data.summary && (
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow-sm text-center">
                  <div className="text-sm text-gray-500">Total Payable</div>
                  <div className="text-lg font-semibold">
                    {data.summary.total_payable.toFixed
                      ? data.summary.total_payable.toFixed(2)
                      : data.summary.total_payable}{" "}
                    BDT
                  </div>
                </div>
                <div className="p-4 bg-white rounded shadow-sm text-center">
                  <div className="text-sm text-gray-500">Total Paid</div>
                  <div className="text-lg font-semibold">
                    {data.summary.total_paid.toFixed
                      ? data.summary.total_paid.toFixed(2)
                      : data.summary.total_paid}{" "}
                    BDT
                  </div>
                </div>
                <div className="p-4 bg-white rounded shadow-sm text-center">
                  <div className="text-sm text-gray-500">Total Due</div>
                  <div className="text-lg font-semibold">
                    {data.summary.total_due.toFixed
                      ? data.summary.total_due.toFixed(2)
                      : data.summary.total_due}{" "}
                    BDT
                  </div>
                </div>
              </div>
            )}

            {/* Invoices list */}
            <div className="space-y-4">
              {data.invoices && data.invoices.length ? (
                data.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 bg-white border rounded shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500">Invoice</div>
                        <div className="text-lg font-medium">
                          {inv.invoice_number || `#${inv.id}`}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Created: {new Date(inv.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`inline-block px-3 py-1 rounded text-sm ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {inv.status}
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-gray-500">
                            Grand Total
                          </div>
                          <div className="font-semibold">
                            {Number(inv.grand_total).toFixed(2)} BDT
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => downloadPdf(inv)}
                        className="px-3 py-2 bg-gray-800 text-white rounded text-sm"
                      >
                        Download PDF
                      </button>

                      {inv.status !== "paid" &&
                      data.pay_options?.sslcommerz?.enabled ? (
                        <button
                          onClick={() => openPayModal(inv)}
                          className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                        >
                          Pay Now
                        </button>
                      ) : null}

                      {/* show quick breakdown */}
                      <div className="ml-auto text-sm text-gray-600">
                        Paid:{" "}
                        <strong>
                          {Number(
                            inv.paid_amount ??
                              (inv.payments
                                ? inv.payments.reduce(
                                    (s, p) =>
                                      s +
                                      (p.status === "completed"
                                        ? Number(p.amount)
                                        : 0),
                                    0
                                  )
                                : 0)
                          ).toFixed(2)}{" "}
                          BDT
                        </strong>
                        &nbsp;|&nbsp; Due:{" "}
                        <strong>
                          {(
                            Number(inv.grand_total) -
                            Number(
                              inv.paid_amount ??
                                (inv.payments
                                  ? inv.payments.reduce(
                                      (s, p) =>
                                        s +
                                        (p.status === "completed"
                                          ? Number(p.amount)
                                          : 0),
                                      0
                                    )
                                  : 0)
                            )
                          ).toFixed(2)}{" "}
                          BDT
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">
                  No invoices found for this order.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment modal */}
        {payInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Pay Invoice #{payInvoice.invoice_number || payInvoice.id}
                </h3>
                <button onClick={closePayModal} className="text-gray-500">
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                Amount:{" "}
                <strong>{Number(payInvoice.grand_total).toFixed(2)} BDT</strong>
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gateway"
                    checked={payGateway === "sslcommerz"}
                    onChange={() => setPayGateway("sslcommerz")}
                  />
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
                <button
                  onClick={closePayModal}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={initiatePayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  disabled={processingPay}
                >
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
