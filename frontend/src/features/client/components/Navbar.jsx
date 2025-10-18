// src/features/client/components/Navbar.jsx
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useDarkMode from "../../../hooks/useDarkMode";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Services", path: "/request-service", dropdown: false },
    { label: "Track Order", path: "/track" },
    { label: "About Us", path: "/about" },
  ];

  const toggleDrawer = (open) => () => setMobileOpen(open);

  return (
    <AppBar position="fixed" elevation={0} sx={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <svg width={32} height={32} fill="var(--color-primary)" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 7l10-5v10l-10 5-10-5V4l10 5z" />
          </svg>
          <span style={{ fontWeight: 700 }}>AppliHub</span>
        </Box>

        {/* Desktop Links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, alignItems: "center" }}>
          {navLinks.map((link) =>
            link.dropdown ? (
              <Box key={link.label} sx={{ position: "relative" }}>
                <Button onClick={() => setDropdownOpen((p) => !p)} endIcon={<ArrowDropDownIcon />} sx={{ textTransform: "none" }}>
                  {link.label}
                </Button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: 8,
                        width: 160,
                        background: "var(--color-surface)",
                        borderRadius: 6,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        zIndex: 1200,
                      }}
                    >
                      <List>
                        {["repair", "installation", "maintenance"].map((service) => (
                          <ListItemButton
                            key={service}
                            component={NavLink}
                            to={`/services/${service}`}
                            onClick={() => setDropdownOpen(false)}
                            sx={{ px: 2 }}
                          >
                            <ListItemText primary={service.charAt(0).toUpperCase() + service.slice(1)} />
                          </ListItemButton>
                        ))}
                      </List>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            ) : (
              <NavLink
                key={link.label}
                to={link.path}
                style={({ isActive }) => ({
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-primary)" : "var(--color-text)",
                })}
              >
                {link.label}
              </NavLink>
            )
          )}

          <Button
            component={NavLink}
            to="/request-service"
            sx={{ textTransform: "none", backgroundColor: "var(--color-primary)", color: "#fff", borderRadius: 1, px: 2 }}
          >
            Request Order
          </Button>

          <IconButton onClick={toggleDarkMode} sx={{ ml: 1 }}>
            {darkMode ? <LightModeIcon sx={{ color: "#facc15" }} /> : <DarkModeIcon sx={{ color: "var(--color-text)" }} />}
          </IconButton>
        </Box>

        {/* Mobile Hamburger */}
        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
          <IconButton onClick={toggleDarkMode} sx={{ mr: 1 }}>
            {darkMode ? <LightModeIcon sx={{ color: "#facc15" }} /> : <DarkModeIcon sx={{ color: "var(--color-text)" }} />}
          </IconButton>
          <IconButton onClick={toggleDrawer(true)}>
            <MenuIcon sx={{ color: "var(--color-text)" }} />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={toggleDrawer(false)}>
        <List sx={{ width: 260, height: "100%", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
          {navLinks.map((link) =>
            link.dropdown ? (
              <Box key={link.label}>
                <ListItem button onClick={() => setMobileDropdownOpen((p) => !p)}>
                  <ListItemText primary={link.label} />
                  <ArrowDropDownIcon
                    sx={{ transform: mobileDropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "0.3s" }}
                  />
                </ListItem>
                <AnimatePresence>
                  {mobileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      {["repair", "installation", "maintenance"].map((service) => (
                        <ListItemButton
                          key={service}
                          component={NavLink}
                          to={`/services/${service}`}
                          onClick={toggleDrawer(false)}
                          sx={{ pl: 4 }}
                        >
                          <ListItemText primary={service.charAt(0).toUpperCase() + service.slice(1)} />
                        </ListItemButton>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            ) : (
              <ListItemButton key={link.label} component={NavLink} to={link.path} onClick={toggleDrawer(false)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            )
          )}

          <ListItemButton component={NavLink} to="/request" onClick={toggleDrawer(false)}>
            <ListItemText primary="Request Order" />
          </ListItemButton>
        </List>
      </Drawer>
    </AppBar>
  );
}
