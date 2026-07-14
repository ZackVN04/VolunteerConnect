import { useCallback, useRef, useState } from 'react';
import type { ConfirmDialogState, NotificationState, NotificationType, PromptDialogState } from './AppContext.types';

export const useDialogNotifications = () => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [promptDialog, setPromptDialog] = useState<PromptDialogState | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);
  }, []);

  const showConfirm = (message: string, onConfirm: () => void, title?: string) => {
    setConfirmDialog({ message, title, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  const showPrompt = (message: string, onConfirm: (val: string) => void, title?: string, placeholder?: string) => {
    setPromptDialog({ message, title, placeholder, onConfirm });
  };

  const closePrompt = () => {
    setPromptDialog(null);
  };

  return {
    notification,
    showNotification,
    confirmDialog,
    showConfirm,
    closeConfirm,
    promptDialog,
    showPrompt,
    closePrompt
  };
};
