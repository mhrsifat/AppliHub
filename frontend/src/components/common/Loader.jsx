// src/components/Loader.jsx
import React from 'react';
import { useTheme } from '@mui/material/styles';

const Loader = ({ size = 'medium', global = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const spinnerSize =
    size === 'small'
      ? 'w-6 h-6 border-4'
      : size === 'large'
      ? 'w-16 h-16 border-8'
      : 'w-10 h-10 border-6';

  const gradientClass = isDark
    ? 'border-t-white border-r-gray-400'
    : 'border-t-primary border-r-secondary';

  return (
    <div
      className={`${
        global
          ? 'fixed inset-0 bg-black/20 dark:bg-black/50 flex justify-center items-center z-50'
          : 'flex justify-center items-center'
      }`}
    >
      <div
        className={`${spinnerSize} ${gradientClass} border-b-transparent border-l-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default Loader;