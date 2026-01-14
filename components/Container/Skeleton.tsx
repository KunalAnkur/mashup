import { AuthWrapper } from "../Onboard";

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:animate-[shimmer_1.8s_infinite]";

const glassCard =
  "bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl";

const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`bg-white/10 ${shimmer} ${className}`} />
);

type SkeletonRoomProps = {
  isAuthenticated: boolean;
  showAuthOverlay?: boolean;
};

const SkeletonRoom = ({
  isAuthenticated,
  showAuthOverlay = false,
}: SkeletonRoomProps) => (
  <>
    <div className="relative flex h-screen w-full bg-gradient-to-br from-[#05060b] via-[#0f1018] to-[#1a1034] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,_rgba(255,255,255,0.15)_1px,_transparent_1px)] [background-size:20px_20px]" />
      {/* Player area */}
      <div className="relative flex-1 flex flex-col gap-6 p-10">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-10 w-48 rounded-full" />
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <SkeletonBlock className="h-10 w-28 rounded-full" />
            <SkeletonBlock className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className={`${glassCard} relative flex-1 min-h-[70vh]`}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[inherit]" />
          <div className="relative flex h-full flex-col gap-6 p-8">
            <SkeletonBlock className="h-8 w-1/4 rounded-full" />
            <div className="flex-1 rounded-[18px] bg-black/40 border border-white/10">
              <div className="h-full w-full rounded-[inherit] bg-gradient-to-br from-purple-500/20 via-[#151423] to-black/60" />
            </div>
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-12 flex-1 rounded-full" />
              <SkeletonBlock className="h-12 w-12 rounded-full" />
              <SkeletonBlock className="h-12 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Panel area */}
      <aside className="relative h-full w-[360px] lg:w-[420px] border-l border-white/10 bg-black/30 backdrop-blur-3xl p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-32 rounded-full" />
              <SkeletonBlock className="h-3 w-24 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-24 rounded-full" />
        </div>

        <div className="flex gap-2">
          {["People", "Chat", "Media", "Settings"].map((label) => (
            <div
              key={label}
              className={`${glassCard} flex-1 py-3 text-center text-xs uppercase tracking-wide`}
            >
              <div className="flex flex-col gap-2 items-center">
                <SkeletonBlock className="h-2 w-10 rounded-full" />
                <SkeletonBlock className="h-1.5 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className={`${glassCard} flex-1 p-4 space-y-4`}>
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="h-3 w-1/3 rounded-full" />
                <SkeletonBlock className="h-3 w-3/4 rounded-full" />
                <SkeletonBlock className="h-3 w-1/2 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className={`${glassCard} p-4 flex items-center gap-3`}>
          <SkeletonBlock className="h-12 flex-1 rounded-full" />
          <SkeletonBlock className="h-12 w-12 rounded-full" />
        </div>
      </aside>
    </div>
    {!isAuthenticated && showAuthOverlay && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur">
        <div className={`${glassCard} w-full max-w-xl p-8`}>
          <AuthWrapper isModel={true} />
        </div>
      </div>
    )}
  </>
);

const SkeletonOnboard = () => (
  <div className="relative flex h-screen w-full bg-gradient-to-br from-[#060613] via-[#0d0f1c] to-[#1b0930] text-white overflow-hidden">
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,_rgba(255,255,255,0.2)_1px,_transparent_1px)] [background-size:24px_24px]" />
    <div className="relative flex w-full flex-col items-center justify-center gap-12 px-6">
      <div className="text-center space-y-4">
        <SkeletonBlock className="mx-auto h-6 w-48 rounded-full" />
        <SkeletonBlock className="mx-auto h-4 w-80 rounded-full" />
      </div>
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className={`${glassCard} p-6 flex flex-col gap-4 border-white/5`}
          >
            <SkeletonBlock className="h-6 w-32 rounded-full" />
            <SkeletonBlock className="h-4 w-48 rounded-full" />
            <SkeletonBlock className="h-4 w-40 rounded-full" />
            <div className="flex gap-3">
              <SkeletonBlock className="h-10 flex-1 rounded-full" />
              <SkeletonBlock className="h-10 flex-1 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${glassCard} flex items-center gap-4 px-6 py-4`}>
        <SkeletonBlock className="h-12 flex-1 rounded-full" />
        <SkeletonBlock className="h-12 w-28 rounded-full" />
      </div>
    </div>
  </div>
);

type SkeletonWrapperProps = {
  type: "room" | "onboard";
  auth: boolean;
  showAuthOverlay?: boolean;
};

const SkeletonWrapper = ({
  type = "room",
  auth,
  showAuthOverlay,
}: SkeletonWrapperProps) => {
  if (type === "room") {
    return (
      <SkeletonRoom
        isAuthenticated={auth}
        showAuthOverlay={showAuthOverlay}
      />
    );
  }
  if (type === "onboard") {
    return <SkeletonOnboard />;
  }
  return null;
};

export default SkeletonWrapper;