// src/features/client/components/Footer.jsx
import React from "react";
import {
  Box,
  Grid,
  Typography,
  Link as MuiLink,
  List,
  ListItem,
  TextField,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  HomeModernIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

export default function Footer() {
  const serviceLinks = [
    { label: "AC Repair", href: "/services/ac-repair" },
    { label: "Refrigerator Repair", href: "/services/refrigerator" },
    { label: "Washing Machine Repair", href: "/services/washing-machine" },
    { label: "TV & LED Service", href: "/services/tv-repair" },
    { label: "Plumbing & Electrical", href: "/services/plumbing" },
  ];

  const companyLinks = [
    { label: "About AppliHub", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Join as Technician", href: "/partner" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund" },
    { label: "Contact Support", href: "/contact" },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "var(--color-background)",
        color: "var(--color-text)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 3, md: 2 } }}>
        <Grid container spacing={4}>
          {/* Section 1 - Company & Contact */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              AppliHub
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
              Fast, reliable home appliance repair — from AC and fridge to
              washing machine. Book trusted technicians, track jobs, and enjoy
              hassle-free service at your doorstep.
            </Typography>

            <List dense sx={{ p: 0, mb: 1 }}>
              <ListItem sx={{ py: 0.5 }}>
                <EnvelopeIcon className="w-5 h-5" style={{ marginRight: 10 }} />
                <MuiLink href="mailto:support@applihub.com" underline="hover" color="inherit">
                  support@applihub.com
                </MuiLink>
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <PhoneIcon className="w-5 h-5" style={{ marginRight: 10 }} />
                <MuiLink href="tel:+8801700000000" underline="hover" color="inherit">
                  +880 1700 000000
                </MuiLink>
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <MapPinIcon className="w-5 h-5" style={{ marginRight: 10 }} />
                <Typography component="span" variant="body2">
                  Dhaka, Bangladesh
                </Typography>
              </ListItem>
            </List>

            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <IconButton aria-label="facebook" size="large" href="https://facebook.com/applihub" component="a">
                <LinkIcon className="w-5 h-5" />
              </IconButton>
              <IconButton aria-label="instagram" size="large" href="https://instagram.com/applihub" component="a">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
              </IconButton>
              <IconButton aria-label="home" size="large" href="/" component="a">
                <HomeModernIcon className="w-5 h-5" />
              </IconButton>
            </Box>
          </Grid>

          {/* Section 2 - Services & Company */}
          <Grid item xs={12} sm={6} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Our Services
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {serviceLinks.map((l) => (
                    <ListItem key={l.href} sx={{ py: 0.5 }}>
                      <MuiLink href={l.href} underline="hover" color="inherit" sx={{ fontSize: 14 }}>
                        {l.label}
                      </MuiLink>
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Company
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {companyLinks.map((l) => (
                    <ListItem key={l.href} sx={{ py: 0.5 }}>
                      <MuiLink href={l.href} underline="hover" color="inherit" sx={{ fontSize: 14 }}>
                        {l.label}
                      </MuiLink>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Grid>

          {/* Section 3 - Newsletter & Support */}
          <Grid item xs={12} sm={12} md={4}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Stay Updated
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Get offers, maintenance tips, and service updates directly to your
              inbox.
            </Typography>

            <Box component="section" sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
              <TextField
                placeholder="Your email"
                variant="outlined"
                size="small"
                aria-label="newsletter email"
                sx={{ flex: 1 }}
              />
              <Button variant="contained" size="medium">Subscribe</Button>
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
              Support
            </Typography>

            <List dense sx={{ p: 0 }}>
              {supportLinks.map((l) => (
                <ListItem key={l.href} sx={{ py: 0.5 }}>
                  <MuiLink href={l.href} underline="hover" color="inherit">
                    {l.label}
                  </MuiLink>
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 3, display: "flex", gap: 2, alignItems: "center" }}>
              <ShieldCheckIcon className="w-5 h-5" />
              <Typography variant="caption">
                All services backed by verified technicians and warranty support.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="caption">
            © {new Date().getFullYear()} AppliHub. All rights reserved.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <MuiLink href="/privacy" underline="hover" color="inherit" sx={{ fontSize: 13 }}>
              Privacy
            </MuiLink>
            <MuiLink href="/terms" underline="hover" color="inherit" sx={{ fontSize: 13 }}>
              Terms
            </MuiLink>
            <MuiLink href="/sitemap" underline="hover" color="inherit" sx={{ fontSize: 13 }}>
              Sitemap
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}