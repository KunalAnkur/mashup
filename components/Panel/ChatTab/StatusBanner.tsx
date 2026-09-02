import { chatStatusBannerBaseClass, chatStatusBannerRowClass } from "./styles";

interface StatusBannerProps {
  type: "connecting" | "loading";
  message: string;
}

export const StatusBanner = ({ type, message }: StatusBannerProps) => {
  const isConnecting = type === "connecting";

  return (
    <div className={chatStatusBannerBaseClass}>
      <div className={chatStatusBannerRowClass}>
        <div className="relative">
          <div
            className={`absolute inset-0 bg-white/20 rounded-full ${
              isConnecting ? "animate-ping" : "animate-pulse"
            }`}
          ></div>
          <div className="relative w-1.5 h-1.5 md:w-2 md:h-2 bg-white/50 rounded-full"></div>
        </div>
        <p className="text-white/55 text-[10px] md:text-xs font-medium">{message}</p>
      </div>
    </div>
  );
};
