import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        bgcolor: "var(--color-background)",
        color: "var(--color-text)",
        textAlign: "center",
      }}
    >
      <Typography variant="body2">
        © 2023 Your Company. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
