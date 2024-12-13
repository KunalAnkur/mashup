import { IoMdNotificationsOutline } from "react-icons/io";

const Notification = () => {
  const openNotifications = () => {
    console.log("open notifications");
  };
  return (
    <button className="cursor-pointer" onClick={openNotifications}>
      <IoMdNotificationsOutline color="white" size={24} strokeWidth={2} />
    </button>
  );
};

export default Notification;
