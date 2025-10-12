// blogSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { blogService } from "../services/blogService";

export const fetchBlogs = createAsyncThunk(
  "blog/fetchList",
  async (params = {}) => {
    const res = await blogService.list(params);
    return res.data; // { data: [...], meta: {...} } expected
  }
);

export const fetchBlog = createAsyncThunk("blog/fetchOne", async (slugOrId) => {
  const res = await blogService.get(slugOrId);
  return res.data;
});

export const createBlog = createAsyncThunk("blog/create", async (payload) => {
  const res = await blogService.create(payload);
  return res.data;
});

export const updateBlog = createAsyncThunk(
  "blog/update",
  async ({ id, payload }) => {
    const res = await blogService.update(id, payload);
    return res.data;
  }
);

export const deleteBlog = createAsyncThunk("blog/delete", async (id) => {
  await blogService.remove(id);
  return id;
});

export const fetchCategories = createAsyncThunk(
  "blog/fetchCategories",
  async () => {
    const res = await blogService.categories();
    return res.data;
  }
);

export const fetchTags = createAsyncThunk("blog/fetchTags", async () => {
  const res = await blogService.tags();
  return res.data;
});

export const voteBlog = createAsyncThunk(
  "blog/vote",
  async ({ id, voteType }) => {
    const res = await blogService.vote(id, voteType);
    return { id, ...res.data };
  }
);

export const commentBlog = createAsyncThunk(
  "blog/comment",
  async ({ id, payload }) => {
    const res = await blogService.comment(id, payload);
    return { blogId: id, ...res.data };
  }
);

export const replyToComment = createAsyncThunk(
  "blog/reply",
  async ({ blogId, payload }) => {
    const res = await blogService.adminReply(blogId, payload);
    return { blogId, ...res.data };
  }
);

const slice = createSlice({
  name: "blog",
  initialState: {
    list: [],
    meta: {},
    current: null,
    loading: false,
    error: null,
    categories: [],
    tags: [],
  },
  reducers: {
    clearCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchBlogs.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.data || a.payload; // support both shapes
        s.meta = a.payload.meta || {};
      })
      .addCase(fetchBlogs.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })

      .addCase(fetchBlog.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchBlog.fulfilled, (s, a) => {
        s.loading = false;
        s.current = a.payload;
      })
      .addCase(fetchBlog.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })

      .addCase(createBlog.fulfilled, (s, a) => {
        // optionally push to list
        s.list.unshift(a.payload.data || a.payload);
      })

      .addCase(updateBlog.fulfilled, (s, a) => {
        // replace in list
        const updated = a.payload.data || a.payload;
        s.list = s.list.map((it) => (it.id === updated.id ? updated : it));
        if (s.current && s.current.id === updated.id) s.current = updated;
      })

      .addCase(deleteBlog.fulfilled, (s, a) => {
        s.list = s.list.filter((b) => b.id !== a.payload);
      })

      .addCase(fetchCategories.fulfilled, (s, a) => {
        s.categories = a.payload;
      })
      .addCase(fetchTags.fulfilled, (s, a) => {
        s.tags = a.payload;
      })

      .addCase(voteBlog.fulfilled, (s, a) => {
        const { id, upvotes, downvotes } = a.payload;
        // Update both list and current if they exist
        s.list = s.list.map((b) =>
          b.id === id ? { ...b, upvotes, downvotes } : b
        );
        if (s.current?.id === id) {
          s.current = { ...s.current, upvotes, downvotes };
        }
      })

      .addCase(commentBlog.fulfilled, (s, a) => {
        const { blogId, ...comment } = a.payload;
        // Add comment to current blog if it's loaded
        if (s.current?.id === blogId) {
          s.current.comments = [...(s.current.comments || []), comment];
        }
      })

      .addCase(replyToComment.fulfilled, (s, a) => {
        const { blogId, ...reply } = a.payload;
        // Add reply to the appropriate comment if blog is loaded
        if (s.current?.id === blogId) {
          const comments = s.current.comments.map((c) => {
            if (c.id === reply.parent_id) {
              return { ...c, replies: [...(c.replies || []), reply] };
            }
            return c;
          });
          s.current.comments = comments;
        }
      });
  },
});

export const { clearCurrent } = slice.actions;
export default slice.reducer;
