// src/features/order/pages/OrderCreatePage.jsx
import React, { useMemo, useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Divider,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import useOrders from "../hooks/useOrders";
import { useNavigate } from "react-router-dom";

function emptyItem() {
  return { description: "", price: "", quantity: 1 };
}

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const { createOrder } = useOrders();

  // customer fields
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // dynamic items
  const [items, setItems] = useState([emptyItem()]);

  // UI/validation state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const price = parseFloat(it.price || 0);
      const qty = parseInt(it.quantity || 1, 10);
      if (isNaN(price) || isNaN(qty)) return sum;
      return sum + price * qty;
    }, 0);
  }, [items]);

  function updateItem(index, patch) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const err = {};
    if (!customer.name || !customer.name.trim())
      err.customer = "Customer name is required";
    const itemErrors = items.map((it) => {
      const e = {};
      if (!it.description || !it.description.trim()) e.description = "Required";
      const price = parseFloat(it.price);
      if (isNaN(price) || price <= 0) e.price = "Price must be > 0";
      const qty = parseInt(it.quantity, 10);
      if (isNaN(qty) || qty <= 0) e.quantity = "Qty must be > 0";
      return e;
    });
    if (itemErrors.some((e) => Object.keys(e).length > 0))
      err.items = itemErrors;
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        guest_name: customer.name,
        guest_phone: customer.phone,
        guest_address: customer.address,
        items: items.map((it) => ({
          description: it.description,
          price: Number(it.price),
          quantity: Number(it.quantity),
        })),
        subtotal,
      };

      const res = await createOrder(payload);
      // redux-toolkit async thunk returns an action with meta
      if (res && res.meta && res.meta.requestStatus === "fulfilled") {
        const orderId = res.payload?.id || res.payload; // try both shapes
        navigate(`${orderId}`);
      } else {
        // show basic feedback in console; more elaborate UI can be added
        console.error("Failed to create order", res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Paper className="p-6 bg-surface text-text space-y-4">
      <Typography variant="h6">Create Order</Typography>

      <Box sx={{ display: "grid", gap: 12 }}>
        <TextField
          label="Customer Name"
          fullWidth
          value={customer.name}
          onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
          error={!!errors.customer}
          helperText={errors.customer}
        />

        <TextField
          label="Phone"
          fullWidth
          value={customer.phone}
          onChange={(e) =>
            setCustomer((c) => ({ ...c, phone: e.target.value }))
          }
        />

        <TextField
          label="Address"
          fullWidth
          multiline
          minRows={2}
          value={customer.address}
          onChange={(e) =>
            setCustomer((c) => ({ ...c, address: e.target.value }))
          }
        />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Items
        </Typography>

        {items.map((it, idx) => (
          <Paper key={idx} variant="outlined" className="p-4 mb-3">
            <Box
              sx={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <TextField
                label="Description"
                value={it.description}
                onChange={(e) =>
                  updateItem(idx, { description: e.target.value })
                }
                error={
                  !!(
                    errors.items &&
                    errors.items[idx] &&
                    errors.items[idx].description
                  )
                }
                helperText={
                  errors.items &&
                  errors.items[idx] &&
                  errors.items[idx].description
                }
                sx={{ flex: 1, minWidth: 220 }}
              />

              <TextField
                label="Price"
                value={it.price}
                onChange={(e) => updateItem(idx, { price: e.target.value })}
                sx={{ width: 140 }}
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                error={
                  !!(
                    errors.items &&
                    errors.items[idx] &&
                    errors.items[idx].price
                  )
                }
                helperText={
                  errors.items && errors.items[idx] && errors.items[idx].price
                }
              />

              <TextField
                label="Qty"
                value={it.quantity}
                onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                sx={{ width: 100 }}
                type="number"
                inputProps={{ min: 1 }}
                error={
                  !!(
                    errors.items &&
                    errors.items[idx] &&
                    errors.items[idx].quantity
                  )
                }
                helperText={
                  errors.items &&
                  errors.items[idx] &&
                  errors.items[idx].quantity
                }
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ alignSelf: "center" }}>
                  Line:{" "}
                  {(
                    parseFloat(it.price || 0) *
                    (parseInt(it.quantity || 1, 10) || 1)
                  ).toFixed(2)}
                </Typography>
                {items.length > 1 && (
                  <Button color="error" onClick={() => removeItem(idx)}>
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        ))}

        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <Button onClick={addItem}>Add Item</Button>
        </Box>
      </Box>

      <Divider />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1">
          Subtotal: {subtotal.toFixed(2)}
        </Typography>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Order"}
        </Button>
      </Box>
    </Paper>
  );
}
