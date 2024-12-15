import AvatarContainer from "./AvatarContainer";
import CreateParties from "./CreateParties";
import GlobalParties from "./GlobalParties";

const HomeContent = () => {
  return (
    <div className="flex-1 space-y-8 h-screen overflow-y-auto hide-scrollbar  pr-4">
      <div className="flex justify-end mt-4">
        <AvatarContainer isAuthenticated={false} />
      </div>
      <CreateParties />
      <GlobalParties />
    </div>
  );
};

export default HomeContent;
