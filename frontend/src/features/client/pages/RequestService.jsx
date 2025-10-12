// src/features/client/pages/RequestService.jsx
import React, { useState, lazy } from "react";
import { toast } from "react-toastify";
import clientServices from "../services/clientServices";
const Navbar = lazy(() => import("@/features/client/components/Navbar"));
const Footer = lazy(() => import("@/features/client/components/Footer"));

const RequestService = () => {
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        customer_name: customer.name || "Guest",
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        customer_address: customer.address || null,
        customer_note: customer.note || null,
        vat_percent: 0,
        coupon_discount: 0,
        items: [
          {
            service_id: 1,
            service_name: "Service chargr",
            service_description: "Standard service request",
            unit_price: 500,
            quantity: 1,
          },
        ],
      };

      const response = await clientServices.create(payload);
      toast.success("Order created successfully!");
      console.log("Order response:", response);
      // response expected shape: { order: {...}, invoice: {...} }
      setOrderResult(response.order ?? null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.message || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl shadow">
        {loading && (
          <div className="absolute inset-0 bg-black/30 z-50 flex items-center justify-center rounded-2xl">
            <div className="bg-white/90 p-4 rounded flex items-center gap-3">
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
              <div>Processing your request...</div>
            </div>
          </div>
        )}
        <h2 className="text-xl font-semibold mb-4 text-center">
          Request a Service
        </h2>
        {orderResult ? (
          <div className="p-4 bg-green-50 rounded border border-green-100">
            <h3 className="text-lg font-semibold mb-2">
              Thank you for ordering from us.
            </h3>
            <p className="mb-2">
              Your order has been received. Please note the order id for future
              reference.
            </p>
            <p className="font-mono bg-white p-2 rounded inline-block">
              Order #: {orderResult.order_number || orderResult.id}
            </p>
            {orderResult.invoice && (
              <p className="mt-2">
                Invoice:{" "}
                {orderResult.invoice?.invoice_number ?? orderResult.invoice}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => {
                  const text = orderResult.order_number || `${orderResult.id}`;
                  if (navigator && navigator.clipboard)
                    navigator.clipboard.writeText(text);
                  toast.info("Order id copied to clipboard");
                }}
              >
                Copy Order ID
              </button>
              <button
                type="button"
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded"
                onClick={() => {
                  setOrderResult(null);
                  setCustomer({
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    note: "",
                  });
                }}
              >
                Create another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              value={customer.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full border p-2 rounded"
              disabled={loading}
            />
            <input
              name="email"
              value={customer.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full border p-2 rounded"
              disabled={loading}
            />
            <input
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="w-full border p-2 rounded"
              disabled={loading}
            />
            <textarea
              name="address"
              value={customer.address}
              onChange={handleChange}
              placeholder="Address"
              className="w-full border p-2 rounded"
              disabled={loading}
            ></textarea>

            <textarea
              name="note"
              value={customer.note}
              onChange={handleChange}
              placeholder="tell us more about your request..."
              className="w-full border p-2 rounded"
              disabled={loading}
            ></textarea>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Processing..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </>
  );
};

export default RequestService;
