import { PartyCard } from "../Card";

const GlobalParties = () => {
  return (
    <div className="space-y-4 ">
      <h3 className="text-smoothWhite font-semibold">Global Parties</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(19rem,1fr))] gap-4 grid-rows-[repeat(5,25ch)] justify-items-stretch auto-rows-auto ">
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
