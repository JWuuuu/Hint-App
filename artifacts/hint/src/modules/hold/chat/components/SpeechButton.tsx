import { useEffect, useRef, useState } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import { IVORY } from "../../atmosphere";
import { useLanguage } from "../../../../lib/i18n";
import { apiUrl } from "../../../../lib/api";

type SpeechState = "idle" | "loading" | "playing" | "error";

interface Props {
  text: string;
  className?: string;
}

export function SpeechButton({ text, className = "" }: Props) {
  const { t } = useLanguage();
  const [state, setState] = useState<SpeechState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const cleanupAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const playSpeech = async () => {
    if (state === "playing") {
      cleanupAudio();
      setState("idle");
      return;
    }

    setState("loading");
    cleanupAudio();

    try {
      const response = await fetch(apiUrl("/api/speech"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      objectUrlRef.current = url;
      audioRef.current = audio;
      audio.onended = () => {
        cleanupAudio();
        setState("idle");
      };
      audio.onerror = () => {
        cleanupAudio();
        setState("error");
      };

      await audio.play();
      setState("playing");
    } catch {
      cleanupAudio();
      setState("error");
    }
  };

  const Icon = state === "loading" ? Loader2 : state === "playing" ? Square : Volume2;
  const label =
    state === "playing"
      ? t("reading.speech.stop")
      : state === "error"
        ? t("reading.speech.retry")
        : t("reading.speech.play");

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => void playSpeech()}
      disabled={state === "loading"}
      className={`inline-grid h-7 w-7 place-items-center rounded-full border transition-colors duration-300 disabled:cursor-wait ${className}`}
      style={{
        color: state === "error" ? "rgba(255,170,150,0.9)" : IVORY.body,
        borderColor:
          state === "playing" ? "rgba(255,240,210,0.38)" : "rgba(255,240,210,0.16)",
        background:
          state === "playing" ? "rgba(255,240,210,0.1)" : "rgba(255,240,210,0.04)",
      }}
    >
      <Icon
        aria-hidden
        className={`h-3.5 w-3.5 ${state === "loading" ? "animate-spin" : ""}`}
      />
    </button>
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Speech request failed with HTTP ${response.status}`;

  try {
    const data = (await response.json()) as { error?: unknown };
    return typeof data.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}
