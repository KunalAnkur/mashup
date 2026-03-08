// import useAuthStore from "@/store/authStore";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { SocketEvent } from "@/types/socketEvents";

interface SocketServiceOptions {
  baseUrl?: string;
  options?: Partial<ManagerOptions & SocketOptions>;
  namespaces?: string[];
}

export class SocketService {
  private socket: Socket | null = null;
  private namespaceMap: Map<string, Socket> = new Map();
  private baseUrl: string;
  private options: Partial<ManagerOptions & SocketOptions>;
  private namespaces: string[];
  private authToken: string | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor({
    baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "",
    options = {},
    namespaces = [],
  }: SocketServiceOptions = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      reconnectionAttempts: 100,
      reconnectionDelay: 1000,
      autoConnect: true,
      ...options,
    };
    this.namespaces = namespaces;
  }

  setAuthToken(token?: string | null) {
    const normalizedToken = token || null;
    if (this.authToken === normalizedToken) {
      return;
    }

    this.authToken = normalizedToken;

    if (this.socket) {
      this.socket.auth = this.authToken ? { token: this.authToken } : {};
      this.socket.disconnect();
      if (this.authToken) {
        this.socket.connect();
      }
    }

    this.namespaceMap.forEach((nsSocket) => {
      nsSocket.auth = this.authToken ? { token: this.authToken } : {};
      nsSocket.disconnect();
      if (this.authToken) {
        nsSocket.connect();
      }
    });
  }

  connect(token?: string | null): Socket | null {
    if (token !== undefined) {
      this.setAuthToken(token);
    }

    if (!this.authToken) {
      return null;
    }

    if (!this.socket) {
      const mergedOptions = {
        ...this.options,
        auth: { token: this.authToken },
      };

      this.socket = io(this.baseUrl, mergedOptions);

      console.log(`Connecting to socket: ${this.baseUrl}`, mergedOptions);
      this.socket.connect();

      this.setupSocketListeners(this.socket);

      // Setup additional namespaces
      this.namespaces.forEach((namespace) => {
        this.connectToNamespace(namespace);
      });
    }

    return this.socket;
  }

  connectToNamespace(namespace: string): Socket | null {
    if (!this.authToken) {
      return null;
    }

    if (!this.namespaceMap.has(namespace)) {
      const nsSocket = io(`${this.baseUrl}/${namespace}`, {
        ...this.options,
        auth: { token: this.authToken },
      });

      this.setupSocketListeners(nsSocket);
      this.namespaceMap.set(namespace, nsSocket);
    }

    return this.namespaceMap.get(namespace)!;
  }

  getNamespaceSocket(namespace: string) {
    return (
      this.namespaceMap.get(namespace) ??
      this.connectToNamespace(namespace)
    );
  }

  getSocket() {
    return this.socket ?? this.connect();
  }

  disconnect() {
    this.socket?.disconnect();
    this.namespaceMap.forEach((socket) => socket.disconnect());

    this.socket = null;
    this.namespaceMap.clear();
  }

  private setupSocketListeners(socket: Socket) {
    socket.on("connect", () => {
      console.log(`Socket connected: ${socket.id}`, socket);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error(`Connection error: ${socket.id}`, error);
    });

    // Listen for judge_panel events
    // socket.on(SocketEvent.JUDGE_PANEL, (data) => {
    //   console.log("judge_panel", data);
    //   // Notify any registered listeners
    //   this.notifyListeners(SocketEvent.JUDGE_PANEL, data);
    // });
  }

  // Method to register event listeners
  addEventListener(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  // Method to remove event listeners
  removeEventListener(event: string, callback: (data: any) => void) {
    this.eventListeners.get(event)?.delete(callback);
  }

  // Method to notify all listeners of an event
  private notifyListeners(event: string, data: any) {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

// Create singleton instance
// export const socketService = new SocketService({
// //   namespaces: ['/']
// });

export default SocketService;
