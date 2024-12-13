import { PartyCard } from "../Card";

const GlobalParties = () => {
  return (
    <div className="space-y-4 ">
      <h3 className="text-smoothWhite font-semibold">Global Parties</h3>
      <div className=" grid grid-cols-3 gap-4 ">
        <PartyCard btnName="Live Now" />
        <PartyCard btnName="Scheduled" />
        <PartyCard btnName="Ending soon" />
        <PartyCard btnName="Live Now" />
        <PartyCard btnName="Scheduled" />
        <PartyCard btnName="Ending soon" />
        <PartyCard btnName="Live Now" />
        <PartyCard btnName="Scheduled" />
        <PartyCard btnName="Ending soon" />
      </div>
    </div>
  );
};

export default GlobalParties;
