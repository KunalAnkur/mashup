"use client";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { RootState } from "@/lib/store";
import { logout } from "@/lib/store/slices/authSlice";
import { exitRoom, setRoom } from "@/lib/store/slices/roomSlice";
import { useVerifyTokenMutation } from "@/lib/store/api/authApi";
import { useCreateRoomMutation, useGetMyRoomMutation, useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { Skeleton } from "@/components";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
    // const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const authId = useSelector((state: RootState) => state.auth.user?.id);
    const [verifyToken] = useVerifyTokenMutation();
    const [getMyRoom] = useGetMyRoomMutation();
    const [createRoomApi] = useCreateRoomMutation();
    const [getRoomByRoomId] = useGetRoomByRoomIdMutation();
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
            } else {
            }
        } catch (error) {
            dispatch(logout());
        }
    }

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
            const response = await createRoomApi({ urls: roomState.urls, sourceType: roomState.sourceType! }).unwrap();
            if (response.success) {
                const roomWithAuth = { ...response, authId: authState.user!.id };
                dispatch(setRoom(roomWithAuth));
                return roomWithAuth;
            } else {
                return null;
            }
        } catch (err) {
            return null;
        }
    }

    const fetchRoomDetailsByRoomId = async (roomId: string | null) => {
        if (!roomId || roomId === 'null') return;
        const response = await getRoomByRoomId(roomId).unwrap();
        // console.log("fetchRoomDetailsByRoomId", response, roomId);
        if (response.success) {
            // console.log("Room details fetched successfully:", response.data);
            const roomWithAuth = { ...response, authId: authState.user!.id };
            dispatch(setRoom(roomWithAuth));
            // if (roomWithAuth.data.user_id === authState.user!.id) {
            //     // User is the host of the room
            //     // dispatch(setRoom(roomWithAuth));
            // } else {
            //     // User is not the host, so they are joining the room
            //     // dispatch(setRoom(roomWithAuth));
            // }
        } 
    }
    
    // Verify token on mount
    useEffect(() => { 
        refreshAuthState()
    }, [])

    // Handle routing logic based on pathname
    useEffect(() => {
        const routeLogic = async () => {
            // Wait for auth state to be determined
            if (authState.loading) return;

            // Auth routes
            const authRoutes = ["/login", "/signup"];
            const isAuthRoute = authRoutes.includes(pathname);
            const redirectParam = searchParams?.get("redirect");
            const safeRedirect =
                redirectParam && redirectParam.startsWith("/") ? redirectParam : null;

            // If authenticated user is on auth pages, check for refer data and redirect accordingly
            if (isAuthRoute && authState.isAuthenticated) {
                if (safeRedirect) {
                    router.replace(safeRedirect);
                    return;
                }
                // If user has refer data, create room and redirect
                if (roomState.refer && roomState.sourceType) {
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

            // Handle home page
            if (pathname === "/") {
                if (authState.isAuthenticated) {
                    // Only redirect to existing room if user has refer data (coming from stream/sync)
                    // Don't auto-redirect if user intentionally navigated to home
                    if (roomState.refer && roomState.sourceType) {
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

            // Handle /stream and /sync routes - create room if authenticated and has refer data
            if ((pathname === "/stream" || pathname === "/sync") && authState.isAuthenticated) {
                if (roomState.refer && roomState.sourceType) {
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
        roomState.sourceType,
        roomState.urls,
    ]);

    // Handle room page
    const [skeleton, setSkeleton] = useState<boolean>(false);
    const [isRoomLoading, setIsRoomLoading] = useState<boolean>(false);
    
    useEffect(() => {
        // let timeoutId: NodeJS.Timeout | null = null;
        
        const routeLogic = async () => {
            if (pathname?.startsWith("/room/") && roomRoutId) {
                if (authState.isAuthenticated) {
                    // Check if we already have the correct room data loaded
                    const hasCorrectRoom = roomState.haveRoom && roomState.roomId === roomRoutId;
                    
                    if (!hasCorrectRoom) {
                        setIsRoomLoading(true);
                        setSkeleton(true);
                        try {
                            await fetchRoomDetailsByRoomId(roomRoutId as string);
                            // Wait for Redux state to update and DOM to render
                            await new Promise(resolve => setTimeout(resolve, 250));
                        } catch (error) {
                            // TODO: Notify User: Handle this error gracefully
                            console.error("Error fetching room details:", error);
                            router.replace("/");
                            setIsRoomLoading(false);
                            setSkeleton(false);
                            return;
                        }
                    }
                    
                    // Use a timeout to ensure smooth transition after room is loaded
                    // Check again if room is loaded before hiding skeleton
                    if (roomState.haveRoom && roomState.roomId === roomRoutId) {
                        setIsRoomLoading(false);
                        setSkeleton(false);
                    }
                    // timeoutId = setTimeout(() => {
                        
                    // }, 150);
                } else {
                    // Redirect to login if not authenticated, preserving intended destination
                    const queryString =
                        typeof window !== "undefined" ? window.location.search : "";
                    const redirectPath = `${pathname || "/"}` + queryString;
                    router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                    setIsRoomLoading(false);
                    setSkeleton(false);
                }
            } else {
                setIsRoomLoading(false);
                setSkeleton(false);
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
    const publicRoutes = ["/", "/login", "/signup", "/stream", "/sync"];
    const isPublicRoute = pathname && publicRoutes.includes(pathname);
    const isRoomRoute = pathname?.startsWith("/room/");
    
    // Show skeleton if:
    // 1. We're on a room route
    // 2. And either: loading states are true, skeleton state is true, or room data is not ready
    const shouldShowSkeleton = isRoomRoute && 
                                !isPublicRoute &&
                                (authState.loading || 
                                 skeleton || 
                                 isRoomLoading ||
                                 (!roomState.haveRoom || (roomRoutId && roomState.roomId !== roomRoutId)));
    
    return (
        <>
            {shouldShowSkeleton ? (
                <div className="animate-fade-in">
                    <Skeleton
                        auth={authState.isAuthenticated}
                        type="room"
                        showAuthOverlay={false}
                    />
                </div>
            ) : (
                <div className="animate-fade-in">
                    {children}
                </div>
            )}
        </>
    );
}