import { SourceSelection } from "@/components";
import { DiscoverCarousel } from "@/components/Discover/DiscoverCarousel";
import GamesPreviewSection from "@/components/Onboard/GamesPreviewSection";
import ForYouTwoPanel from "@/components/Onboard/ForYouTwoPanel";
import { fetchDiscoverFeed } from "@/lib/discover/feed";
import { dashHomeGridClass, dashHomeMainColClass, dashHomeRailColClass } from "@/components/UI/classTokens";

/**
 * A server component, so the carousel's feed is fetched once every five minutes for
 * everybody rather than once per browser. Everything it renders is still a client
 * component; only the fetch moved.
 */
const Page = async () => {
  const slides = await fetchDiscoverFeed();

  return (
    <div className={dashHomeGridClass}>
      <div className={dashHomeMainColClass}>
        <DiscoverCarousel slides={slides} />
        <SourceSelection />
        <GamesPreviewSection />
      </div>
      <div className={dashHomeRailColClass}>
        <ForYouTwoPanel />
      </div>
    </div>
  );
};

export default Page;
