import { GamesCatalogue } from "@/components/Games/GamesCatalogue";
import { GamesReading } from "@/components/Games/GamesReading";
import { fetchPlayTogetherPosts } from "@/lib/blog/playTogether";
import {
  dashGamesPageColClass,
  dashPageContentWrapClass,
} from "@/components/UI/classTokens";

/**
 * A server component, like the home page, so the guides are fetched once every five
 * minutes for everybody rather than once per browser — and so they arrive in the first
 * HTML instead of appearing late and pushing the catalogue up the page.
 *
 * The catalogue itself is still a client component; it needs the viewer's tier and the
 * router. Only the fetch moved.
 */
const Page = async () => {
  const posts = await fetchPlayTogetherPosts();

  return (
    <div className={dashPageContentWrapClass}>
      <div className={dashGamesPageColClass}>
        <GamesCatalogue />
        <GamesReading posts={posts} />
      </div>
    </div>
  );
};

export default Page;
