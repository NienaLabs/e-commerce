const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1";

/**
 * Transforms an original image URL into an optimized URL using our FastAPI backend.
 *
 * @param url The original source image URL
 * @param width The desired target width
 * @param quality The desired image quality (1-100)
 * @returns The URL for the optimized image
 */
export function getOptimizedUrl(url: string | null | undefined, width: number, quality: number = 75): string | null {
  if (!url) return null;

  // Don't optimize local required images (e.g. require('./image.png') which are numbers or object)
  if (typeof url !== "string") return url;

  // Don't optimize data URIs
  if (url.startsWith("data:")) return url;
  
  // Don't optimize SVG files natively
  if (url.toLowerCase().endsWith(".svg")) return url;

  // Construct the URL to our optimization endpoint
  const params = new URLSearchParams({
    url: url,
    w: width.toString(),
    q: quality.toString(),
  });

  return `${API_BASE_URL}/images/optimize?${params.toString()}`;
}
