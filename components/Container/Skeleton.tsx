import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { AuthWrapper } from '../Onboard';

const baseColor = "#5a5a5a";
const highlightColor = "#696969";

const SkeletonRoom = ({ isAuthenticated }: { isAuthenticated: boolean }) => (
<>
    <div className="flex h-screen bg-[#030712] select-none">
        {/* Main video area skeleton */}
        <div className="flex-1 flex items-center justify-center bg-black h-full">
            <Skeleton height="70%" width="80%" borderRadius={16} baseColor={baseColor} highlightColor={highlightColor} />
        </div>

        {/* Right panel skeleton */}
        <div className="w-[30%] min-w-[320px] max-w-[420px] h-full flex flex-col p-4 gap-4 bg-[#191919]">
            {/* Header */}
            <div className="flex justify-between items-end gap-3 mb-2">
                <Skeleton circle width={40} height={40} baseColor={baseColor} highlightColor={highlightColor} />
                <Skeleton height={32} width="60%" borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                <Skeleton circle width={40} height={40} baseColor={baseColor} highlightColor={highlightColor} />
            </div>
            {/* Tabs */}
            <div className="flex gap-2 mb-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} width={70} height={32} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                ))}
            </div>
            {/* Video grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} height={96} borderRadius={12} baseColor={baseColor} highlightColor={highlightColor} />
                ))}
            </div>
            {/* Chat messages */}
            <div className="flex-1 flex flex-col gap-2 bg-[#303030] rounded-xl p-4 overflow-y-auto mb-4">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} height={18} width={`${70 + Math.random() * 30}%`} baseColor={baseColor} highlightColor={highlightColor} />
                ))}
            </div>
            {/* Emoji bar */}
            <div className="flex gap-2 bg-[#303030] p-3 w-full rounded-xl overflow-x-auto mb-2">
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} circle width={32} height={32} baseColor={baseColor} highlightColor={highlightColor} />
                ))}
            </div>
            {/* Input */}
            <div className="flex items-center gap-2 bg-[#303030] rounded-lg px-3 py-2">
                <Skeleton height={32} width="80%" borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                <div className="flex gap-1">
                    <Skeleton circle width={12} height={12} baseColor={baseColor} highlightColor={highlightColor} />
                    <Skeleton circle width={12} height={12} baseColor={baseColor} highlightColor={highlightColor} />
                    <Skeleton circle width={12} height={12} baseColor={baseColor} highlightColor={highlightColor} />
                </div>
            </div>
        </div>
    </div>
        {!isAuthenticated &&
            <div className="absolute left-1/2 bottom-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-2xl p-5 py-10 bg-[#191919] rounded-lg flex items-center justify-center">
                <AuthWrapper isModel={true} />
            </div>
    }
</>
);

const SkeletonOnboard = () => (
    <div className="flex h-screen w-screen">
        {/* Left background image skeleton */}
        <div className="w-1/2 h-full">
            <Skeleton height="100%" width="100%" baseColor={baseColor} highlightColor={highlightColor} />
        </div>
        {/* Right panel skeleton */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center bg-[#19191b]">
            <div className="flex flex-col items-center gap-8 w-full max-w-md">
                {/* Create Party Title */}
                <Skeleton width={180} height={32} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                {/* Subtitle */}
                <Skeleton width={260} height={18} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                {/* Device/URL buttons */}
                <div className="flex gap-6">
                    <Skeleton width={120} height={100} borderRadius={12} baseColor={baseColor} highlightColor={highlightColor} />
                    <Skeleton width={120} height={100} borderRadius={12} baseColor={baseColor} highlightColor={highlightColor} />
                </div>
                {/* Divider */}
                <Skeleton width={30} height={10} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                {/* Join Party Title */}
                <Skeleton width={120} height={24} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                {/* Join Party Subtitle */}
                <Skeleton width={220} height={16} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                {/* Room ID input and Join button */}
                {/* <div className="flex gap-4 w-full">
                    <Skeleton width="70%" height={40} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                    <Skeleton width={70} height={40} borderRadius={8} baseColor={baseColor} highlightColor={highlightColor} />
                </div> */}
            </div>
        </div>
    </div>
);

const SkeletonWrapper = ({ type = 'room', auth }: { type: 'room' | 'onboard', auth: boolean }) => {
    if (type === 'room') {
        return <SkeletonRoom isAuthenticated={auth} />;
    } else if (type === 'onboard') {
        return <SkeletonOnboard />;
    }
    return null;
}
export default SkeletonWrapper;