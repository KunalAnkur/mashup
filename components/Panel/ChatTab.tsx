"use client"

import { useDispatch } from "react-redux";
import { useState } from "react";
import { Avatar, Button, Input, Logo } from "../UI";
import { FaUserCircle } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import { BsDot } from "react-icons/bs";
import { FaSmile, FaSadTear, FaLaughSquint, FaSurprise, FaHeart, FaGrinHearts } from "react-icons/fa";

const TABS = ["Chat", "People", "Videos", "Settings"];

const ChatTab = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState("Chat");
    const roomUrl = "https://movmash.com/room/3wJz21";
    const messages = [
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-sky-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-sky-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-sky-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-sky-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-sky-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-sky-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-sky-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
        { user: "ankurkunal", text: "when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", color: "text-red-400" },
    ];

    return (
        <div className="flex flex-col h-full w-full gap-4">
            {/* Video Area ....  */}
            <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-[#303030] rounded-xl flex items-center justify-center h-24 text-gray-200 font-bold text-lg">
                        Video
                    </div>
                ))}
            </div>
            {/* Chat box area ... */}
            <div className="flex-1 flex flex-col gap-2 bg-[#303030] rounded-xl p-4 overflow-y-auto">
                {messages.map((msg, i) => (
                    <div key={i} className="flex items-start">
                        <span className={`mr-2 font-bold text-xs ${msg.color}`}>{msg.user}:</span>
                        <span className="text-gray-200 text-xs">{msg.text}</span>
                    </div>
                ))}
            </div>

            {/* Emoji Bar & Input (only for Chat tab) */}
            <div className="flex gap-2 bg-[#303030] p-3 w-full rounded-xl overflow-x-auto">
                <FaSmile size={30} className="text-2xl text-yellow-400 cursor-pointer" />
                <FaSadTear size={30} className="text-2xl text-blue-400 cursor-pointer" />
                <FaLaughSquint size={30} className="text-2xl text-yellow-300 cursor-pointer" />
                <FaSurprise size={30} className="text-2xl text-pink-400 cursor-pointer" />
                <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
                <FaGrinHearts size={30} className="text-2xl text-pink-500 cursor-pointer" />
                <FaSurprise size={30} className="text-2xl text-pink-400 cursor-pointer" />
                <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
                <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
                <FaHeart size={30} className="text-2xl text-red-500 cursor-pointer" />
            </div>

            {/* Text Input */}
            <div className="flex items-center gap-2 bg-[#303030] rounded-lg px-3 py-2">
                <input
                    type="text"
                    placeholder="Type something ..."
                    className="flex-1 bg-transparent outline-none text-gray-100 text-sm"
                />
                <div className="flex gap-1">
                    <span className="w-3 h-3 rounded-full bg-zinc-700" />
                    <span className="w-3 h-3 rounded-full bg-zinc-700" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                </div>
            </div>
        </div>
    );
};

export default ChatTab;