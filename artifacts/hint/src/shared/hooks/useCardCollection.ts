import { useEffect, useState } from "react";
import { getAnonId } from "../../lib/identity";
import {
  getCardCollectionSummary,
  type CardCollectionSummary,
} from "../tarot/cardCollection";
import { subscribeToLocalDailyReadings } from "../../modules/readings/localDailyReadings";
import { subscribeToLocalTarotReadings } from "../../modules/readings/localTarotReadings";

export function useCardCollection(anonId = getAnonId()): CardCollectionSummary {
  const [summary, setSummary] = useState(() => getCardCollectionSummary(anonId));

  useEffect(() => {
    const sync = () => setSummary(getCardCollectionSummary(anonId));
    const unsubscribeDaily = subscribeToLocalDailyReadings(sync);
    const unsubscribeTarot = subscribeToLocalTarotReadings(sync);
    window.addEventListener("storage", sync);
    return () => {
      unsubscribeDaily();
      unsubscribeTarot();
      window.removeEventListener("storage", sync);
    };
  }, [anonId]);

  return summary;
}
