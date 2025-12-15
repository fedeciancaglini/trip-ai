/**
 * Airbnb MCP Service
 * Client for interacting with the Airbnb MCP server
 * https://github.com/AkekaratP/mcp-server-airbnb
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
        args: ["@akekaratp/mcp-server-airbnb"],
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
    const result = await client.callTool("airbnb_search", {
      location: destination,
      checkin: checkInDate,
      checkout: checkOutDate,
      maxPrice: pricePerNight,
      minPrice: 0,
    });

    if (!result.content || !Array.isArray(result.content)) {
      throw new Error("Invalid response from Airbnb MCP: no content");
    }

    // Parse the text response (MCP returns text format)
    const listings: AirbnbListing[] = [];

    for (const content of result.content) {
      if (content.type !== "text") continue;

      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(content.text);
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
            reviewCount: item.reviewCount ? Number(item.reviewCount) : undefined,
            image: item.image ? String(item.image) : undefined,
          });
        }
      } catch {
        // If not JSON, skip this item
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
    const result = await client.callTool("airbnb_listing_details", {
      id: listingId,
      ...(checkInDate && { checkin: checkInDate }),
      ...(checkOutDate && { checkout: checkOutDate }),
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
