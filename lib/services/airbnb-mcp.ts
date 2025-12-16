/**
 * Airbnb MCP Service
 * Client for interacting with the OpenBnB Airbnb MCP server
 * https://github.com/openbnb-org/mcp-server-airbnb
 *
 * Uses @modelcontextprotocol/sdk to spawn and communicate with the MCP server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { AirbnbListing } from "../types";
import { AirbnbMCPError } from "../types";

let airbnbClient: Client | null = null;
let initPromise: Promise<Client> | null = null;

/**
 * Initialize the Airbnb MCP client by spawning the server process
 */
async function initializeAirbnbClient(): Promise<Client> {
  // Return existing client if already initialized
  if (airbnbClient) {
    return airbnbClient;
  }

  // Return pending initialization if already in progress
  if (initPromise) {
    return initPromise;
  }

  // Start new initialization
  initPromise = (async () => {
    try {
      const transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@openbnb/mcp-server-airbnb", "--ignore-robots-txt"],
      });

      const client = new Client(
        {
          name: "trip-planner-airbnb",
          version: "1.0.0",
        },
        {
          capabilities: {},
        },
      );

      await client.connect(transport);
      airbnbClient = client;
      return client;
    } catch (error) {
      initPromise = null; // Reset on error so next call tries again
      throw new AirbnbMCPError(
        `Failed to initialize Airbnb MCP: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  })();

  return initPromise;
}

/**
 * Parse price information from structuredDisplayPrice object
 * @param structuredDisplayPrice - The structured display price object from Airbnb response
 * @param numNights - Number of nights for the stay
 * @returns Object with totalPrice and pricePerNight as strings
 */
function parsePriceFromStructuredDisplay(
  structuredDisplayPrice: any,
  numNights: number,
): { totalPrice: string; pricePerNight: string } {
  if (!structuredDisplayPrice) {
    return { totalPrice: "0", pricePerNight: "0" };
  }

  const priceDetails =
    structuredDisplayPrice.explanationData?.priceDetails || "";
  const accessibilityLabel =
    structuredDisplayPrice.primaryLine?.accessibilityLabel || "";

  // First, try to extract from priceDetails which has more detailed info
  // Look for "Price after discount: $XXX" (final price)
  const finalPriceMatch = priceDetails.match(/Price after discount:\s+\$([\d,.]+)/);
  if (finalPriceMatch) {
    const totalPrice = finalPriceMatch[1].replace(/,/g, "");
    // Try to find per-night price in the same string
    const perNightMatch = priceDetails.match(/(\d+)\s+nights?\s+x\s+\$([\d,.]+)/);
    if (perNightMatch) {
      const pricePerNight = perNightMatch[2].replace(/,/g, "");
      return { totalPrice, pricePerNight };
    }
    // Calculate per night if we have total price and numNights
    const pricePerNight = numNights > 0
      ? (Number(totalPrice) / numNights).toFixed(2)
      : totalPrice;
    return { totalPrice, pricePerNight };
  }

  // If no discount, look for base price in priceDetails
  // Pattern: "14 nights x $72.86 USD: $1,019.99 USD"
  const basePriceMatch = priceDetails.match(/(\d+)\s+nights?\s+x\s+\$([\d,.]+)[^:]*:\s+\$([\d,.]+)/);
  if (basePriceMatch) {
    const pricePerNight = basePriceMatch[2].replace(/,/g, "");
    const totalPrice = basePriceMatch[3].replace(/,/g, "");
    return { totalPrice, pricePerNight };
  }

  // Fallback: extract from accessibilityLabel (e.g., "$930 USD for 14 nights")
  // This usually shows the final price after discounts
  const priceMatch = accessibilityLabel.match(/\$([\d,]+)\s+USD/);
  if (priceMatch) {
    const totalPrice = priceMatch[1].replace(/,/g, "");
    const pricePerNight = numNights > 0
      ? (Number(totalPrice) / numNights).toFixed(2)
      : totalPrice;
    return {
      totalPrice,
      pricePerNight,
    };
  }

  return { totalPrice: "0", pricePerNight: "0" };
}

/**
 * Parse rating and review count from avgRatingA11yLabel
 * @param avgRatingA11yLabel - The accessibility label string (e.g., "4.96 out of 5 average rating,  137 reviews")
 * @returns Object with rating and reviewCount
 */
function parseRatingFromA11yLabel(
  avgRatingA11yLabel?: string,
): { rating?: number; reviewCount?: number } {
  if (!avgRatingA11yLabel) {
    return {};
  }

  // Match pattern like "4.96 out of 5 average rating,  137 reviews"
  const ratingMatch = avgRatingA11yLabel.match(/([\d.]+)\s+out of 5/);
  const reviewMatch = avgRatingA11yLabel.match(/(\d+)\s+reviews?/);

  return {
    rating: ratingMatch ? Number(ratingMatch[1]) : undefined,
    reviewCount: reviewMatch ? Number(reviewMatch[1]) : undefined,
  };
}

/**
 * Search for Airbnb accommodations using the MCP tool
 * @param destination - Travel destination (e.g., "Paris, France")
 * @param checkInDate - Check-in date (YYYY-MM-DD)
 * @param checkOutDate - Check-out date (YYYY-MM-DD)
 * @param budget - Total budget in USD
 * @param numNights - Number of nights
 * @returns Array of Airbnb listings
 */
export async function searchAirbnb(
  destination: string,
  checkInDate: string,
  checkOutDate: string,
  budget: number,
  numNights: number,
): Promise<AirbnbListing[]> {
  try {
    const client = await initializeAirbnbClient();
    const pricePerNight = Math.floor(budget / numNights);

    // Call the airbnb_search tool
    const result = await client.callTool({
      name: "airbnb_search",
      arguments: {
        location: destination,
        checkin: checkInDate,
        checkout: checkOutDate,
        maxPrice: pricePerNight,
        minPrice: 0,
      },
    });

    if (!result.content || !Array.isArray(result.content)) {
      throw new Error("Invalid response from Airbnb MCP: no content");
    }

    // Parse the text response (MCP returns text format)
    const listings: AirbnbListing[] = [];

    for (const content of result.content) {
      if (content.type !== "text") continue;

      try {
        const parsed = JSON.parse(content.text);

        // Check if this is the new OpenBnB format with searchResults
        if (parsed.searchResults && Array.isArray(parsed.searchResults)) {
          for (const item of parsed.searchResults) {
            if (!item.id) continue;

            // Extract name from nested structure
            const name =
              item.demandStayListing?.description?.name
                ?.localizedStringWithTranslationPreference ||
              item.name ||
              "Unnamed listing";

            // Extract coordinates
            const lat =
              item.demandStayListing?.location?.coordinate?.latitude || 0;
            const lng =
              item.demandStayListing?.location?.coordinate?.longitude || 0;

            // Parse price from structuredDisplayPrice
            const priceInfo = parsePriceFromStructuredDisplay(
              item.structuredDisplayPrice,
              numNights,
            );

            // Parse rating and review count from avgRatingA11yLabel
            const ratingInfo = parseRatingFromA11yLabel(
              item.avgRatingA11yLabel,
            );

            listings.push({
              id: String(item.id),
              name: String(name),
              price: priceInfo.totalPrice,
              pricePerNight: priceInfo.pricePerNight,
              link: String(item.url || `https://www.airbnb.com/rooms/${item.id}`),
              location: {
                lat: Number(lat),
                lng: Number(lng),
              },
              distanceToRoute: "Check listing",
              rating: ratingInfo.rating,
              reviewCount: ratingInfo.reviewCount,
              image: undefined, // Image not available in this response format
            });
          }
        } else {
          // Fallback: try to parse as array or single object (old format)
          const items = Array.isArray(parsed) ? parsed : [parsed];

          for (const item of items) {
            if (!item.id || !item.name) continue;

            listings.push({
              id: String(item.id),
              name: String(item.name),
              price: String(item.price || 0),
              pricePerNight: String(item.pricePerNight || pricePerNight),
              link: String(
                item.link ||
                  `https://www.airbnb.com/rooms/${item.id}`,
              ),
              location: {
                lat: Number(item.location?.lat) || Number(item.lat) || 0,
                lng: Number(item.location?.lng) || Number(item.lng) || 0,
              },
              distanceToRoute: item.distanceToRoute || "Check listing",
              rating: item.rating ? Number(item.rating) : undefined,
              reviewCount: item.reviewCount
                ? Number(item.reviewCount)
                : undefined,
              image: item.image ? String(item.image) : undefined,
            });
          }
        }
      } catch (parseError) {
        // If not JSON, skip this item
        console.error("Failed to parse Airbnb response:", parseError);
        continue;
      }
    }

    if (listings.length === 0) {
      throw new Error("No listings found in Airbnb search response");
    }

    // Return top 10 listings
    return listings.slice(0, 10);
  } catch (error) {
    if (error instanceof AirbnbMCPError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new AirbnbMCPError(`Airbnb search failed: ${error.message}`);
    }
    throw new AirbnbMCPError("Airbnb search failed: Unknown error");
  }
}

