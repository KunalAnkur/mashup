import { BiSearch } from "react-icons/bi";
import { Avatar, Input, Notification } from "../../components";

const AvatarContainer = () => {
  return (
    <div className="flex gap-2  items-center justify-center">
      <Input placeholder="Search" type="text" icon={<BiSearch />} />
      <Notification isNotified={true} />
      <Avatar
        alt="Avatar"
        size={70}
        url="https://pngtree.com/freepng/female-avatar-vector-icon_3725439.html"
      />
    </div>
  );
};

export default AvatarContainer;
