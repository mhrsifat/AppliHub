// clientBlogSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { clientBlogService } from "../services/clientBlogService";

export const fetchClientBlogs = createAsyncThunk(
  "clientBlogs/fetchList",
  async (params = {}) => {
    const res = await clientBlogService.list(params);
    return res.data;
  }
);

export const fetchClientBlog = createAsyncThunk(
  "clientBlogs/fetchOne",
  async (slug) => {
    const res = await clientBlogService.getBySlug(slug);
    return res.data;
  }
);

export const addComment = createAsyncThunk(
  "clientBlogs/comment",
  async ({ blogId, payload }) => {
    const res = await clientBlogService.comment(blogId, payload);
    return { blogId, ...res.data };
  }
);

export const addReply = createAsyncThunk(
  "clientBlogs/reply",
  async ({ blogId, payload }) => {
    const res = await clientBlogService.reply(blogId, payload);
    return { blogId, ...res.data };
  }
);

export const voteBlog = createAsyncThunk(
  "clientBlogs/vote",
  async ({ blogId, voteType }) => {
    const res = await clientBlogService.vote(blogId, voteType);
    return { id: blogId, ...res.data };
  }
);

const slice = createSlice({
  name: "clientBlogs",
  initialState: {
    list: [],
    meta: {},
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || action.payload;
        state.meta = action.payload.meta || {};
      })
      .addCase(fetchClientBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchClientBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchClientBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.current?.id === action.payload.blogId) {
          state.current.comments = [
            ...(state.current.comments || []),
            action.payload,
          ];
        }
      })
      .addCase(addReply.fulfilled, (state, action) => {
        if (state.current?.id === action.payload.blogId) {
          state.current.comments = state.current.comments.map((comment) => {
            if (comment.id === action.payload.parent_id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), action.payload],
              };
            }
            return comment;
          });
        }
      })
      .addCase(voteBlog.fulfilled, (state, action) => {
        const { id, upvotes, downvotes } = action.payload;
        state.list = state.list.map((blog) =>
          blog.id === id ? { ...blog, upvotes, downvotes } : blog
        );
        if (state.current?.id === id) {
          state.current = { ...state.current, upvotes, downvotes };
        }
      });
  },
});

export const { clearError } = slice.actions;
export default slice.reducer;