/**
 * Get detailed information about a specific Airbnb listing
 * @param listingId - Airbnb listing ID
 * @param checkInDate - Check-in date (YYYY-MM-DD, optional)
 * @param checkOutDate - Check-out date (YYYY-MM-DD, optional)
 * @returns Listing details
 */
export async function getAirbnbListing(
  listingId: string,
  checkInDate?: string,
  checkOutDate?: string,
): Promise<AirbnbListing> {
  try {
    const client = await initializeAirbnbClient();

    // Call the airbnb_listing_details tool
    const result = await client.callTool({
      name: "airbnb_listing_details",
      arguments: {
        id: listingId,
        ...(checkInDate && { checkin: checkInDate }),
        ...(checkOutDate && { checkout: checkOutDate }),
      },
    });

    if (!result.content || !Array.isArray(result.content)) {
      throw new Error("Invalid response from Airbnb MCP");
    }

    // Parse the response
    for (const content of result.content) {
      if (content.type !== "text") continue;

      try {
        const parsed = JSON.parse(content.text);

        return {
          id: String(parsed.id),
          name: String(parsed.name),
          price: String(parsed.price || 0),
          pricePerNight: String(parsed.pricePerNight || 0),
          link: String(
            parsed.link ||
              `https://www.airbnb.com/rooms/${parsed.id}`,
          ),
          location: {
            lat: Number(parsed.location?.lat) || Number(parsed.lat) || 0,
            lng: Number(parsed.location?.lng) || Number(parsed.lng) || 0,
          },
          distanceToRoute: parsed.distanceToRoute || "Check listing",
          rating: parsed.rating ? Number(parsed.rating) : undefined,
          reviewCount: parsed.reviewCount ? Number(parsed.reviewCount) : undefined,
          image: parsed.image ? String(parsed.image) : undefined,
        };
      } catch {
        continue;
      }
    }

    throw new Error("Could not parse listing details");
  } catch (error) {
    if (error instanceof AirbnbMCPError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new AirbnbMCPError(`Failed to get listing: ${error.message}`);
    }
    throw new AirbnbMCPError("Failed to get listing: Unknown error");
  }
}

/**
 * Close the Airbnb MCP client connection
 * Call this during app shutdown
 */
export async function closeAirbnbClient(): Promise<void> {
  if (airbnbClient) {
    // MCP client doesn't have explicit close, but we can clear reference
    airbnbClient = null;
  }
}
