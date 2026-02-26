"use client"

import { useState, useCallback } from "react";

interface NotificationState {
    show: boolean;
    message: string;
}

const NOTIFICATION_DURATION_MS = 3000;

export function useNotification() {
    const [notification, setNotification] = useState<NotificationState>({
        show: false,
        message: "",
    });

    const showNotification = useCallback((message: string) => {
        setNotification({ show: true, message });
        setTimeout(
            () => setNotification({ show: false, message: "" }),
            NOTIFICATION_DURATION_MS
        );
    }, []);

    return { notification, showNotification };
}
