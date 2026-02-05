import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { COOKIE_NAME } from "@shared/const";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getCookie(COOKIE_NAME);
    
    if (!token) {
      console.warn("[Socket] No auth token found");
      return;
    }

    // Create socket connection
    const socket = io({
      auth: { token },
      path: "/socket.io",
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
