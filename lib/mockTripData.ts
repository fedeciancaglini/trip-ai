import type { TripPlannerState, ResultsState } from "./types";

// This is a mock TripPlannerState built from the example you provided.
// Note: date-like fields are converted to Date instances to match the type.
export const mockTripState: TripPlannerState = {
  destination: "Pilar Buenos Aires",
  origin: "Bariloche",
  startDate: new Date("2026-01-02T00:00:00.000Z"),
  endDate: new Date("2026-01-16T00:00:00.000Z"),
  budgetUsd: 1000,
  daysCount: 14,
  destinationCoordinates: {
    lat: -34.4663154,
    lng: -58.9153722,
  },
  originCoordinates: {
    lat: -41.1334722,
    lng: -71.3102778,
  },
  transportationMode: "plane",
  pointsOfInterest: [
    {
      name: "Reserva Natural Urbana Pilar",
      description:
        "Escape to this beautiful urban nature reserve, a vital green lung for the city. It's perfect for birdwatching, leisurely walks along its trails, and connecting with the local flora and fauna, offering a peaceful retreat from urban life.",
      category: "natural",
      lat: -34.453,
      lng: -58.895,
    },
    {
      name: "Basílica Nuestra Señora del Pilar",
      description:
        "Visit the majestic Basilica, the namesake of the city, standing as a historical and architectural landmark. Its impressive façade and serene interior offer a glimpse into Pilar's religious heritage and provide a quiet space for reflection.",
      category: "historical",
      lat: -34.46,
      lng: -58.913,
    },
    {
      name: "Paseo del Pilar Shopping",
      description:
        "Indulge in retail therapy or enjoy a meal at Paseo del Pilar Shopping, one of the main commercial centers in the area. It features a wide array of stores, dining options, and a cinema, making it a great spot for entertainment and leisure.",
      category: "entertainment",
      lat: -34.457,
      lng: -58.919,
    },
    {
      name: "Archivo y Museo Histórico Municipal de Pilar Dr. Manuel Alberti",
      description:
        "Delve into Pilar's rich past at its municipal historical museum. Discover fascinating exhibits detailing the city's foundation, development, and cultural evolution through artifacts, documents, and visual displays.",
      category: "museum",
      lat: -34.46,
      lng: -58.914,
    },
    {
      name: "Palmas del Pilar Shopping",
      description:
        "Another fantastic shopping and entertainment destination, Palmas del Pilar offers a vibrant atmosphere with numerous international and local brands, diverse restaurants, and a large movie theater complex. It's a great place to spend an afternoon or evening.",
      category: "entertainment",
      lat: -34.453,
      lng: -58.907,
    },
    {
      name: "Plaza 12 de Octubre",
      description:
        "The heart of downtown Pilar, this historical plaza is a lively gathering spot surrounded by important civic buildings. It's ideal for a leisurely stroll, people-watching, or simply enjoying the vibrant local atmosphere.",
      category: "park",
      lat: -34.46,
      lng: -58.913,
    },
    {
      name: "Kansas Grill & Bar Pilar",
      description:
        "Savor a delicious meal at Kansas Grill & Bar, known for its American-style cuisine, especially its ribs and grilled dishes. With a lively ambiance and quality food, it's a popular choice for both locals and visitors looking for a great dining experience.",
      category: "restaurant",
      lat: -34.459,
      lng: -58.901,
    },
    {
      name: "Temaikèn Biopark",
      description:
        "Embark on an incredible wildlife adventure at Temaikèn Biopark, a world-class zoo and aquarium located just a short drive from Pilar. It offers immersive exhibits of diverse ecosystems, focusing on conservation and education, making it a perfect family outing.",
      category: "natural",
      lat: -34.367,
      lng: -58.742,
    },
    {
      name: "La Aldea Pilar",
      description:
        "Explore La Aldea Pilar, a charming lifestyle center featuring boutique shops, delightful cafes, and a variety of restaurants set in an open-air, village-like environment. It's perfect for a relaxed afternoon of browsing, dining, and enjoying the relaxed ambiance.",
      category: "market",
      lat: -34.452,
      lng: -58.905,
    },
    {
      name: "Teatro Municipal Lope de Vega",
      description:
        "Experience the vibrant cultural scene of Pilar at the Teatro Municipal Lope de Vega. This historic theater hosts a diverse program of plays, concerts, dance performances, and other cultural events throughout the year.",
      category: "entertainment",
      lat: -34.46,
      lng: -58.915,
    },
    {
      name: "Aero Club Pilar",
      description:
        "For aviation enthusiasts or those seeking a unique perspective, visit the Aero Club Pilar. You might catch sight of planes taking off and landing, or if available, inquire about scenic flights to get a bird's-eye view of the beautiful Buenos Aires countryside.",
      category: "entertainment",
      lat: -34.45,
      lng: -58.99,
    },
    {
      name: "Del Viso Plaza",
      description:
        "Discover the local charm of Del Viso by visiting its central plaza. This community park offers a pleasant setting for relaxation, with green spaces, benches, and often local vendors or activities, providing a glimpse into daily life outside of central Pilar.",
      category: "park",
      lat: -34.457,
      lng: -58.835,
    },
  ],
  dailyItinerary: [],
  routeInformation: {
    totalDistance: "",
    totalDuration: "",
    routes: [],
  },
  airbnbRecommendations: [
    {
      id: "40849162",
      name: "New apartment with a private terrace and grill",
      price: "728.53",
      pricePerNight: "54.44",
      link: "https://www.airbnb.com/rooms/40849162",
      location: {
        lat: -34.81758,
        lng: -58.45758,
      },
      distanceToRoute: "Check listing",
      rating: 5,
      reviewCount: 12,
      image: undefined,
    },
    {
      id: "54161580",
      name: "Canning , new apartment for4 ,gym ,pool,airport",
      price: "939.76",
      pricePerNight: "76.38",
      link: "https://www.airbnb.com/rooms/54161580",
      location: {
        lat: -34.88153,
        lng: -58.50478,
      },
      distanceToRoute: "Check listing",
      rating: 4.71,
      reviewCount: 56,
      image: undefined,
    },
    {
      id: "996517121866441370",
      name: "Beautiful view & peaceful spot",
      price: "866.26",
      pricePerNight: "64.60",
      link: "https://www.airbnb.com/rooms/996517121866441370",
      location: {
        lat: -34.893,
        lng: -58.50687,
      },
      distanceToRoute: "Check listing",
      rating: 4.6,
      reviewCount: 15,
      image: undefined,
    },
    {
      id: "949236886145937917",
      name: "Departamento en Capital Federal",
      price: "402.61",
      pricePerNight: "31.56",
      link: "https://www.airbnb.com/rooms/949236886145937917",
      location: {
        lat: -34.5985,
        lng: -58.4463,
      },
      distanceToRoute: "Check listing",
      rating: 4.93,
      reviewCount: 151,
      image: undefined,
    },
    {
      id: "41232181",
      name: "Warm apartment in the center of the city",
      price: "316.11",
      pricePerNight: "24.58",
      link: "https://www.airbnb.com/rooms/41232181",
      location: {
        lat: -34.60001,
        lng: -58.37842,
      },
      distanceToRoute: "Check listing",
      rating: 4.89,
      reviewCount: 57,
      image: undefined,
    },
    {
      id: "1161679403880916963",
      name: "Bright Studio in Monte Grande",
      price: "655.04",
      pricePerNight: "53.65",
      link: "https://www.airbnb.com/rooms/1161679403880916963",
      location: {
        lat: -34.81836,
        lng: -58.46349,
      },
      distanceToRoute: "Check listing",
      rating: 4.93,
      reviewCount: 14,
      image: undefined,
    },
    {
      id: "1163112049634761778",
      name: "Modern room with adjoining office",
      price: "257.75",
      pricePerNight: "19.36",
      link: "https://www.airbnb.com/rooms/1163112049634761778",
      location: {
        lat: -34.5809,
        lng: -58.4366,
      },
      distanceToRoute: "Check listing",
      rating: 4.86,
      reviewCount: 14,
      image: undefined,
    },
    {
      id: "1199324995799922864",
      name: "4th floor accommodation in Monte Grande Centro",
      price: "645.91",
      pricePerNight: "46.14",
      link: "https://www.airbnb.com/rooms/1199324995799922864",
      location: {
        lat: -34.8185,
        lng: -58.46961,
      },
      distanceToRoute: "Check listing",
      rating: 4.93,
      reviewCount: 15,
      image: undefined,
    },
    {
      id: "1502384128113717148",
      name: "Room for rent",
      price: "287.58",
      pricePerNight: "20.54",
      link: "https://www.airbnb.com/rooms/1502384128113717148",
      location: {
        lat: -34.71174,
        lng: -58.28552,
      },
      distanceToRoute: "Check listing",
      rating: undefined,
      reviewCount: undefined,
      image: undefined,
    },
    {
      id: "1503722276618134383",
      name: "707 - Spot Studios, Retreat",
      price: "543.25",
      pricePerNight: "44.87",
      link: "https://www.airbnb.com/rooms/1503722276618134383",
      location: {
        lat: -34.5975,
        lng: -58.3793,
      },
      distanceToRoute: "Check listing",
      rating: 5,
      reviewCount: 3,
      image: undefined,
    },
  ],
  errors: [],
  startTime: new Date("2025-12-16T12:40:39.904Z"),
  endTime: undefined,
};

// Convenience shape matching ResultsState["data"], derived from the mock state.
export const mockResultsData: ResultsState["data"] = {
  pointsOfInterest: mockTripState.pointsOfInterest,
  dailyItinerary: mockTripState.dailyItinerary,
  routeInformation: mockTripState.routeInformation,
  airbnbRecommendations: mockTripState.airbnbRecommendations,
};


