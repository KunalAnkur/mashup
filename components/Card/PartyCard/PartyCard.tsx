import { Button } from "@/components/UI";
import Footer from "./Footer";
import AvatarGroup from "./AvatarGroup";
const PartyCard = () => {
  return (
    <div className="rounded-lg overflow-hidden bg-[url('/assets/img3.jpg')] bg-cover bg-center h-[250px] w-[430px] flex flex-col justify-between">
      <div className="flex justify-between">
        <Button
          name="Live Now"
          style="gradientBtn"
          className="rounded-bl-none rounded-tr-none h-fit"
        />
        <AvatarGroup />
      </div>
      <Footer />
    </div>
  );
};

export default PartyCard;
