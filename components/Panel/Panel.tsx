"use client"

import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { Input, Logo } from "../UI";
import AvatarDropdown from "../UI/AvatarDropdown";
import { MdContentCopy } from "react-icons/md";
import { Tabs } from "@/types/roomTypes";
import ChatTab from "./ChatTab";
import PeopleTab from "./PeopleTab";
import SourceTab from "./SourceTab";
import SettingTab from "./SettingTab";
import { RootState } from "@/lib/store";
import { setUser } from "@/lib/store/slices/authSlice";

const TABS = Object.values(Tabs);

const Panel = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState<Tabs>(Tabs.CHAT);
    const roomUrl = "https://movmash.com/room/3wJz21";
    
    // Get user data from Redux store (for room URL display)
    const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
    
    // Debug authentication state
    console.log("Panel - Auth state:", { isAuthenticated, user, token: token ? "Token exists" : "No token" });
    const renderTabContent = (tab: Tabs) => {
        switch (tab) {
            case Tabs.PEOPLE:
                return <PeopleTab />
            case Tabs.SOURCE:
                return <SourceTab />
            case Tabs.SETTINGS:
                return <SettingTab />
            default:
                return <ChatTab />
        }
    }
    return (
        <div className="flex flex-col h-full w-full p-4 gap-3 bg-[#191919]">
            {/* Header */}
            <div className="flex items-center gap-3">
                {/* Logo */}
                <Logo showText={false} />
                {/* Room Link */}
                <div className="flex-1 flex items-center bg-zinc-900 justify-between gap-3 rounded-lg px-3 py-2">
                    <Input className="text-gray-100 w-full text-sm font-semibold" defaultValue={roomUrl} />
                    <MdContentCopy size={22} className=" text-gray-400 cursor-pointer hover:text-yellow-400" />
                    {/* <BsDot className="text-green-400 text-2xl ml-2" /> */}
                </div>
                {/* Debug info */}
                <div className="text-xs text-gray-400">
                  Auth: {isAuthenticated ? 'Yes' : 'No'} | 
                  User: {user?.name || user?.username || 'None'} |
                  Token: {token ? 'Yes' : 'No'}
                </div>
                {/* Test login button */}
                {!isAuthenticated && (
                  <button 
                    onClick={() => {
                      console.log("Test login clicked");
                      dispatch(setUser({
                        data: {
                          user: {
                            id: "test-user",
                            email: "test@example.com",
                            name: "Test User",
                            username: "testuser",
                            session_id: "test-session"
                          },
                          token: "test-token"
                        },
                        success: true,
                        status: "success",
                        message: "Test login"
                      }));
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                  >
                    Test Login
                  </button>
                )}
                {/* Avatar with dropdown */}
                <AvatarDropdown size={40} />
            </div>

            {/* Tabs */}
            <div className="flex bg-[#000000] p-2 rounded-lg justify-between items-center gap-2 overflow-x-auto hide-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition
                            ${activeTab === tab
                                ? "bg-zinc-800 text-white shadow"
                                : " text-gray-400 hover:bg-zinc-800"}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto bg-[#191919] flex-1">
                {renderTabContent(activeTab)}
            </div>
        </div>
    );
};

export default Panel;