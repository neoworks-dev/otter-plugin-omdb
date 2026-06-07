import type { EnrichArgs, EnrichResult } from "@shutterly/sdk";

const API_KEY = process.env.OMDB_API_KEY ?? "";
const BASE = "https://www.omdbapi.com/";

interface OMDbSearchResult {
  Search?: { imdbID: string }[];
  Response: string;
  Error?: string;
}

interface OMDbDetail {
  Title: string;
  Year: string;
  Rated: string;
  Runtime: string;   // e.g. "120 min"
  Genre: string;     // e.g. "Action, Drama"
  Director: string;  // e.g. "Christopher Nolan"
  Actors: string;    // e.g. "Tom Hanks, Robin Wright"
  Plot: string;
  Poster: string;    // URL or "N/A"
  Response: string;
  Error?: string;
}

async function get<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(BASE);
  url.searchParams.set("apikey", API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`OMDb HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function findImdbId(
  title: string,
  type: "movie" | "series",
  year?: number,
): Promise<string | null> {
  const params: Record<string, string> = { s: title, type };
  if (year) params.y = String(year);
  try {
    const data = await get<OMDbSearchResult>(params);
    return data.Search?.[0]?.imdbID ?? null;
  } catch {
    return null;
  }
}

function notNA(v: string | undefined): v is string {
  return typeof v === "string" && v !== "" && v !== "N/A";
}

function splitList(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

interface ExistingMedia {
  title: string;
  year?: number;
}

export async function enrich(args: EnrichArgs): Promise<EnrichResult> {
  if (!API_KEY) throw new Error("OMDB_API_KEY not set");

  const { mediaType, existing, missing } = args;
  if (mediaType !== "movie" && mediaType !== "series") return {};

  const media = existing as ExistingMedia;
  const want = (field: string) => missing.length === 0 || missing.includes(field);
  const result: EnrichResult = {};

  const omdbType = mediaType === "movie" ? "movie" : "series";
  const imdbId = await findImdbId(media.title, omdbType, media.year);
  if (!imdbId) return result;

  const detail = await get<OMDbDetail>({ i: imdbId, plot: "full" });
  if (detail.Response === "False") return result;

  if (want("description") && notNA(detail.Plot))
    result.description = detail.Plot;

  if (want("poster") && notNA(detail.Poster))
    result.poster = detail.Poster;

  if (want("year") && notNA(detail.Year)) {
    const y = parseInt(detail.Year, 10);
    if (!isNaN(y)) result.year = y;
  }

  if (want("genres") && notNA(detail.Genre))
    result.genres = splitList(detail.Genre);

  if ((want("cast") || want("director")) && (notNA(detail.Director) || notNA(detail.Actors))) {
    const cast: NonNullable<EnrichResult["cast"]> = [];
    if (notNA(detail.Director))
      cast.push(...splitList(detail.Director).map((name) => ({ name, role: "director" })));
    if (notNA(detail.Actors))
      cast.push(...splitList(detail.Actors).map((name) => ({ name, role: "actor" })));
    if (cast.length) result.cast = cast;
  }

  if (mediaType === "movie" && want("durationMinutes") && notNA(detail.Runtime)) {
    const mins = parseInt(detail.Runtime, 10);
    if (!isNaN(mins)) result.durationMinutes = mins;
  }

  if (want("contentRating") && notNA(detail.Rated)) {
    result.contentRating = {
      nsfw: ["R", "NC-17", "X"].includes(detail.Rated),
      rating: detail.Rated,
      warnings: [],
    };
  }

  return result;
}
