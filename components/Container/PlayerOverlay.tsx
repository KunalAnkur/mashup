"use client";

import { setPanelCollapsed } from "@/lib/store/slices/roomSlice";
import { useDispatch, useSelector } from "react-redux";

import { BsFillChatSquareFill } from "react-icons/bs";
import { FiChevronsLeft } from "react-icons/fi";
import { FiChevronsRight } from "react-icons/fi";

import { RootState } from "@/lib/store";

const PlayerOverlay = () => {
  const dispatch = useDispatch();
  const panelCollapsed = useSelector(
    (state: RootState) => state.room.settings.panelCollapsed
  );

  const handleTogglePanelExpand = () => {
    const newPanelCollapsedState = !panelCollapsed;
    dispatch(setPanelCollapsed({ panelCollapsed: newPanelCollapsedState }));
  };

  const handleToggleChat = () => {};

  return (
    <>
      <div className="z-20 flex justify-end absolute top-0 left-0 w-full h-20 p-4">
        <div className="flex gap-4">
          <span
            className="flex items-center backdrop-blur-sm gap-2 px-5 py-2.5 bg-gray-100/20 hover:bg-gray-100/40 rounded-full transition-all font-medium text-white text-sm"
            onClick={handleToggleChat}
          >
            <BsFillChatSquareFill className="w-4 h-4" />
          </span>
          <span
            className="flex items-center backdrop-blur-sm gap-2 px-5 py-2.5 bg-gray-100/20 hover:bg-gray-100/40 rounded-full transition-all font-medium text-white text-sm"
            onClick={handleTogglePanelExpand}
          >
            {panelCollapsed ? (
              <FiChevronsLeft size={20} />
            ) : (
              <FiChevronsRight size={20} />
            )}
          </span>
        </div>
      </div>
    </>
  );
};

export default PlayerOverlay;
