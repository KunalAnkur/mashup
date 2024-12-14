import { BiLogIn, BiSearch } from "react-icons/bi";
import { Avatar, Button, Input, Notification } from "..";

interface Props {
  isAuthenticated: boolean;
}
const AvatarContainer = ({ isAuthenticated }: Props) => {
  return (
    <div className="flex gap-2  items-center justify-center">
      <Input placeholder="Search" type="text" icon={<BiSearch />} />
      {isAuthenticated ? (
        <>
          <Notification isNotified={true} />
          <Avatar
            alt="Avatar"
            size={70}
            url="https://pngtree.com/freepng/female-avatar-vector-icon_3725439.html"
          />
        </>
      ) : (
        <div className="flex gap-2">
          <Button
            style="primary"
            name="Login"
            icon={<BiLogIn size={16} />}
            className="text-smoothWhite text-xs py-1.5 font-normal"
            onClick={() => console.log("sign up")}
          />
          <Button
            style="primary"
            name="Signup"
            icon={<BiLogIn size={16} />}
            className="text-smoothWhite text-xs py-1.5 font-normal"
            onClick={() => console.log("sign up")}
          />
        </div>
      )}
    </div>
  );
};

export default AvatarContainer;
