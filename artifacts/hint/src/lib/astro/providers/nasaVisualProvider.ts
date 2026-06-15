export type NasaApodImage = {
  title: string;
  date: string;
  url: string;
  hdurl?: string;
  explanation?: string;
  copyright?: string;
  mediaType: "image";
};

type NasaApodResponse = {
  title?: string;
  date?: string;
  url?: string;
  hdurl?: string;
  explanation?: string;
  copyright?: string;
  media_type?: string;
};

export async function getNasaApodImage({
  apiKey,
  date,
  signal,
}: {
  apiKey?: string;
  date?: string;
  signal?: AbortSignal;
} = {}): Promise<NasaApodImage | null> {
  void apiKey;
  void date;
  void signal;
  return null;
}

export function hasNasaVisualKey(apiKey?: string) {
  return Boolean(apiKey && apiKey !== "your_nasa_open_api_key_here");
}
