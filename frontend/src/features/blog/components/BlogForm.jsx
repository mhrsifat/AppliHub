// BlogForm.jsx
import React, { useEffect, useState } from "react";
import { TextField, Button, Autocomplete, Chip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, fetchTags } from "../slices/blogSlice";

export default function BlogForm({ initial = {}, onSave }) {
  const dispatch = useDispatch();
  const { categories = [], tags = [] } = useSelector((s) => s.blogs);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    thumbnail: "",
    category_id: null,
    tag_ids: [],
    published_at: null,
    ...initial,
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTags());
  }, [dispatch]);

  useEffect(() => {
    setForm((f) => ({ ...f, ...initial }));
  }, [initial]);

  const change = (k, v) => setForm({ ...form, [k]: v });

  const submit = (e) => {
    e.preventDefault();
    // ensure tag_ids is array of ids
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <TextField
        label="Title"
        name="title"
        fullWidth
        value={form.title}
        onChange={(e) => change("title", e.target.value)}
      />
      <TextField
        label="Slug"
        name="slug"
        fullWidth
        value={form.slug}
        onChange={(e) => change("slug", e.target.value)}
      />
      <TextField
        label="Excerpt"
        name="excerpt"
        fullWidth
        multiline
        rows={2}
        value={form.excerpt}
        onChange={(e) => change("excerpt", e.target.value)}
      />
      <TextField
        label="Content (HTML)"
        name="content"
        fullWidth
        multiline
        rows={6}
        value={form.content}
        onChange={(e) => change("content", e.target.value)}
      />

      <Autocomplete
        options={categories}
        getOptionLabel={(o) => o.name}
        value={categories.find((c) => c.id === form.category_id) || null}
        onChange={(e, v) => change("category_id", v?.id || null)}
        renderInput={(params) => <TextField {...params} label="Category" />}
      />

      <Autocomplete
        multiple
        options={tags}
        getOptionLabel={(o) => o.name}
        value={tags.filter((t) => form.tag_ids?.includes(t.id))}
        onChange={(e, v) =>
          change(
            "tag_ids",
            v.map((i) => i.id)
          )
        }
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option.name} {...getTagProps({ index })} />
          ))
        }
        renderInput={(params) => <TextField {...params} label="Tags" />}
      />

      <div className="flex items-center space-x-2">
        <Button type="submit" variant="contained">
          Save
        </Button>
      </div>
    </form>
  );
}
