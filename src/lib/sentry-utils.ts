import * as Sentry from "@sentry/nextjs";

/**
 * Wraps a scraper function with Sentry tracking.
 * @param source The source name (e.g., 'ra', 'iabilet')
 * @param scraperFn The function that executes the scrape
 */
export async function withSentryScraper<T>(
  source: string,
  scraperFn: () => Promise<T>
): Promise<T> {
  return await Sentry.withIsolatedScope(async (scope) => {
    scope.setTag("component", "scraper");
    scope.setTag("scraper_source", source);
    
    try {
      return await scraperFn();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  });
}
