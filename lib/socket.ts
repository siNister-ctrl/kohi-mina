import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocket = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });
    res.socket.server.io = io;
    io.on("connection", (socket) => {
      socket.on("join-room", (room: string) => {
        socket.join(room);
      });
    });
  }
  return res.socket.server.io;
};
