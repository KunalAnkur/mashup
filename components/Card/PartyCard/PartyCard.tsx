import { Button } from "@/components/UI";
import Footer from "./Footer";
import AvatarGroup from "./AvatarGroup";

const PartyCard = ({ btnName }: { btnName: string }) => {
  /* GLOBAL PARTY CARD COMPONENT */
  return (
    <div className="rounded-lg overflow-hidden bg-[url('/assets/img3.jpg')] bg-cover bg-center h-full  flex flex-col justify-between">
      <div className="flex justify-between">
        <Button
          name={btnName}
          style="secondary"
          className="rounded-bl-none rounded-tr-none  h-fit"
        />
        <AvatarGroup />
      </div>
      <Footer />
    </div>
  );
};

export default PartyCard;
