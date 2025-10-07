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

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false); // Desktop
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile drawer
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false); // Mobile dropdown
  const { darkMode, toggleDarkMode } = useDarkMode();

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Services", path: "/services", dropdown: true },
    { label: "Track Order", path: "/track" },
    { label: "About Us", path: "/about" },
  ];

  const handleMenuToggle = () => setDropdownOpen((prev) => !prev);
  const toggleDrawer = (open) => () => setMobileOpen(open);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-text)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={32}
            height={32}
            fill="var(--color-primary)"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 7l10-5v10l-10 5-10-5V4l10 5z" />
          </svg>
          <span style={{ fontWeight: "bold", fontSize: "18px" }}>AppliHub</span>
        </motion.div>

        {/* Desktop Menu */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            gap: 2,
            alignItems: "center",
          }}
        >
          {navLinks.map((link) =>
            link.dropdown ? (
              <Box key={link.label} sx={{ position: "relative" }}>
                <Button
                  onClick={handleMenuToggle}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{
                    textTransform: "none",
                    color: "var(--color-text)",
                    "&:hover": { color: "var(--color-primary)" },
                  }}
                >
                  {link.label}
                </Button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "8px",
                        width: "160px",
                        background: "var(--color-surface)",
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Box sx={{ py: 1 }}>
                        {["repair", "installation", "maintenance"].map(
                          (service) => (
                            <NavLink
                              key={service}
                              to={`/services/${service}`}
                              style={{
                                display: "block",
                                padding: "8px 16px",
                                fontSize: "14px",
                                color: "var(--color-text)",
                              }}
                              onClick={() => setDropdownOpen(false)}
                            >
                              {service.charAt(0).toUpperCase() +
                                service.slice(1)}
                            </NavLink>
                          )
                        )}
                      </Box>
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
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: isActive ? "600" : "400",
                  color: isActive
                    ? "var(--color-primary)"
                    : "var(--color-text)",
                  transition: "0.2s",
                })}
              >
                {link.label}
              </NavLink>
            )
          )}

          {/* Request Order Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              component={NavLink}
              to="/request"
              sx={{
                textTransform: "none",
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                borderRadius: "8px",
                px: 2,
                "&:hover": { opacity: 0.9 },
              }}
            >
              Request Order
            </Button>
          </motion.div>

          {/* Theme Toggle */}
          <IconButton onClick={toggleDarkMode} sx={{ ml: 1 }}>
            {darkMode ? (
              <LightModeIcon sx={{ color: "#facc15" }} />
            ) : (
              <DarkModeIcon sx={{ color: "var(--color-text)" }} />
            )}
          </IconButton>
        </Box>

        {/* Mobile Hamburger */}
        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
          <IconButton onClick={toggleDarkMode} sx={{ mr: 1 }}>
            {darkMode ? (
              <LightModeIcon sx={{ color: "#facc15" }} />
            ) : (
              <DarkModeIcon sx={{ color: "var(--color-text)" }} />
            )}
          </IconButton>
          <IconButton onClick={toggleDrawer(true)}>
            <MenuIcon sx={{ color: "var(--color-text)" }} />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={toggleDrawer(false)}>
        <List
          sx={{
            width: 260,
            height: "100%",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        >
          {navLinks.map((link) =>
            link.dropdown ? (
              <Box key={link.label}>
                <ListItem button onClick={() => setMobileDropdownOpen((p) => !p)}>
                  <ListItemText primary={link.label} />
                  <ArrowDropDownIcon
                    sx={{
                      transform: mobileDropdownOpen ? "rotate(180deg)" : "rotate(0)",
                      transition: "0.3s",
                    }}
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
                      {["repair", "installation", "maintenance"].map(
                        (service) => (
                          <ListItem
                            key={service}
                            button
                            component={NavLink}
                            to={`/services/${service}`}
                            onClick={toggleDrawer(false)}
                            sx={{ pl: 4 }}
                          >
                            <ListItemText
                              primary={
                                service.charAt(0).toUpperCase() + service.slice(1)
                              }
                            />
                          </ListItem>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            ) : (
              <ListItem
                key={link.label}
                button
                component={NavLink}
                to={link.path}
                onClick={toggleDrawer(false)}
              >
                <ListItemText primary={link.label} />
              </ListItem>
            )
          )}

          <ListItem
            button
            component={NavLink}
            to="/request"
            onClick={toggleDrawer(false)}
          >
            <ListItemText primary="Request Order" />
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
