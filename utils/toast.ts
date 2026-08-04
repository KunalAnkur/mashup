/**
 * Toast notification utilities
 * 
 * Centralized toast functions for consistent error/success/info messaging
 * across the application.
 */

import React from 'react';
import toast from 'react-hot-toast';

// Inject custom error toast styles once
if (typeof window !== 'undefined' && !document.getElementById('custom-error-toast-styles')) {
  const style = document.createElement('style');
  style.id = 'custom-error-toast-styles';
  style.textContent = `
    .custom-error-toast {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      color: inherit !important;
    }
    /* Hide default close button from react-hot-toast */
    .custom-error-toast > div > button[aria-label="Close"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Show an error toast notification with title and description
 * @param title - Main error title (e.g., "Invalid credentials")
 * @param description - Optional detailed description (e.g., "Please check your email or password")
 */
export const showError = (title: string, description?: string) => {
  // If only one string is provided, use it as title with default description
  if (!description) {
    return toast(
      (t) =>
        React.createElement(
          'div',
          { className: 'flex items-center justify-between w-full gap-4' },
          React.createElement(
            'div',
            { className: 'flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center' },
            React.createElement('span', { className: 'text-white font-bold text-sm' }, '✕')
          ),
          React.createElement(
            'div',
            { className: 'flex-1 min-w-0 flex flex-col justify-center' },
            React.createElement('p', { className: 'font-semibold text-white/70 text-sm' }, title)
          ),
          React.createElement(
            'button',
            {
              onClick: () => toast.dismiss(t.id),
              className: 'flex-shrink-0 text-white/50 hover:text-white/80 transition-colors cursor-pointer',
              'aria-label': 'Close',
            },
            React.createElement('span', { className: 'text-lg font-bold' }, '✕')
          )
        ),
      {
        duration: 5000,
        icon: undefined, // Disable default icon
        style: {
          background: '#1f1f23',
          borderRadius: '12px',
          padding: '8px 5px',
          maxWidth: '400px',
        },
        className: 'custom-error-toast',
      }
    );
  }

  // If both title and description are provided
  return toast(
    (t) =>
      React.createElement(
        'div',
        { className: 'flex items-center justify-between w-full gap-4' },
        React.createElement(
          'div',
          { className: 'flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center' },
          React.createElement('span', { className: 'text-white font-bold text-sm' }, '✕')
        ),
        React.createElement(
          'div',
          { className: 'flex-1 min-w-0 flex flex-col justify-center' },
          React.createElement('p', { className: 'font-semibold text-white/70 text-sm ' }, title),
          React.createElement('p', { className: 'text-white/50 text-xs leading-relaxed' }, description)
        ),
        React.createElement(
          'button',
          {
            onClick: () => toast.dismiss(t.id),
            className: 'flex-shrink-0 text-white/50 hover:text-white/80 transition-colors cursor-pointer',
            'aria-label': 'Close',
          },
          React.createElement('span', { className: 'text-sm font-bold' }, '✕')
        )
      ),
    {
      duration: 5000,
      icon: undefined, // Disable default icon
      style: {
        background: '#1f1f23',
        borderRadius: '20px',
        padding: '8px 5px',
        maxWidth: '400px',
      },
      className: 'custom-error-toast',
    }
  );
};

/**
 * Show a success toast notification
 */
export const showSuccess = (message: string) => {
  return toast(
    (t) =>
      React.createElement(
        'div',
        { className: 'flex items-center justify-between w-full gap-4' },
        React.createElement(
          'div',
          { className: 'flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center' },
          React.createElement('span', { className: 'text-white font-bold text-sm' }, '✓')
        ),
        React.createElement(
          'div',
          { className: 'flex-1 min-w-0 flex flex-col justify-center' },
          React.createElement('p', { className: 'font-semibold text-white/70 text-sm' }, message)
        ),
        React.createElement(
          'button',
          {
            onClick: () => toast.dismiss(t.id),
            className: 'flex-shrink-0 text-white/50 hover:text-white/80 transition-colors cursor-pointer',
            'aria-label': 'Close',
          },
          React.createElement('span', { className: 'text-lg font-bold' }, '✕')
        )
      ),
    {
      duration: 3000,
      icon: undefined, // Disable default icon
      style: {
        background: '#1f1f23',
        borderRadius: '12px',
        padding: '8px 10px',
        maxWidth: '400px',
      },
      className: 'custom-error-toast',
    }
  );
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
      padding: '8px 5px',
    },
  });
};

/**
 * Show a toast with a primary action button.
 *
 * For prompts the user can act on without leaving what they are doing — unlike `showError`
 * / `showInfo`, which only report. The action dismisses the toast itself, so callers pass a
 * plain handler and do not manage the toast id.
 *
 * All copy is caller-supplied and must already be translated.
 */
export const showActionToast = (
  title: string,
  description: string,
  actionLabel: string,
  onAction: () => void,
  duration = 10000
) => {
  return toast(
    (t) =>
      React.createElement(
        'div',
        { className: 'flex items-center justify-between w-full gap-3' },
        React.createElement(
          'div',
          { className: 'flex-1 min-w-0 flex flex-col justify-center' },
          React.createElement('p', { className: 'font-semibold text-white/70 text-sm' }, title),
          React.createElement('p', { className: 'text-white/50 text-xs leading-relaxed' }, description)
        ),
        React.createElement(
          'button',
          {
            onClick: () => {
              toast.dismiss(t.id);
              onAction();
            },
            className:
              'flex-shrink-0 rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/20 transition-colors hover:bg-amber-500/25 cursor-pointer',
          },
          actionLabel
        ),
        React.createElement(
          'button',
          {
            onClick: () => toast.dismiss(t.id),
            className: 'flex-shrink-0 text-white/50 hover:text-white/80 transition-colors cursor-pointer',
            'aria-label': 'Close',
          },
          React.createElement('span', { className: 'text-sm font-bold' }, '✕')
        )
      ),
    {
      duration,
      icon: undefined,
      style: {
        background: '#1f1f23',
        borderRadius: '16px',
        padding: '8px 10px',
        maxWidth: '420px',
      },
      className: 'custom-error-toast',
    }
  );
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
      padding: '8px 5px',
    },
  });
};
