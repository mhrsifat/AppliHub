// src/features/client/components/ContactForm.jsx
import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await new Promise((r) => setTimeout(r, 700)); // mock API
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <Box
      component="section"
      sx={{
        py: 12,
        px: { xs: 3, md: 6 },
        backgroundColor: "var(--color-background)",
        color: "var(--color-text)",
      }}
    >
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} mb={4}>
          Contact us
        </Typography>

        <form onSubmit={onSubmit}>
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={onChange}
            fullWidth
            variant="outlined"
            sx={{
              mb: 2,
              input: { color: "var(--color-text)" },
              label: { color: "var(--color-text)" },
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 1,
            }}
          />
          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={onChange}
            fullWidth
            variant="outlined"
            sx={{
              mb: 2,
              input: { color: "var(--color-text)" },
              label: { color: "var(--color-text)" },        
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 1,
            }}
          />
          <TextField
            label="Message"
            name="message"
            value={form.message}
            onChange={onChange}
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            sx={{
              mb: 2,
              input: { color: "var(--color-text)" }, // single line
              textarea: { color: "var(--color-text)" }, // multiline fix
              label: { color: "var(--color-text)" },
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 1,
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: "var(--color-primary)" }}
            >
              Send message
            </Button>

            {status === "sending" && (
              <Typography fontSize="0.875rem">Sending...</Typography>
            )}
            {status === "success" && (
              <Typography fontSize="0.875rem" color="var(--color-success)">
                Sent!
              </Typography>
            )}
            {status === "error" && (
              <Typography fontSize="0.875rem" color="var(--color-error)">
                Error, try again.
              </Typography>
            )}
          </Box>
        </form>
      </Box>
    </Box>
  );
}
