// src/features/blog/pages/TagPage.jsx
import React, { useEffect, useState } from "react";
import { TextField, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { blogService } from "../services/blogService";

export default function TagPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await blogService.tags();
      setTags(res.data || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setSlug("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await blogService.updateTag(editing.id, { name, slug });
      } else {
        await blogService.createTag({ name, slug });
      }
      await load();
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const handleEdit = (t) => {
    setEditing(t);
    setName(t.name);
    setSlug(t.slug);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete tag?")) return;
    try {
      await blogService.removeTag(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Tag Management</h2>

      <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-3 items-end">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <div>
          <Button type="submit" variant="contained">{editing ? "Update" : "Create"}</Button>
          {editing && <Button onClick={resetForm} variant="text" className="ml-2">Cancel</Button>}
        </div>
      </form>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="p-4">Loading...</td></tr>
            ) : tags.length === 0 ? (
              <tr><td colSpan="3" className="p-4">No tags yet.</td></tr>
            ) : (
              tags.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">{t.slug}</td>
                  <td className="p-3 text-right">
                    <IconButton size="small" onClick={() => handleEdit(t)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(t.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
