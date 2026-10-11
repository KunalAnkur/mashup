import { SourceSelection } from "@/components";
import { DiscoverCarousel } from "@/components/Discover/DiscoverCarousel";
import GamesPreviewSection from "@/components/Onboard/GamesPreviewSection";
// AFFILIATE GIFT (disabled) — the "For you" rail of affiliate products.
// import ForYouTwoPanel from "@/components/Onboard/ForYouTwoPanel";
import JoinRoomCard from "@/components/Onboard/JoinRoomCard";
import { fetchDiscoverFeed } from "@/lib/discover/feed";
import {
  dashHomeGridClass,
  dashHomeMainColClass,
  dashHomeRailColClass,
} from "@/components/UI/classTokens";

/**
 * A server component, so the carousel's feed is fetched once every five minutes for
 * everybody rather than once per browser. Everything it renders is still a client
 * component; only the fetch moved.
 *
 * The rail is desktop-only: below 1080px it hides and joining a room appears instead as a
 * tile inside the Actions row, which is where it belongs at that width. See
 * dashHomeRailColClass.
 */
const Page = async () => {
  const slides = await fetchDiscoverFeed();

  return (
    <div className={dashHomeGridClass}>
      <div className={dashHomeMainColClass}>
        {/* Actions lead. A first-time visitor arrives wanting to start a watch party, and
            these four tiles are how; with the carousel on top they sat below the fold on a
            laptop and about one visitor in ten who saw a slide ever pressed one. The
            carousel still follows, as the answer to "what else can we do". */}
        <SourceSelection />
        <DiscoverCarousel slides={slides} />
        <GamesPreviewSection />
      </div>
      <div className={dashHomeRailColClass}>
        {/* AFFILIATE GIFT (disabled) — <ForYouTwoPanel /> used to be the rail's only
            occupant. JoinRoomCard took the column over, which is also what keeps the
            grid's second track from sitting empty. */}
        <JoinRoomCard />
      </div>
    </div>
  );
};

export default Page;
