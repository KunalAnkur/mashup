/**
 * Toast notification utilities
 * 
 * Centralized toast functions for consistent error/success/info messaging
 * across the application.
 */

import toast from 'react-hot-toast';

/**
 * Show an error toast notification
 */
export const showError = (message: string) => {
  return toast.error(message, {
    duration: 4000,
    style: {
      background: '#1f1f23',
      color: '#fff',
      
      borderRadius: '12px',
      padding: "8px 14px",
    },
  });
};

/**
 * Show a success toast notification
 */
export const showSuccess = (message: string) => {
  return toast.success(message, {
    duration: 3000,
    style: {
      background: '#1f1f23',
      color: '#fff',
      
      borderRadius: '12px',
      padding: "8px 14px",
    },
  });
};

/**
 * Show an info toast notification
 */
export const showInfo = (message: string, duration?: number) => {
  return toast(message, {
    duration: duration || 5000,
    icon: 'ℹ️',
    style: {
      background: '#1f1f23',
      color: '#fff',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '12px',
      padding: "8px 14px",
    },
  });
};

/**
 * Show a loading toast notification
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#1f1f23',
      color: '#fff',
      borderRadius: '12px',
      padding: "8px 14px",
    },
  });
};

