export interface GPEdgeNotification {
  id: string;
  type: "new-questions" | "quiz" | "upload" | "custom";
  title: string;
  message: string;
  count: number;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
}

const LOCAL_STORAGE_KEY = "gpedge_new_questions_notification";

export function addUserNotification(
  title: string,
  message: string,
  count: number,
  type: GPEdgeNotification["type"] = "new-questions"
): GPEdgeNotification | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const notifications: GPEdgeNotification[] = raw ? JSON.parse(raw) : [];

    const newNotif: GPEdgeNotification = {
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11),
      type,
      title,
      message,
      count,
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
    };

    notifications.unshift(newNotif);
    // Limit to latest 10 notifications
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications.slice(0, 10)));

    // Dispatch custom event for real-time synchronization in the current window
    window.dispatchEvent(new Event("gpedge-new-notification"));
    
    // Also dispatch storage event manually for other tabs/listeners
    const storageEvent = new StorageEvent("storage", {
      key: LOCAL_STORAGE_KEY,
      newValue: JSON.stringify(notifications),
    });
    window.dispatchEvent(storageEvent);

    return newNotif;
  } catch (error) {
    console.error("Failed to add user notification:", error);
    return null;
  }
}

export function getUserNotifications(): GPEdgeNotification[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to get user notifications:", error);
    return [];
  }
}

export function dismissUserNotification(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;

    let notifications: GPEdgeNotification[] = JSON.parse(raw);
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, dismissed: true, read: true } : n
    );

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications));
    
    window.dispatchEvent(new Event("gpedge-new-notification"));
    
    const storageEvent = new StorageEvent("storage", {
      key: LOCAL_STORAGE_KEY,
      newValue: JSON.stringify(notifications),
    });
    window.dispatchEvent(storageEvent);
  } catch (error) {
    console.error("Failed to dismiss user notification:", error);
  }
}

export function clearAllUserNotifications(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    window.dispatchEvent(new Event("gpedge-new-notification"));
    
    const storageEvent = new StorageEvent("storage", {
      key: LOCAL_STORAGE_KEY,
      newValue: null,
    });
    window.dispatchEvent(storageEvent);
  } catch (error) {
    console.error("Failed to clear notifications:", error);
  }
}
