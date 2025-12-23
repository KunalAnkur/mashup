import { MetadataRoute } from 'next';
import * as constants from '@/constants';

const baseUrl = constants.seo.SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/room/', // Private rooms shouldn't be indexed
        '/api/', // API routes
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

