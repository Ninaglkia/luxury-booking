import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { sdk } from "./sdk";
import { getUserByOpenId } from "../db";

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
    path: "/socket.io",
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const session = await sdk.verifySession(token);
      if (!session?.openId) {
        return next(new Error("Invalid token"));
      }

      const user = await getUserByOpenId(session.openId);
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`[Socket.io] User connected: ${user.name} (${user.id})`);

    // Join user's personal room for receiving messages
    socket.join(`user:${user.id}`);

    // Handle joining conversation rooms
    socket.on("join:conversation", (conversationId: number) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket.io] User ${user.id} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on("leave:conversation", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`[Socket.io] User ${user.id} left conversation ${conversationId}`);
    });

    // Handle typing indicator
    socket.on("typing:start", (conversationId: number) => {
      socket.to(`conversation:${conversationId}`).emit("user:typing", {
        userId: user.id,
        userName: user.name,
      });
    });

    socket.on("typing:stop", (conversationId: number) => {
      socket.to(`conversation:${conversationId}`).emit("user:stopped-typing", {
        userId: user.id,
      });
    });

    // Handle new message (sent from tRPC mutation, this is just for broadcasting)
    socket.on("message:send", (data: { conversationId: number; message: any }) => {
      socket.to(`conversation:${data.conversationId}`).emit("message:new", data.message);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] User disconnected: ${user.name} (${user.id})`);
    });
  });

  return io;
}

export type SocketIOInstance = ReturnType<typeof setupSocketIO>;
