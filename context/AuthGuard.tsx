"use client";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname, useParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import type { RootState } from "@/lib/store";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { checkUserToken, logout, setLoading as setAuthLoading } from "@/lib/store/slices/authSlice";
import { exitRoom, setLoading as setRoomLoading, setRoom } from "@/lib/store/slices/roomSlice";
import { OnboardStep } from "@/types/storeTypes";
import { useVerifyTokenMutation, useCheckTokenQuery } from "@/lib/store/api/authApi";
import { useCreateRoomMutation, useGetMyRoomMutation, useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { Skeleton } from "@/components";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
    // const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const authId = useSelector((state: RootState) => state.auth.user?.id);
    const [verifyToken] = useVerifyTokenMutation();
    const [getMyRoom] = useGetMyRoomMutation();
    const [createRoomApi] = useCreateRoomMutation();
    const [getRoomByRoomId] = useGetRoomByRoomIdMutation();
    // const haveRoom = useSelector((state: RootState) => state.room.haveRoom);
    // const refer = useSelector((state: RootState) => state.room.refer);
    // const roomId = useSelector((state: RootState) => state.room.roomId);
    // const roomLoading = useSelector((state: RootState) => state.room.loading);
    // const authLoading = useSelector((state: RootState) => state.auth.loading);
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { roomId: roomRoutId } = useParams();

    // useEffect(() => {
    //     // console.log(pathname, roomRoutId)
    //     const refreshRoomDetails = async () => {
    //         // console.log("Refreshing room details...");
    //         try {
    //             // console.log("Calling room details...");
    //             const roomResponse = await getMyRoom().unwrap();
    //             if (roomResponse.success) {
    //                 const data = roomResponse.data;
    //                 if (Object.keys(data).length){
    //                     // console.log("succefully get room info...");
    //                     const result = { ...roomResponse, authId }
    //                     dispatch(setRoom(result));
    //                 }
    //                 else {
    //                     // console.log("No room found for the user, exiting room...");
    //                     dispatch(exitRoom());}
    //             } else {
    //                 // console.error("Failed to get room details, exiting room...");
    //                 dispatch(exitRoom());
    //             }
    //         } catch (error) {
    //             // console.error("Error fetching room details:", error);
    //             dispatch(exitRoom());
    //         }
    //     }
    //     const refreshAuthState = async () => {
    //         // console.log("Refreshing auth state...");
    //         if (authState.isAuthenticated) {
    //             dispatch(setAuthLoading(true));
    //             try {
    //                 // console.log("Verifying token...");
    //                 const response = await verifyToken().unwrap();
    //                 if (!response.success) {
    //                     // console.error("Token verification failed, logging out...");
    //                     dispatch(logout());
    //                 } else {
    //                     // console.log("Token verified successfully, checking room details...");
    //                     dispatch(setAuthLoading(false));
    //                     await refreshRoomDetails();
    //                 }
    //             } catch (error) {
    //                 // console.error("Error verifying token:", error);
    //                 dispatch(setAuthLoading(false));
    //                 dispatch(logout());
    //             }
    //         } else {
    //             dispatch(setRoomLoading(false));
    //             dispatch(setAuthLoading(false));
    //             // console.log("User is not authenticated");
    //         }
    //     }
    //     dispatch(setRoomLoading(true));
    //     refreshAuthState();
    // }, [authState.isAuthenticated, dispatch, verifyToken]);

    // useEffect(() => {
    //     const intialRouting = async () => {
    //         // console.log("Initial routing based on authentication and room state...", { isAuthenticated, haveRoom, roomLoading, roomId });
    //         if (authState.isAuthenticated) {
    //             // console.log("User is authenticated, checking room state...");
    //             // If authenticated and have room, redirect to the room page
    //             if (roomState.haveRoom && !roomState.loading){
    //                 // console.log("User has a room, redirecting to room page...");
    //                 router.replace(`/room/${roomState.roomId}`); // Change to your desired page
    //             }
    //             if (pathname === `/room/${roomState.roomId}` && roomState.loading) {
    //                 // console.log("Room is loading, staying on the current page...");
    //             }

    //             if (!roomState.haveRoom && !roomState.loading) {
    //                 // TODO: Check whether the user has references to other links
    //                 // console.log("User is authenticated but has no room, redirecting to source selection...");
    //                 if (roomState.refer) {
    //                     dispatch(setRoomLoading(true));
    //                     const response = await createRoomApi({ urls: roomState.urls, sourceType: roomState.sourceType! }).unwrap();
    //                     if (response.success) {
    //                         const roomWithAuth = { ...response, authId: authState.user!.id };
    //                         dispatch(setRoom(roomWithAuth));
    //                     } else {
    //                         dispatch(setRoomLoading(false));
    //                         router.replace("/");
    //                         dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //                     }
    //                 } else {
    //                     router.replace("/");
    //                     dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //                 }
    //             }
    //         }
    //         else {
    //             if (roomState.refer) {

    //             } else {
    //                 // console.log("User is not authenticated, redirecting to home page...");
    //                 router.replace("/");
    //                 // If authenticated but no room, redirect to source selection page
    //                 dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //             }
    //         }
    //     }
    //     intialRouting();
    // }, [authState.isAuthenticated, router, dispatch, pathname, roomState.haveRoom, roomState.loading, roomState.roomId, roomState.refer, roomState.urls, roomState.sourceType, createRoomApi, authState.user?.id]);
// TODO: ---------
//     useEffect(() => {
//         // console.log(pathname, roomRoutId)
//         const refreshRoomDetails = async () => {
//             // console.log("Refreshing room details...");
//             try {
//                 // console.log("Calling room details...");
//                 const roomResponse = await getMyRoom().unwrap();
//                 if (roomResponse.success) {
//                     const data = roomResponse.data;
//                     if (Object.keys(data).length) {
//                         // console.log("succefully get room info...");
//                         const result = { ...roomResponse, authId }
//                         dispatch(setRoom(result));
//                     }
//                     else {
//                         // console.log("No room found for the user, exiting room...");
//                         dispatch(exitRoom());
//                     }
//                 } else {
//                     // console.error("Failed to get room details, exiting room...");
//                     dispatch(exitRoom());
//                 }
//             } catch (error) {
//                 // console.error("Error fetching room details:", error);
//                 dispatch(exitRoom());
//             }
//         }
//         const refreshAuthState = async () => {
//             // console.log("Refreshing auth state...");
//             if (authState.isAuthenticated) {
//                 dispatch(setAuthLoading(true));
//                 try {
//                     // console.log("Verifying token...");
//                     const response = await verifyToken().unwrap();
//                     if (!response.success) {
//                         // console.error("Token verification failed, logging out...");
//                         dispatch(logout());
//                     } else {
//                         // console.log("Token verified successfully, checking room details...");
//                         dispatch(setAuthLoading(false));
//                         await refreshRoomDetails();
//                     }
//                 } catch (error) {
//                     // console.error("Error verifying token:", error);
//                     dispatch(setAuthLoading(false));
//                     dispatch(logout());
//                 }
//             } else {
//                 dispatch(setRoomLoading(false));
//                 dispatch(setAuthLoading(false));
//                 // console.log("User is not authenticated");
//             }
//         }
//         dispatch(setRoomLoading(true));
//         refreshAuthState();
//     }, [authState.isAuthenticated, dispatch, verifyToken]);

//     useEffect(() => {
//         const intialRouting = async () => {
//             // if (pathname !== `/room/${roomRoutId}`) {
//             if (pathname === "/") {
//                 console.log("pathname is ", pathname);
//                 if (authState.isAuthenticated) {
//                     /**
//                      * TODO: If user is authenticated, check if they have a room.
//                      *  If they have room redirect to room page.
//                      *  If they don't have room, 
//                      *                   Check if they have refer information.
//                      *                  If they have refer information, call create room API with refer information.
//                      *                 If they don't have refer information, redirect to source selection page.
//                      */
//                     if (roomState.haveRoom) {
//                         router.replace(`/room/${roomState.roomId}`);                        
//                     } else {
//                         if (roomState.refer) {
//                             dispatch(setRoomLoading(true));
//                             const response = await createRoomApi({ urls: roomState.urls, sourceType: roomState.sourceType! }).unwrap();
//                             if (response.success) {
//                                 const roomWithAuth = { ...response, authId: authState.user!.id };
//                                 dispatch(setRoom(roomWithAuth));
//                             } else {
//                                 dispatch(setRoomLoading(false));
//                                 // router.replace("/");
//                                 dispatch(changeStep(OnboardStep.SELECT_SOURCE));
//                             }
//                         } else {
//                             // router.replace("/");
//                             dispatch(changeStep(OnboardStep.SELECT_SOURCE));
//                         }
//                     }

//                 } else {
//                     /**
//                      * TODO: Redirect to source selection page.
//                      * If they have refer information, redirect to auth step.
//                      */
//                     if (!roomState.refer) {
//                         dispatch(changeStep(OnboardStep.SELECT_SOURCE));
//                     }
//                 }
//                 return;
//             }

//             if (pathname === `/room/${roomRoutId}`) {
//                 console.log("pathname is /room/${roomRoutId}")
//                 if (authState.isAuthenticated) {
//                     console.log("User is authenticated");
//                     /**
//                      * TODO: If user is authenticated and on room page, check if they have a room.
//                      *  If they have room, check roomRoutId is equal to roomstate.roomId.
//                      *  Then the auth is user is host
//                      *  If they don't have room, check if they have refer information.
//                      */
//                     if (roomState.haveRoom) { 
//                         console.log("Have ROOM");
//                         if (roomState.roomId !== roomRoutId) {
//                             console.log("Room ID does not match, redirecting to the correct room page...");
//                             // This will be the case when user is not host and want to join the room.
//                             await fetchRoomDetailsByRoomId(roomRoutId as string)
//                         } else {
//                             // console.log("User is on the correct room page, staying on the current page...");
//                             // dispatch(setRoomLoading(false));
//                             // User is host and on the correct room page, so stay on the current page.
//                         }
//                     } else {
//                         // Definetly user is not host and want to join the room.
//                         // User want to join the room
//                         try {
//                             await fetchRoomDetailsByRoomId(roomRoutId as string)
//                         } catch (error) {
//                             // TODO: This is the case when room is not found and user is not host so it wont able to join the room.
//                             // dispatch(exitRoom());
//                             router.replace("/");
//                             dispatch(changeStep(OnboardStep.SELECT_SOURCE));
//                         }

//                     }
//                         // console.log("User has a room, staying on the current page...");
//                 } else {
//                     /**
//                      * TODO: Redirect to source selection page.
//                     */
//                    dispatch(changeStep(OnboardStep.SELECT_SOURCE));
//                    router.replace("/");
//                 }
//                 return;
//             }

//             // TODO: Default case for other paths
//             // if (authState.isAuthenticated) {

//             // } else {
//             //     if (roomState.refer) {

//             //     } else {
//             //         // console.log("User is not authenticated, redirecting to home page...");
//             //         router.replace("/");
//             //         // If authenticated but no room, redirect to source selection page
//             //         dispatch(changeStep(OnboardStep.SELECT_SOURCE));
//             //     }
//             // }
//         }
//         if (!roomState.loading) 
//             intialRouting();
//     }, [
//         authState.isAuthenticated,
//         authState.user?.id,
//         router,
//         dispatch,
//         pathname,
//         roomState.haveRoom,
//         roomState.roomId,
//         roomState.refer,
//         roomState.urls,
//         roomState.sourceType,
//         roomState.loading,
//         createRoomApi
//     ]);

//     const fetchRoomDetailsByRoomId = async (roomId: string) => {
//         const response = await getRoomByRoomId(roomId).unwrap();
//         console.log("fetchRoomDetailsByRoomId", response, roomId);
//         if (response.success) {
//             console.log("Room details fetched successfully:", response.data);
//             const roomWithAuth = { ...response, authId: authState.user!.id };
//             dispatch(setRoom(roomWithAuth));
//             if (roomWithAuth.data.user_id === authState.user!.id) {
//                 // User is the host of the room
//                 // dispatch(setRoom(roomWithAuth));
//             } else {
//                 // User is not the host, so they are joining the room
//                 // dispatch(setRoom(roomWithAuth));
//             }
//         }
//     }

//     return <>{roomState.loading || authState.loading ? <Skeleton type="room"/> : children}</>;
// }

// TODO: ------------- 

    // useEffect(() => {
    //     console.log('a1')
    //     const verifyAndFetchRoom = async () => {
    //         dispatch(setRoomLoading(true));

    //         if (!authState.isAuthenticated) {
    //             dispatch(setRoomLoading(false));
    //             dispatch(setAuthLoading(false));
    //             return;
    //         }

    //         dispatch(setAuthLoading(true));
    //         try {
    //             console.log('a2')
    //             const response = await verifyToken().unwrap();
    //             if (!response.success) {
    //                 dispatch(logout());
    //             } else {
    //                 console.log('a3')
    //                 dispatch(setAuthLoading(false));
    //                 const roomResponse = await getMyRoom().unwrap();
    //                 if (roomResponse.success && Object.keys(roomResponse.data).length) {
    //                     console.log('a4')
    //                     const roomWithAuth = { ...roomResponse, authId: authState.user!.id };
    //                     dispatch(setRoom(roomWithAuth));
    //                 } else {
    //                     console.log('a5')
    //                     dispatch(exitRoom('join'));
    //                 }
    //             }
    //         } catch (error) {
    //             dispatch(setAuthLoading(false));
    //             dispatch(logout());
    //         }
    //         dispatch(setRoomLoading(false));
    //     };

    //     verifyAndFetchRoom();
    // }, [authState.isAuthenticated, verifyToken, dispatch]);

    // useEffect(() => {
    //     const routeLogic = async () => {
    //         console.log(1 )
    //         if (roomState.loading || authState.loading) return;
    //         console.log(2 )
    //         if (pathname === "/") {
    //             console.log(3)
    //             if (authState.isAuthenticated) {
    //                 console.log(4)
    //                 if (roomState.haveRoom) {
    //                     console.log(5)
    //                     router.replace(`/room/${roomState.roomId}`);
    //                 } else if (roomState.refer) {
    //                     console.log(6)
    //                     dispatch(setRoomLoading(true));
    //                     try {
    //                         const response = await createRoomApi({
    //                             urls: roomState.urls,
    //                             sourceType: roomState.sourceType!,
    //                         }).unwrap();
    //                         if (response.success) {
    //                             const roomWithAuth = { ...response, authId: authState.user!.id };
    //                             console.log(7)
    //                             dispatch(setRoom(roomWithAuth));
    //                             router.replace(`/room/${response.data.room_id}`);
    //                         } else {
    //                             dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //                         }
    //                     } catch (err) {
    //                         dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //                     }
    //                     dispatch(setRoomLoading(false));
    //                 } else {
    //                     dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //                 }
    //             } else {
    //                 dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //             }
    //         } else if (pathname === `/room/${roomRoutId}`) {
    //             if (authState.isAuthenticated) {
    //                 if (roomState.haveRoom) {
    //                     if (roomState.roomId !== roomRoutId) {
    //                         console.log(8)
    //                         await fetchRoomDetailsByRoomId(roomRoutId as string);
    //                     }
    //                 } else {
    //                     try {
    //                         console.log(9)
    //                         roomState.event === 'join' && await fetchRoomDetailsByRoomId(roomRoutId as string);
    //                     } catch (err) {
    //                         router.replace("/");
    //                         dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //                     }
    //                 }
    //             } else {
    //                 router.replace("/");
    //                 dispatch(changeStep(OnboardStep.SELECT_SOURCE));
    //             }
    //         }
    //     };

    //     routeLogic();
    // }, [
    //     pathname,
    //     roomRoutId,
    //     roomState.loading,
    //     roomState.haveRoom,
    //     roomState.roomId,
    //     roomState.refer,
    //     roomState.urls,
    //     roomState.sourceType,
    //     authState.isAuthenticated,
    //     authState.loading,
    //     authState.user?.id,
    //     dispatch,
    //     router,
    // ]);

    // const fetchRoomDetailsByRoomId = async (roomId: string) => {
    //     try {
    //         const response = await getRoomByRoomId(roomId).unwrap();
    //         if (response.success) {
    //             const roomWithAuth = { ...response, authId: authState.user!.id };
    //             dispatch(setRoom(roomWithAuth));
    //         } else {
    //             throw new Error("Room fetch failed");
    //         }
    //     } catch (error) {
    //         console.error("Failed to fetch room details:", error);
    //         throw error;
    //     }
    // };

    // TODO: Another test

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

    const refreshRoomDetails = async () => {
        try {
            const roomResponse = await getMyRoom().unwrap();
            if (roomResponse.success) {
                const data = roomResponse.data;
                if (Object.keys(data).length) {
                    const result = { ...roomResponse, authId }
                    // dispatch(setRoom(result));
                    return result;
                }
                else {
                    dispatch(exitRoom());
                    return null;
                }
            } else {
                dispatch(exitRoom());
                return null;
            }
        } catch (error) {
            dispatch(exitRoom());
            return null;
        }
    }

    const createRoomWithRefer = async ({ urls, sourceType }: { urls?: string[], sourceType: 'file' | 'url' }) => {
        try {
            const response = await createRoomApi({ urls: roomState.urls, sourceType: roomState.sourceType! }).unwrap();
            if (response.success) {
                const roomWithAuth = { ...response, authId: authState.user!.id };
                // dispatch(setRoom(roomWithAuth));
                return roomWithAuth;
            } else {
                dispatch(changeStep(OnboardStep.SELECT_SOURCE));
                return null;
            }
        } catch (err) {
            dispatch(changeStep(OnboardStep.SELECT_SOURCE));
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
    
    useEffect(() => { 
        refreshAuthState()
    }, [])

    useEffect(() => {
        if (pathname === "/" && authState.isAuthenticated) {
            refreshRoomDetails()
        }
    }, [pathname, authState.isAuthenticated])

    useEffect(() => {
        
        const routeLogic = async () => {
            // await refreshAuthState();

            if (pathname === "/") {
                if (authState.isAuthenticated) {
                    // const result = await refreshRoomDetails();
                    // if (result) {
                    //     return dispatch(setRoom(result));
                    // }
                    if (roomState.haveRoom) {
                        if (roomState.roomId || roomState.roomId !== 'null') {
                            // console.log('sadasda', roomState.roomId, typeof roomState.roomId)
                            router.replace(`/room/${roomState.roomId}`);
                        }
                    } else {
                        
                        if (roomState.refer) {
                            const result = await createRoomWithRefer({ urls: roomState.urls, sourceType: roomState.sourceType! });
                            if (result) {
                                return dispatch(setRoom(result));
                            }
                            // console.log('sadasda 2', roomState.roomId, typeof roomState.roomId)
                            router.replace(`/room/${roomState.roomId}`);
                        } else {
                            // console.log('a6')
                            dispatch(changeStep(OnboardStep.SELECT_SOURCE));
                        }
                    }
                } else {
                    if (roomState.refer) {
                        // console.log('a7')
                        // await createRoomWithRefer({ urls: roomState.urls, sourceType: roomState.sourceType! });
                        // router.replace(`/room/${roomState.roomId}`);
                        dispatch(changeStep(OnboardStep.AUTH_STEP));
                    } else {
                        // console.log('a7')
                        dispatch(changeStep(OnboardStep.SELECT_SOURCE));
                    }
                }
            } 
            // else if (pathname === `/room/${roomRoutId}`) {
            //     if (authState.isAuthenticated) {
            //         await fetchRoomDetailsByRoomId(roomRoutId as string);

            //     } else {
            //         // TODO: Open modals
            //     }
            // }
        };
        routeLogic();
    }, [
        // pathname,
        // roomRoutId,
        // roomState.loading,
        // roomState.haveRoom,
        // roomState.roomId,
        // roomState.refer,
        // roomState.urls,
        // roomState.sourceType,
        // authState.isAuthenticated,
        // authState.loading,
        // authState.user?.id,
        // dispatch,
        // router,
        pathname,
        roomRoutId,
        roomState.haveRoom,
        roomState.refer,
        roomState.urls,
        roomState.sourceType,
        authState.isAuthenticated,
        // authState.user?.id,
    ]);

    const [skeleton, setSkeleton] = useState<boolean>(false);
    useEffect(() => {
        const routeLogic = async () => {
            // console.log(1)
            if (pathname === `/room/${roomRoutId}`) {
                setSkeleton(true);
                // console.log(2)
                if (authState.isAuthenticated) {
                    // console.log(3)
                    try {
                        await fetchRoomDetailsByRoomId(roomRoutId as string);
                    } catch (error) {

                        router.replace("/");
                        setSkeleton(false);
                    }
                    setSkeleton(false);
                } else {
                    // TODO: Open modals
                }
            }
        };
        routeLogic();
    }, [
        pathname,
        roomRoutId,
        authState.isAuthenticated,
    ]);

    
    // Don't show skeleton on home page or auth pages
    const shouldShowSkeleton = (roomState.loading || authState.loading || skeleton) && 
                                pathname !== "/" && 
                                pathname !== "/login" && 
                                pathname !== "/signup" &&
                                !pathname.startsWith("/login") &&
                                !pathname.startsWith("/signup");
    
    return <>{shouldShowSkeleton ? <Skeleton auth={authState.isAuthenticated} type="room" /> : children}</>
}