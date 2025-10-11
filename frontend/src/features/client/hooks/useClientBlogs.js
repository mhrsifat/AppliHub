// useClientBlogs.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClientBlogs,
  fetchClientBlog,
  clearError,
} from "../slices/clientBlogSlice";

export function useClientBlogs(params = {}) {
  const dispatch = useDispatch();
  const { list, loading, meta, error } = useSelector((s) => s.clientBlog);

  useEffect(() => {
    dispatch(fetchClientBlogs(params));

    return () => {
      dispatch(clearError());
    };
  }, [dispatch, params]);

  return { list, loading, meta, error };
}

export function useBlogDetails(slug) {
  const dispatch = useDispatch();
  const { current, loading, error } = useSelector((s) => s.clientBlog);

  useEffect(() => {
    if (slug) dispatch(fetchClientBlog(slug));

    return () => {
      dispatch(clearError());
    };
  }, [dispatch, slug]);

  return { blog: current, loading, error };
}
