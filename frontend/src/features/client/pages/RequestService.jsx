// src/features/client/pages/RequestService.jsx
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import clientServices from "../services/clientServices";
const Footer = lazy(() => import('../components/Footer'));

const RequestService = () => {
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
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
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.message || "Failed to create order."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Request a Service
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={customer.name}
          onChange={handleChange}
          placeholder="Your Name"
          className="w-full border p-2 rounded"
        />
        <input
          name="email"
          value={customer.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border p-2 rounded"
        />
        <input
          name="phone"
          value={customer.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full border p-2 rounded"
        />
        <textarea
          name="address"
          value={customer.address}
          onChange={handleChange}
          placeholder="Address"
          className="w-full border p-2 rounded"
        ></textarea>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Submit Request"}
        </button>
      </form>
    </div>
    <Footer />
    </>
  );
};

export default RequestService;