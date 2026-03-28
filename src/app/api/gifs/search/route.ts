import { NextResponse } from "next/server";

// Fallback GIFs in case the API fails
const FALLBACK_GIFS = [
  "https://media.tenor.com/akaM4DjMyrkAAAAC/national-joe-day-hey-joe.gif",
  "https://media.tenor.com/A8pqiJhJywsAAAAC/we%E2%80%99re-trending-up-boys.gif",
  "https://media.tenor.com/lbcfY0Jk8y0AAAAC/monkey-monkeys.gif",
  "https://media.tenor.com/QtQSvAIoZkgAAAAC/hello-2023.gif",
  "https://media.tenor.com/RKxRzqKF_U4AAAAC/live-live-stream.gif",
  "https://media.tenor.com/rHnJdgBex3IAAAAC/illinois-fighting-illini-flag.gif",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  try {
    const tenorKey = "LIVDSRZULELA";
    let tenorUrl = "";
    
    if (!query || query === "trending") {
      tenorUrl = `https://api.tenor.com/v1/trending?key=${tenorKey}&limit=30`;
    } else {
      tenorUrl = `https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${tenorKey}&limit=30`;
    }
    
    const res = await fetch(tenorUrl, { signal: AbortSignal.timeout(5000) });

    if (res.ok) {
      const data = await res.json() as { results?: Array<{ media?: Array<{ gif?: { url?: string } }> }> };
      
      if (data.results && Array.isArray(data.results)) {
        const gifs = data.results
          .map((item: any) => item.media?.[0]?.gif?.url)
          .filter((url: string | undefined): url is string => 
            typeof url === "string" && url.length > 0 && url.startsWith("http")
          );
        
        if (gifs.length > 0) {
          return NextResponse.json({ data: gifs });
        }
      }
    }

    return NextResponse.json({ data: FALLBACK_GIFS });
  } catch (error) {
    console.error("GIF search error:", error);
    return NextResponse.json({ data: FALLBACK_GIFS });
  }
}
