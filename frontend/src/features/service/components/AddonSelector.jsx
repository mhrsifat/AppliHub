// AddonSelector.jsx
import React, { useEffect, useState } from 'react';
import { Box, Checkbox, FormControlLabel, List, ListItem, ListItemText, TextField, Button } from '@mui/material';
import api from '../../../services/api';

export default function AddonSelector({ serviceId, selectedAddons = [], onChange }) {
  const [addons, setAddons] = useState([]);
  const [newAddon, setNewAddon] = useState({ title: '', price: '' });

  useEffect(() => {
    async function load() {
      if (!serviceId) return;
      try {
        const res = await api.get(`/admin/services/${serviceId}`);
        setAddons(res.data.addons || []);
      } catch (err) {
        // ignore
      }
    }
    load();
  }, [serviceId]);

  function toggle(id) {
    const exists = selectedAddons.find(a => a.id === id);
    let next;
    if (exists) next = selectedAddons.filter(a => a.id !== id);
    else {
      const addon = addons.find(a => a.id === id);
      next = [...selectedAddons, addon];
    }
    onChange?.(next);
  }

  async function addLocalAddon() {
    if (!newAddon.title) return;
    const a = { id: `local-${Date.now()}`, ...newAddon };
    setAddons(prev => [...prev, a]);
    onChange?.([...selectedAddons, a]);
    setNewAddon({ title: '', price: '' });
  }

  return (
    <Box>
      <List dense>
        {addons.map(a => (
          <ListItem key={a.id}>
            <FormControlLabel
              control={<Checkbox checked={!!selectedAddons.find(sa => sa.id === a.id)} onChange={() => toggle(a.id)} />}
              label={<ListItemText primary={a.title} secondary={`Price: ${a.price}`} />}
            />
          </ListItem>
        ))}
      </List>

      <Box className="mt-2 flex gap-2">
        <TextField placeholder="Addon title" value={newAddon.title} onChange={e => setNewAddon(s => ({ ...s, title: e.target.value }))} size="small" />
        <TextField placeholder="Price" value={newAddon.price} onChange={e => setNewAddon(s => ({ ...s, price: e.target.value }))} size="small" />
        <Button onClick={addLocalAddon}>Add</Button>
      </Box>
    </Box>
}
