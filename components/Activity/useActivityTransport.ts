"use client";

import { useMemo } from "react";
import type { Socket } from "socket.io-client";
import type { ActivityTransport } from "@movmash/arcade-client";

/**
 * Adapts this app's socket to the three methods arcade needs.
 *
 * The adapter exists so the arcade packages never depend on socket.io. Auth,
 * reconnection, and the socket's lifecycle stay owned here, where the rest of the
 * app already manages them — arcade just needs something it can emit on.
 */
export function useActivityTransport(socket: Socket | null): ActivityTransport | null {
  return useMemo(() => {
    if (!socket) return null;

    return {
      emit(event, data, ack) {
        if (ack) socket.emit(event, data, ack);
        else socket.emit(event, data);
      },
      on(event, handler) {
        socket.on(event, handler);
      },
      off(event, handler) {
        socket.off(event, handler);
      },
      get connected() {
        return socket.connected;
      },
    };
  }, [socket]);
}
