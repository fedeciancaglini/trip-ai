/**
 * Environment variable validation
 * Run at startup to fail fast if configuration is incomplete
 */

export function validateEnvironment(): void {
  const requiredVars = [
    "GEMINI_API_KEY",
    "GOOGLE_MAPS_API_KEY",
    "AIRBNB_MCP_ENDPOINT",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing: string[] = [];

  requiredVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(", ")}. 
    Please check your .env.local file.`;
    
    if (process.env.NODE_ENV === "production") {
      throw new Error(error);
    } else {
      console.warn("⚠️ WARNING:", error);
    }
  } else {
    console.log("✓ All required environment variables are configured");
  }
}
