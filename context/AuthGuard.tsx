"use client";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { RootState } from "@/lib/store";
import { logout } from "@/lib/store/slices/authSlice";
import { setRoom, setLoading as setRoomLoading } from "@/lib/store/slices/roomSlice";
import { setSubscription, clearSubscription } from "@/lib/store/slices/subscriptionSlice";
import { useVerifyTokenMutation } from "@/lib/store/api/authApi";
import { useCreateRoomMutation, useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { useLazyGetMySubscriptionQuery } from "@/lib/store/api/userApi";
import RoomPreparingSplash from "@/components/Container/RoomPreparingSplash";
import { trackRoomCreated, trackRoomJoined } from "@/lib/analytics";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [verifyToken] = useVerifyTokenMutation();
  const [createRoomApi] = useCreateRoomMutation();
  const [getRoomByRoomId] = useGetRoomByRoomIdMutation();
  const [getMySubscription] = useLazyGetMySubscriptionQuery();
  const roomState = useSelector((state: RootState) => state.room);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { roomId: roomRoutId } = useParams();
  const searchParams = useSearchParams();

  const refreshAuthState = async () => {
    try {
      const response = await verifyToken().unwrap();
      if (!response.success) {
        dispatch(logout());
        dispatch(clearSubscription());
      } else {
        dispatch(setSubscription(response.data.subscription))
        // Fetch subscription info after successful token verification
        // try {
        //   const subscriptionResponse = await getMySubscription().unwrap();
        //   if (subscriptionResponse.success && subscriptionResponse.data) {
        //     dispatch(setSubscription(subscriptionResponse.data));
        //   }
        // } catch (error) {
        //   // Subscription fetch failed, but auth is still valid
        //   console.error("Failed to fetch subscription:", error);
        // }
      }
    } catch {
      dispatch(logout());
      dispatch(clearSubscription());
    }
  };

  // const refreshRoomDetails = async () => {
  //     try {
  //         const roomResponse = await getMyRoom().unwrap();
  //         if (roomResponse.success) {
  //             const data = roomResponse.data;
  //             if (Object.keys(data).length) {
  //                 const result = { ...roomResponse, authId }
  //                 // dispatch(setRoom(result));
  //                 return result;
  //             }
  //             else {
  //                 dispatch(exitRoom());
  //                 return null;
  //             }
  //         } else {
  //             dispatch(exitRoom());
  //             return null;
  //         }
  //     } catch (error) {
  //         dispatch(exitRoom());
  //         return null;
  //     }
  // }

  const createRoomWithRefer = async () => {
    try {
      const playlist = roomState.playlist || [];
      if (!playlist.length) return null;
      dispatch(setRoomLoading(true));
      const response = await createRoomApi({
        playlist,
      }).unwrap();
      if (response.success) {
        const roomWithAuth = { ...response, authId: authState.user!.id };
        dispatch(setRoom(roomWithAuth));
        
        // Track room creation
        const firstItem = playlist[0];
        if (firstItem && response.data?.room_id) {
          trackRoomCreated(
            response.data.room_id,
            firstItem.type as "stream" | "sync",
            firstItem.source as "file" | "url" | "screen",
            "home"
          );
        }
        
        return roomWithAuth;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  };

  const fetchRoomDetailsByRoomId = async (roomId: string | null) => {
    if (!roomId || roomId === "null") return;
    const response = await getRoomByRoomId(roomId).unwrap();
    // console.log("fetchRoomDetailsByRoomId", response, roomId);
    if (response.success) {
      // console.log("Room details fetched successfully:", response.data);
      const roomWithAuth = { ...response, authId: authState.user!.id };
      dispatch(setRoom(roomWithAuth));
      
      // Track room joined (as guest if not host)
      const isHost = response.data?.user_id === authState.user!.id;
      trackRoomJoined(roomId!, isHost ? "host" : "guest");
      // if (roomWithAuth.data.user_id === authState.user!.id) {
      //     // User is the host of the room
      //     // dispatch(setRoom(roomWithAuth));
      // } else {
      //     // User is not the host, so they are joining the room
      //     // dispatch(setRoom(roomWithAuth));
      // }
    }
  };

  // Verify token on mount
  useEffect(() => {
    refreshAuthState();
  }, []);

  // Handle routing logic based on pathname
  useEffect(() => {
    const routeLogic = async () => {
      // Wait for auth state to be determined
      if (authState.loading) return;

      // Auth routes
      // const authRoutes = ["/login", "/signup"];
      const authRoutes = ["/login"];
      const isAuthRoute = authRoutes.includes(pathname);
      const requiresAuthentication =
        pathname === "/pricing" || pathname === "/subscription";
      const redirectParam = searchParams?.get("redirect");
      const safeRedirect =
        redirectParam && redirectParam.startsWith("/") ? redirectParam : null;

      const hasPlaylist = roomState.playlist && roomState.playlist.length > 0;

      // If authenticated user is on auth pages, check for refer data and redirect accordingly
      if (isAuthRoute && authState.isAuthenticated) {
        if (safeRedirect) {
          router.replace(safeRedirect);
          return;
        }
        // If user has refer data, create room and redirect
        if (roomState.refer && hasPlaylist) {
          const result = await createRoomWithRefer();
          if (result && result.data?.room_id) {
            router.replace(`/room/${result.data.room_id}`);
            return;
          }
        }
        // Otherwise redirect to home
        router.replace("/");
        return;
      }

      if (requiresAuthentication && !authState.isAuthenticated) {
        const queryString =
          typeof window !== "undefined" ? window.location.search : "";
        const redirectPath = `${pathname || "/"}` + queryString;
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      // Handle home page
      if (pathname === "/") {
        if (authState.isAuthenticated) {
          // Only redirect to existing room if user has refer data (coming from stream/sync)
          // Don't auto-redirect if user intentionally navigated to home
          if (roomState.refer && hasPlaylist) {
            // If user has refer data (from /stream or /sync), create room
            const result = await createRoomWithRefer();
            if (result && result.data?.room_id) {
              router.replace(`/room/${result.data.room_id}`);
              return;
            }
          }
          // Don't auto-redirect to existing room when user navigates to home
          // Let them stay on home page to create a new room or join a room
        }
        // Otherwise, stay on home page (source selection)
      }

      // Handle /stream, /stream/files, /stream/[source], and /sync routes - create room if authenticated and has refer data
      const isStreamRoute =
        pathname === "/stream" ||
        pathname === "/stream/files" ||
        (pathname?.startsWith("/stream/") && pathname !== "/stream/files");
      if ((isStreamRoute || pathname === "/sync") && authState.isAuthenticated) {
        if (roomState.refer && hasPlaylist) {
          const result = await createRoomWithRefer();
          if (result && result.data?.room_id) {
            router.replace(`/room/${result.data.room_id}`);
            return;
          }
        }
      }
    };

    routeLogic();
  }, [
    pathname,
    authState.isAuthenticated,
    authState.loading,
    searchParams,
    roomState.haveRoom,
    roomState.roomId,
    roomState.refer,
    roomState.playlist,
  ]);

  // Handle room page

  useEffect(() => {
    // let timeoutId: NodeJS.Timeout | null = null;

    const routeLogic = async () => {
      if (pathname?.startsWith("/room/") && roomRoutId) {
        if (authState.isAuthenticated) {
          // Check if we already have the correct room data loaded
          const hasCorrectRoom = roomState.haveRoom && roomState.roomId === roomRoutId;

          if (!hasCorrectRoom) {
            dispatch(setRoomLoading(true));
            try {
              await fetchRoomDetailsByRoomId(roomRoutId as string);
              // Wait for Redux state to update and DOM to render
              await new Promise((resolve) => setTimeout(resolve, 250));
            } catch {
              // Notify user about the error
              // console.error("Error fetching room details:", error);
              // showError("Failed to load room", "The room may not exist or you may not have access. Please check the room ID and try again.");
              router.replace("/");
              dispatch(setRoomLoading(false));
              return;
            }
          }

          // Use a timeout to ensure smooth transition after room is loaded
          // Check again if room is loaded before hiding skeleton
          if (roomState.haveRoom && roomState.roomId === roomRoutId) {
            dispatch(setRoomLoading(false));
          }
          // timeoutId = setTimeout(() => {

          // }, 150);
        } else {
          // Redirect to login if not authenticated, preserving intended destination
          const queryString =
            typeof window !== "undefined" ? window.location.search : "";
          const redirectPath = `${pathname || "/"}` + queryString;
          router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          dispatch(setRoomLoading(false));
        }
      } else {
        dispatch(setRoomLoading(false));
      }
    };

    // Only run if auth is not loading
    if (!authState.loading) {
      routeLogic();
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      // if (timeoutId) {
      //     clearTimeout(timeoutId);
      // }
    };
  }, [
    pathname,
    roomRoutId,
    authState.isAuthenticated,
    authState.loading,
    roomState.haveRoom,
    roomState.roomId,
  ]);

  // Don't show skeleton on public pages
  const publicRoutes = ["/", "/login", "/signup", "/stream", "/stream/files", "/sync"];
  const isStreamSourceRoute = pathname?.startsWith("/stream/") && pathname !== "/stream/files";
  const isPublicRoute = pathname && (publicRoutes.includes(pathname) || isStreamSourceRoute);
  const isRoomRoute = pathname?.startsWith("/room/");

  // Show skeleton if:
  // 1. We're on a room route
  // 2. And either: loading states are true, skeleton state is true, or room data is not ready
  const shouldShowSkeleton =
    isRoomRoute &&
    !isPublicRoute &&
    (authState.loading ||
      roomState.loading ||
      (!roomState.haveRoom || (roomRoutId && roomState.roomId !== roomRoutId)));

  return (
    <>
      {shouldShowSkeleton ? (
        <div className="animate-fade-in">
          <RoomPreparingSplash />
        </div>
      ) : (
        <div className="animate-fade-in">{children}</div>
      )}
    </>
  );
}
