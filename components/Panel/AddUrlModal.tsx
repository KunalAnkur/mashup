import React from "react";
import { LuPlus } from "react-icons/lu";
import { Modal, ModalHeader } from "../UI";

interface AddUrlModalProps {
    isOpen: boolean;
    urlInput: string;
    urlError: string;
    isAdding: boolean;
    onClose: () => void;
    onUrlInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUrlInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onAddUrl: () => void;
}

export const AddUrlModal: React.FC<AddUrlModalProps> = ({
    isOpen,
    urlInput,
    urlError,
    isAdding,
    onClose,
    onUrlInputChange,
    onUrlInputKeyDown,
    onAddUrl,
}) => {
    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            overlayClassName="z-50"
            panelClassName="max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#1f1f23] to-[#27272a] p-6 shadow-xl"
        >
            <div className="relative w-full">
                <ModalHeader
                    className="px-0 pt-0 pb-0 mb-6"
                    icon={
                        <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-2 rounded-lg">
                            <LuPlus className="text-white text-lg" />
                        </div>
                    }
                    title="Add Video URL"
                    titleClassName="text-xl"
                    onClose={onClose}
                    closeButtonClassName="rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
                />

                {/* Input Section */}
                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Paste your video URL here"
                            value={urlInput}
                            onChange={onUrlInputChange}
                            onKeyDown={onUrlInputKeyDown}
                            className="w-full rounded-xl bg-white/5 text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500 border border-white/10"
                            disabled={isAdding}
                            autoFocus
                        />
                        {urlError && (
                            <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                                <span>⚠️</span>
                                <span>{urlError}</span>
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={isAdding}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onAddUrl}
                            disabled={isAdding || !urlInput.trim() || !!urlError}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAdding ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Adding...</span>
                                </>
                            ) : (
                                <>
                                    <LuPlus size={16} />
                                    <span>Add URL</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
