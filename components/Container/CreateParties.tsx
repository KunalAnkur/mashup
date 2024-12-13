import { FaUpload } from "react-icons/fa6";
import { Button } from "../UI";

const CreateParties = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-smoothWhite font-semibold">Create Party</h3>
      <div className=" flex gap-4 flex-wrap">
        <Button
          style={"primary"}
          name="Device"
          icon={<FaUpload size={20} color="white" />}
        />
        <Button
          style={"primary"}
          name="Device"
          icon={<FaUpload size={20} color="white" />}
        />
        <Button
          style={"primary"}
          name="Device"
          icon={<FaUpload size={20} color="white" />}
        />
        <Button
          style={"primary"}
          name="Device"
          icon={<FaUpload size={20} color="white" />}
        />
        <Button
          style={"primary"}
          name="Device"
          icon={<FaUpload size={20} color="white" />}
        />
      </div>
    </div>
  );
};

export default CreateParties;
