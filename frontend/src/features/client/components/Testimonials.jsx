// src/features/client/components/Testimonials.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Avatar, Grid } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  { name: "Rana", text: "Great service, fixed my laptop in 2 days!", role: "Customer", image: "https://randomuser.me/api/portraits/men/1.jpg" },
  { name: "Mitu", text: "Transparent pricing and fast support.", role: "Customer", image: "https://randomuser.me/api/portraits/men/2.jpg" },
  { name: "Sabbir", text: "Technician arrived on time and solved the issue.", role: "Customer", image: "https://randomuser.me/api/portraits/men/3.jpg" },
  { name: "Nabila", text: "Friendly staff and quick service.", role: "Customer", image: "https://randomuser.me/api/portraits/women/4.jpg" },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 2) % items.length); // 2-slide at a time

  // Auto slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 2) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayed = [items[index], items[(index + 1) % items.length]]; // Two testimonials

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
      <Typography variant="h4" fontWeight={700} mb={6} textAlign="center">
        What clients say
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {displayed.map((item, i) => (
          <Grid item xs={12} md={5} key={i}>
            <AnimatePresence mode="wait">
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <Box
                  sx={{
                    p: 4, // smaller padding
                    backgroundColor: "var(--color-surface)",
                    borderRadius: 2,
                    boxShadow: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Avatar
                    src={item.image}
                    alt={item.name}
                    sx={{ width: 60, height: 60, mb: 1 }}
                  />

                  <Typography variant="body2" fontStyle="italic">
                    “{item.text}”
                  </Typography>

                  <Typography fontWeight={600}>{item.name}</Typography>
                  <Typography variant="caption" color="var(--color-muted-text)">
                    {item.role}
                  </Typography>
                </Box>
              </motion.div>
            </AnimatePresence>
          </Grid>
        ))}
      </Grid>

      {/* Navigation buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 4 }}>
        <IconButton
          onClick={prev}
          sx={{ "&:hover": { backgroundColor: "var(--color-primary)/0.1" } }}
        >
          ‹
        </IconButton>
        <IconButton
          onClick={next}
          sx={{ "&:hover": { backgroundColor: "var(--color-primary)/0.1" } }}
        >
          ›
        </IconButton>
      </Box>
    </Box>
  );
}
