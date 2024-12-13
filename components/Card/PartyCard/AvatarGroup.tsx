import { Avatar } from "@/components/UI";

type Props = {
  avatars?: string[];
};

const AvatarGroup = ({ avatars }: Props) => {
  const testAvatars = [
    "https://img.freepik.com/free-vector/smiling-redhaired-boy-illustration_1308-175803.jpg?t=st=1733684954~exp=1733688554~hmac=e9ff778edf2b98f64ef4c545f38e54df1cbdd79eaf53e5e6b6060d0ee51c4251&w=996",
    "https://img.freepik.com/free-vector/smiling-redhaired-boy-illustration_1308-175803.jpg?t=st=1733684954~exp=1733688554~hmac=e9ff778edf2b98f64ef4c545f38e54df1cbdd79eaf53e5e6b6060d0ee51c4251&w=996",
    "https://img.freepik.com/free-vector/smiling-redhaired-boy-illustration_1308-175803.jpg?t=st=1733684954~exp=1733688554~hmac=e9ff778edf2b98f64ef4c545f38e54df1cbdd79eaf53e5e6b6060d0ee51c4251&w=996",
  ];

  const dataToRender = avatars || testAvatars;

  return (
    <div className="flex flex-col justify-end items-end pr-2 mt-1">
      <div className="flex -space-x-3 ">
        {dataToRender.map((url: string, index: number) => (
          <Avatar key={index} url={url} alt={`Avatar ${index + 1}`} size={30} />
        ))}
      </div>
      <span className="text-white text-[6px] text-right">are watching.</span>
    </div>
  );
};

export default AvatarGroup;
