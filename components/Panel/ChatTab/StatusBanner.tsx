import { chatStatusBannerBaseClass, chatStatusBannerRowClass } from "./styles";

interface StatusBannerProps {
  type: "connecting" | "loading";
  message: string;
}

export const StatusBanner = ({ type, message }: StatusBannerProps) => {
  const isConnecting = type === "connecting";
  const colorClass = isConnecting ? "yellow" : "blue";

  return (
    <div className={`${chatStatusBannerBaseClass} border border-${colorClass}-500/20`}>
      <div className={chatStatusBannerRowClass}>
        <div className="relative">
          <div className={`absolute inset-0 bg-${colorClass}-400/20 rounded-full ${isConnecting ? "animate-ping" : "animate-pulse"}`}></div>
          <div className={`relative w-1.5 h-1.5 md:w-2 md:h-2 bg-${colorClass}-400 rounded-full`}></div>
        </div>
        <p className={`text-${colorClass}-300 text-[10px] md:text-xs font-medium`}>{message}</p>
      </div>
    </div>
  );
};

// Made with Bob
