// ServicesPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ServiceList from "../components/ServiceList";
import { Box, Button, Container } from "@mui/material";

export default function ServicesPage() {
  const navigate = useNavigate();

  return (
    <Container>
      <Box className="flex items-center justify-between py-4">
        <h2>Services</h2>
        <Button variant="contained" onClick={() => navigate("create")}>
          Create Service
        </Button>
      </Box>

      <ServiceList
        onEdit={(s) => navigate(`${s.id}/edit`)}
        onView={(s) => navigate(`${s.id}`)}
      />
    </Container>
  );
}
