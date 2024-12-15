"use client";
import { BiLogIn, BiSearch } from "react-icons/bi";
import { Avatar, Button, Input, Notification } from "..";
import { useRouter } from "next/navigation";

interface Props {
  isAuthenticated: boolean;
}
const AvatarContainer = ({ isAuthenticated }: Props) => {
  const router = useRouter();

  return (
    <div className="flex gap-2  items-center justify-center">
      <Input
        placeholder="Search"
        type="text"
        icon={<BiSearch />}
        style={"general"}
      />

      {isAuthenticated ? (
        <>
          <button>
            <Notification isNotified={true} />
          </button>
          <Avatar
            alt="Avatar"
            size={70}
            url="https://pngtree.com/freepng/female-avatar-vector-icon_3725439.html"
          />
        </>
      ) : (
        <Button
          style="primary"
          name="Login"
          icon={<BiLogIn size={16} />}
          className="text-smoothWhite text-xs py-1.5 font-normal"
          onClick={() => router.push("/login")}
        />
      )}
    </div>
  );
};

export default AvatarContainer;
