// filepath: src/features/client/pages/RequestService.jsx
import React, { useState, lazy } from "react";
import { toast } from "react-toastify";
import clientServices from "../services/clientServices";
import { motion, AnimatePresence } from "framer-motion";

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
  const [copied, setCopied] = useState(false);

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
            service_name: "Service charge",
            service_description: "Standard service request",
            unit_price: 500,
            quantity: 1,
          },
        ],
      };

      const response = await clientServices.create(payload);
      toast.success("Order created successfully!");
      // expected response shape: { order: {...}, invoice: {...} } or similar
      setOrderResult(response.order ?? response.data ?? null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.info("Order id copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed", e);
      toast.error("Copy failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto my-12 p-6 bg-white rounded-2xl shadow-lg relative">
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/95 p-4 rounded flex items-center gap-3 shadow"
              >
                <svg
                  className="animate-spin h-6 w-6 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <div className="text-sm font-medium">Processing your request...</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-semibold mb-4 text-center"
        >
          Request a Service
        </motion.h2>

        <AnimatePresence>
          {orderResult ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4 bg-green-50 rounded border border-green-100"
            >
              <h3 className="text-lg font-semibold mb-2">Thank you for ordering from us.</h3>
              <p className="mb-2">Your order has been received. Please note the order id for future reference.</p>

              <div className="flex items-center gap-3">
                <div className="font-mono bg-white p-2 rounded inline-block text-sm">
                  {orderResult.order_number || orderResult.id || "—"}
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleCopy(orderResult.order_number || `${orderResult.id}`)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-2"
                  aria-label="Copy order id"
                >
                  {copied ? (
                    <span className="text-sm font-medium">Copied!</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-1h1a2 2 0 002-2V8a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H8z" />
                      </svg>
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
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

              {orderResult.invoice && (
                <div className="mt-3 text-sm">
                  <strong>Invoice:</strong> {orderResult.invoice?.invoice_number ?? orderResult.invoice}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <input
                name="name"
                value={customer.name}
                onChange={handleChange}
                placeholder="Your Name"
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
              <input
                name="email"
                value={customer.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
              <input
                name="phone"
                value={customer.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
              <textarea
                name="address"
                value={customer.address}
                onChange={handleChange}
                placeholder="Address"
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              ></textarea>

              <textarea
                name="note"
                value={customer.note}
                onChange={handleChange}
                placeholder="Tell us more about your request..."
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              ></textarea>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Processing..." : "Submit Request"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
};

export default RequestService;