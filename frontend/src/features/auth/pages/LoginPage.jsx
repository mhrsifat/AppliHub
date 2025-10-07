// src/features/client/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser, setEmployee, setAdmin } from "../slices/authSlice";
import api, { setAccessToken } from "../../../services/api";
import Navbar from "../../client/components/Navbar";
import Footer from "../../client/components/Footer";
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  CircularProgress,
} from "@mui/material";

export default function LoginPage() {
  const { user, admin, employee, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && (user || employee || admin)) {
      if (user) navigate("/");
      if (employee) navigate("/employee");
      if (admin) navigate("/admin");
    }
  }, [isAuthenticated, user, employee, admin, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post(
        "/auth/login",
        { email, password, remember: rememberMe },
        { withCredentials: true }
      );

      const user = res?.data?.user;
      const employee = res?.data?.employee;
      const admin = res?.data?.admin;
      const token = res?.data?.access_token ?? null;

      if (user) dispatch(setUser(user));
      if (employee) dispatch(setEmployee(employee));
      if (admin) dispatch(setAdmin(admin));
      if (token) setAccessToken(token);
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Box
        component="main"
        sx={{
          minHeight: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "var(--color-background)",
          color: "var(--color-text)",
          py: 6,
          mt: 6,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 400,
            width: "100%",
            p: 4,
            borderRadius: 3,
            bgcolor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        >
          <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
            Sign in
          </Typography>

          {error && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 1,
                bgcolor: "var(--color-error)",
                color: "#fff",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </Box>
          )}

          <form onSubmit={submit} noValidate>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
              sx={{
                input: { color: "var(--color-text)" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "var(--color-border)" },
                  "&:hover fieldset": { borderColor: "var(--color-primary)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--color-primary)" },
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
              sx={{
                input: { color: "var(--color-text)" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "var(--color-border)" },
                  "&:hover fieldset": { borderColor: "var(--color-primary)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--color-primary)" },
                },
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                my: 1,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: "var(--color-text)",
                      "&.Mui-checked": { color: "var(--color-primary)" },
                    }}
                  />
                }
                label="Remember me"
              />
              <Link href="/forgot" underline="hover" color="var(--color-primary)">
                Forgot?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                mt: 2,
                bgcolor: "var(--color-primary)",
                color: "#fff",
                "&:hover": { bgcolor: "var(--color-primary)" },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Sign in"}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" mt={3}>
            Don’t have an account?{" "}
            <Link href="/register" underline="hover" color="var(--color-primary)">
              Sign up
            </Link>
          </Typography>
        </Paper>
      </Box>
      <Footer />
    </>
  );
}
