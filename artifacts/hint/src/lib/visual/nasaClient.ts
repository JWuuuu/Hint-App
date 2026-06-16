import { apiUrl } from "../api";

export type NasaApodResponse = {
  source: "NASA APOD";
  mode: "live" | "fallback";
  title: string;
  date?: string;
  imageUrl: string | null;
  hdImageUrl?: string | null;
  mediaType?: string;
  explanation?: string;
  copyright?: string;
  cached?: boolean;
  fetchedAt?: string;
};

export async function getRealSkyToday(date?: string): Promise<NasaApodResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(apiUrl(`/api/visual/nasa/apod${query}`));
  if (!response.ok) {
    return { source: "NASA APOD", mode: "fallback", imageUrl: null, title: "NASA visual unavailable" };
  }
  return response.json() as Promise<NasaApodResponse>;
}
