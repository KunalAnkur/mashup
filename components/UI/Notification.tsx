import { IoMdNotificationsOutline } from "react-icons/io";

interface Props {
  isNotified?: boolean;
}
const Notification = ({ isNotified }: Props) => {
  const openNotifications = () => {
    console.log("open notifications");
  };
  return (
    <button className="cursor-pointer relative" onClick={openNotifications}>
      {isNotified && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
      <IoMdNotificationsOutline color="white" size={24} strokeWidth={2} />
    </button>
  );
};

export default Notification;
