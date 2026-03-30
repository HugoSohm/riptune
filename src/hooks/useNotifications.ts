import { useState } from "react";
import { Notification } from "../types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: 'info' | 'error' | 'success' = 'info', isTask: boolean = false) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [{ id, message, type, isTask }, ...prev]);

    if (!isTask && type !== 'error') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotificationsFor = (match: string) => {
    setNotifications(prev => prev.filter(n => !n.message.includes(match)));
  };

  return { notifications, addNotification, removeNotification, clearNotificationsFor };
}
