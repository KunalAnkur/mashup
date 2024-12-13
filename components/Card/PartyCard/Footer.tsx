import HostDetails from "./HostDetails";
import { Button } from "@/components/UI";
import { useRouter } from "next/navigation";

const Footer = () => {
  const router = useRouter();
  return (
    <div className="w-full p-3 flex justify-between items-center backdrop-blur-md bg-white/5">
      <HostDetails
        avatarUrl="https://img.freepik.com/free-vector/smiling-redhaired-boy-illustration_1308-175803.jpg?t=st=1733684954~exp=1733688554~hmac=e9ff778edf2b98f64ef4c545f38e54df1cbdd79eaf53e5e6b6060d0ee51c4251&w=996"
        hostName="Zümra"
        playingAt="1:22:07"
        size={50}
      />
      <Button
        name="Join"
        style="secondary"
        onClick={() => router.push("/join")}
      />
    </div>
  );
};

export default Footer;
