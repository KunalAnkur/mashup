import { Avatar } from "@/components/UI";

type Props = {
  hostName: string;
  avatarUrl: string;
  playingAt: string;
  size: number;
};

const HostDetails = ({ hostName, avatarUrl, playingAt, size }: Props) => {
  return (
    <div className="flex gap-2 items-center justify-start text-white">
      <Avatar url={avatarUrl} alt={hostName} size={size} />
      <div className="flex flex-col text-left ">
        <h1 className="font-semibold text-lg">{hostName}&apos;s Party</h1>
        <span className="text-[10px]">playing at {playingAt}</span>
      </div>
    </div>
  );
};

export default HostDetails;
