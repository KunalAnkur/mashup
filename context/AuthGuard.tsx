"use client";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { use, useEffect } from "react";
import type { RootState } from "@/lib/store";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { checkUserToken, logout } from "@/lib/store/slices/authSlice";
import { exitRoom, setLoading as setRoomLoading, setRoom } from "@/lib/store/slices/roomSlice";
import { OnboardStep } from "@/types/storeTypes";
import { useVerifyTokenMutation, useCheckTokenQuery } from "@/lib/store/api/authApi";
import { useGetMyRoomMutation } from "@/lib/store/api/roomApi";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [verifyToken] = useVerifyTokenMutation();
    const [getMyRoom] = useGetMyRoomMutation();
    const haveRoom = useSelector((state: RootState) => state.room.haveRoom);
    const roomId = useSelector((state: RootState) => state.room.roomId);
    const roomLoading = useSelector((state: RootState) => state.room.loading);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const refreshRoomDetails = async () => {
            try {
                const roomResponse = await getMyRoom().unwrap();
                if (roomResponse.success) {
                    const data = roomResponse.data;
                    if (Object.keys(data).length)
                        dispatch(setRoom(roomResponse));
                    else 
                        dispatch(exitRoom());
                } else
                    dispatch(exitRoom());
            } catch (error) {
                dispatch(exitRoom());
            }
        }
        const refreshAuthState = async () => {
            if (isAuthenticated) {
                try {
                    const response = await verifyToken().unwrap();
                    if (!response.success) {
                        dispatch(logout());
                    } else {
                        await refreshRoomDetails();
                    }
                } catch (error) {
                    dispatch(logout());
                }
            }
        }
        setRoomLoading(true);
        refreshAuthState();
    }, [isAuthenticated, dispatch, verifyToken]);

    useEffect(() => {
        const intialRouting = () => {
            if (isAuthenticated) {
                // If authenticated and have room, redirect to the room page
                if (haveRoom && !roomLoading)
                    router.replace(`/room/${roomId}`); // Change to your desired page
                
                if (pathname === "/room/[roomId]" && roomLoading) {
                    
                }

                if (!haveRoom && !roomLoading) {
                    router.replace("/");
                    dispatch(changeStep(OnboardStep.SELECT_SOURCE));
                }
            } 
            else {
                router.replace("/");
                // If authenticated but no room, redirect to source selection page
                dispatch(changeStep(OnboardStep.SELECT_SOURCE));
            } 
        }
        intialRouting();
    }, [isAuthenticated, router, dispatch, haveRoom, pathname]);

    return <>{children}</>;
}