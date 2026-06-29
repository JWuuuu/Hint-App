import { useMemo, useState } from "react";
import {
  Bird,
  Bone,
  Cat,
  Dog,
  Heart,
  HelpCircle,
  MessageCircle,
  PawPrint,
  Rabbit,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { AppScreen, GlassPanel, SectionLabel } from "../../components/app/AppChrome";
import { ACCENT, GLASS } from "../../modules/hold/atmosphere";
import { getTarotCardImage } from "../../modules/tarot/logic/cardImageMap";
import { RITUAL_TAROT_DECK, type RitualDeckCard } from "../../modules/tarot/logic/createHiddenDeck";
import { SafeImage } from "../../shared/ui/SafeImage";
import "./animal-tarot.css";

type PetType = "Cat" | "Dog" | "Rabbit" | "Bird" | "Hamster" | "Other";
type PetPersonality =
  | "Clingy"
  | "Shy"
  | "Playful"
  | "Dramatic"
  | "Quiet"
  | "Bossy"
  | "Curious"
  | "Lazy"
  | "Nervous"
  | "Foodie"
  | "Protective"
  | "Independent"
  | "Cuddly"
  | "Jealous"
  | "Energetic";
type QuestionCategory = "Love" | "Mood" | "Care" | "Silly";
type ReadingDepth = "quick" | "deep";
type Step = "profile" | "question" | "owner" | "cards" | "confirm" | "answer";
type PetTarotCard = RitualDeckCard & { image: string | null };

const PET_TYPES: PetType[] = ["Cat", "Dog", "Rabbit", "Bird", "Hamster", "Other"];
const PET_PERSONALITIES: PetPersonality[] = [
  "Clingy",
  "Shy",
  "Playful",
  "Dramatic",
  "Quiet",
  "Bossy",
  "Curious",
  "Lazy",
  "Nervous",
  "Foodie",
  "Protective",
  "Independent",
  "Cuddly",
  "Jealous",
  "Energetic",
];

const PERSONALITY_PREVIEW_COUNT = 9;

const CATEGORY_OPTIONS: Array<{
  id: QuestionCategory;
  label: string;
  prompt: string;
  icon: typeof Heart;
}> = [
  { id: "Love", label: "Love", prompt: "connection, trust, affection", icon: Heart },
  { id: "Mood", label: "Mood", prompt: "today's energy and feelings", icon: MessageCircle },
  { id: "Care", label: "Care", prompt: "comfort, routine, little needs", icon: Bone },
  { id: "Silly", label: "Silly", prompt: "funny signs and tiny chaos", icon: Sparkles },
];

const PERSONALITY_TONE: Record<PetPersonality, string> = {
  Clingy: "soft, attached, and looking for reassurance",
  Shy: "gentle, cautious, and asking for a safer pace",
  Playful: "bright, curious, and wanting more fun",
  Dramatic: "expressive, sensitive, and asking to be noticed",
  Quiet: "calm, private, and happiest with simple routines",
  Bossy: "clear about preferences and not afraid to demand better service",
  Curious: "alert, observant, and secretly investigating everything",
  Lazy: "slow, cozy, and asking for comfort before effort",
  Nervous: "sensitive, easily startled, and needing reassurance",
  Foodie: "motivated by snacks, routine, and tiny edible diplomacy",
  Protective: "loyal, watchful, and trying to keep their world safe",
  Independent: "self-directed, private, and affectionate on their own terms",
  Cuddly: "warm, touch-seeking, and comforted by closeness",
  Jealous: "attention-aware, possessive, and checking where they stand",
  Energetic: "restless, excited, and needing movement before calm",
};

const CATEGORY_TONE: Record<QuestionCategory, string> = {
  Love: "This answer is about how your pet feels bonded to you.",
  Mood: "This answer reads your pet's current emotional weather.",
  Care: "This answer focuses on what may help your pet feel comfortable.",
  Silly: "This answer keeps the message light, funny, and low-stakes.",
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cardWithImage(card: RitualDeckCard): PetTarotCard {
  return {
    ...card,
    image: getTarotCardImage(card.cardId, "hint-card-2") ?? getTarotCardImage(card.cardId),
  };
}

function drawCards(seed: string, count: number): PetTarotCard[] {
  const deck = [...RITUAL_TAROT_DECK];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = hashString(`${seed}:${index}:${deck[index]?.cardId}`) % (index + 1);
    [deck[index], deck[swapIndex]] = [deck[swapIndex]!, deck[index]!];
  }
  return deck.slice(0, count).map(cardWithImage);
}

function animalIcon(type: PetType) {
  if (type === "Cat") return Cat;
  if (type === "Dog") return Dog;
  if (type === "Rabbit") return Rabbit;
  if (type === "Bird") return Bird;
  return PawPrint;
}

function possessiveName(name: string) {
  const trimmed = name.trim() || "your pet";
  return trimmed.endsWith("s") ? `${trimmed}'` : `${trimmed}'s`;
}

function personalityPhrase(personalities: PetPersonality[]) {
  const selected = personalities.length ? personalities : ["Playful" as const];
  if (selected.length === 1) return selected[0].toLowerCase();
  if (selected.length === 2) return `${selected[0].toLowerCase()} and ${selected[1].toLowerCase()}`;
  return `${selected.slice(0, -1).map((item) => item.toLowerCase()).join(", ")}, and ${selected[selected.length - 1]?.toLowerCase()}`;
}

function tonePhrase(personalities: PetPersonality[]) {
  const selected = personalities.length ? personalities : ["Playful" as const];
  return selected.slice(0, 4).map((item) => PERSONALITY_TONE[item]).join("; ");
}

function actionCopy(personalities: PetPersonality[], category: QuestionCategory) {
  const selected = personalities.length ? personalities : ["Playful" as const];
  const primary = selected[0]!;
  const base = {
    Clingy: "offer a few calm minutes of attention without making it a big performance",
    Shy: "lower the noise, move slowly, and let them come closer first",
    Playful: "turn the answer into a tiny game, treat hunt, or silly check-in",
    Dramatic: "acknowledge the big feelings, then reset the room with something familiar",
    Quiet: "keep the routine simple and let comfort be boring in the best way",
    Bossy: "respect the preference, but keep the boundary kind and consistent",
    Curious: "give them something safe to inspect, sniff, or explore",
    Lazy: "make comfort easy: soft spot, water nearby, and no unnecessary pressure",
    Nervous: "use a calm voice, predictable movement, and a quiet reset",
    Foodie: "use a small treat or mealtime ritual to make the message feel safe",
    Protective: "reassure them that the home base is handled and they can relax",
    Independent: "give them choice and space, then let affection happen naturally",
    Cuddly: "offer closeness, warmth, and a familiar touch if they ask for it",
    Jealous: "give clear attention without rewarding pushy behavior too much",
    Energetic: "help them move the energy out before asking them to settle",
  }[primary];

  if (category === "Care") return `${base}. Watch what changes in their body language after that.`;
  if (category === "Love") return `${base}. A small repeated ritual will mean more than one grand gesture.`;
  if (category === "Silly") return `${base}. Do not overthink the comedy; your pet is probably already the director.`;
  return `${base}. Their mood should soften when they feel understood.`;
}

function quickAnswer({
  petName,
  animalType,
  personalities,
  personalityNote,
  category,
  card,
}: {
  petName: string;
  animalType: PetType;
  personalities: PetPersonality[];
  personalityNote: string;
  category: QuestionCategory;
  card: PetTarotCard;
}) {
  const name = petName.trim() || "Your pet";
  const keywords = card.keywords.slice(0, 2).join(" and ");
  const customNote = personalityNote.trim()
    ? ` Your own note adds: ${personalityNote.trim()}.`
    : "";
  return [
    `${name} chose ${card.name}, so the message is coming through ${keywords || "instinct"}.`,
    `As a ${animalType.toLowerCase()} with a ${personalityPhrase(personalities)} personality mix, the vibe feels ${tonePhrase(personalities)}.${customNote}`,
    CATEGORY_TONE[category],
    `What ${name} may be saying: notice me gently, follow my timing, and do not rush the signal.`,
    `Try this next: ${actionCopy(personalities, category)}`,
  ];
}

function deepAnswer({
  petName,
  personalities,
  personalityNote,
  category,
  cards,
}: {
  petName: string;
  personalities: PetPersonality[];
  personalityNote: string;
  category: QuestionCategory;
  cards: PetTarotCard[];
}) {
  const name = petName.trim() || "Your pet";
  const [feeling, message, action] = cards;
  const customNote = personalityNote.trim()
    ? ` Your description of them matters here: ${personalityNote.trim()}.`
    : "";
  return [
    {
      label: "Feeling",
      card: feeling,
      copy: `${name} may be feeling ${feeling?.keywords[0] ?? "a lot"} underneath the surface.${customNote} ${CATEGORY_TONE[category]}`,
    },
    {
      label: "Message",
      card: message,
      copy: `${message?.name ?? "This card"} says ${name} wants you to read the small signs, not just the loud ones.`,
    },
    {
      label: "Action",
      card: action,
      copy: `The next move is simple: ${actionCopy(personalities, category)}`,
    },
  ];
}

function PetCard({
  card,
  selected,
  onSelect,
  disabled,
  reveal = true,
  index,
}: {
  card: PetTarotCard;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  reveal?: boolean;
  index?: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`pet-card-choice hint-tap-sparkle ${selected ? "is-selected" : ""} ${reveal ? "" : "is-card-back"}`}
    >
      <div className="pet-card-image">
        {reveal ? (
          <SafeImage
            src={card.image}
            alt={card.name}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full rounded-[14px]"
            fallbackLabel="Card"
          />
        ) : (
          <div className="pet-card-back" aria-label="Hidden tarot card">
            <span>{typeof index === "number" ? index + 1 : ""}</span>
            <PawPrint size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <span>{reveal ? card.name : "Hidden card"}</span>
    </button>
  );
}

function ReadingBlock({
  label,
  card,
  children,
}: {
  label: string;
  card?: PetTarotCard;
  children: string;
}) {
  return (
    <div className="pet-reading-block">
      <p>{label}</p>
      {card && <strong>{card.name}</strong>}
      <span>{children}</span>
    </div>
  );
}

function StepNav({
  previousLabel = "Previous",
  nextLabel = "Next",
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: {
  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="pet-step-nav">
      <button
        type="button"
        onClick={onPrevious}
        className="pet-nav-button is-previous hint-tap-sparkle"
        disabled={previousDisabled || !onPrevious}
      >
        {previousLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        className="pet-nav-button is-next hint-tap-sparkle"
        disabled={nextDisabled || !onNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export function AnimalTarotView() {
  const [petName, setPetName] = useState("Mochi");
  const [animalType, setAnimalType] = useState<PetType>("Cat");
  const [personalities, setPersonalities] = useState<PetPersonality[]>(["Playful"]);
  const [personalityNote, setPersonalityNote] = useState("");
  const [showPersonalityNote, setShowPersonalityNote] = useState(false);
  const [showAllPersonalities, setShowAllPersonalities] = useState(false);
  const [category, setCategory] = useState<QuestionCategory>("Mood");
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState<ReadingDepth>("quick");
  const [drawnCards, setDrawnCards] = useState<PetTarotCard[]>([]);
  const [ownerSelectedIds, setOwnerSelectedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("profile");

  const Icon = animalIcon(animalType);
  const ownerSelectionGoal = depth === "quick" ? 5 : 10;
  const selectionGoal = depth === "quick" ? 1 : 3;
  const ownerCards = drawnCards.filter((card) => ownerSelectedIds.includes(card.cardId));
  const chosenCards = ownerCards.filter((card) => selectedIds.includes(card.cardId));
  const selectedQuestion = question.trim() || `What does ${petName.trim() || "my pet"} want me to know today?`;
  const visiblePersonalities = showAllPersonalities
    ? PET_PERSONALITIES
    : PET_PERSONALITIES.slice(0, PERSONALITY_PREVIEW_COUNT);

  const quickLines = useMemo(() => {
    if (!chosenCards[0]) return [];
    return quickAnswer({ petName, animalType, personalities, personalityNote, category, card: chosenCards[0] });
  }, [animalType, category, chosenCards, personalities, personalityNote, petName]);

  const deepBlocks = useMemo(() => {
    if (chosenCards.length < 3) return [];
    return deepAnswer({ petName, personalities, personalityNote, category, cards: chosenCards });
  }, [category, chosenCards, personalities, personalityNote, petName]);

  function startDraw(nextDepth: ReadingDepth) {
    const seed = `${petName}:${animalType}:${personalities.join("-")}:${personalityNote}:${category}:${selectedQuestion}:${Date.now()}`;
    setDepth(nextDepth);
    setDrawnCards(drawCards(seed, RITUAL_TAROT_DECK.length));
    setOwnerSelectedIds([]);
    setSelectedIds([]);
    setStep("owner");
  }

  function toggleOwnerCard(cardId: string) {
    setOwnerSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= ownerSelectionGoal) return current;
      return [...current, cardId];
    });
  }

  function toggleCard(cardId: string) {
    setSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= selectionGoal) return current;
      return [...current, cardId];
    });
  }

  function togglePersonality(item: PetPersonality) {
    setPersonalities((current) => {
      if (current.includes(item)) {
        const next = current.filter((personality) => personality !== item);
        return next.length ? next : current;
      }
      return [...current, item];
    });
  }

  function resetQuiz() {
    setDrawnCards([]);
    setOwnerSelectedIds([]);
    setSelectedIds([]);
    setStep("profile");
  }

  return (
    <AppScreen>
      <header className="animal-tarot-hero mb-6">
        <div className="animal-hero-orbit" aria-hidden />
        <div className="relative z-10">
          <p className="font-sans text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ACCENT.gold }}>
            Animal Tarot
          </p>
          <h1 className="mt-2 font-serif text-[34px] leading-none sm:text-[42px]" style={{ color: GLASS.text }}>
            Pet Q&A
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-[13px] leading-relaxed sm:text-[14px]" style={{ color: GLASS.muted }}>
            Ask a question, draw cards, then let your pet choose by touch, sniff, stare, sound, or pure owner instinct.
          </p>
        </div>
      </header>

      <GlassPanel hero className="animal-tarot-stage pet-qa-stage" padded={false}>
        <div className="animal-stage-sky" aria-hidden />
        <div className="relative z-10 grid gap-5 p-5 sm:p-6">
          <div className="pet-qa-status">
            <span className={step === "profile" ? "is-active" : ""}>Profile</span>
            <span className={step === "question" ? "is-active" : ""}>Question</span>
            <span className={step === "owner" || step === "cards" || step === "confirm" ? "is-active" : ""}>Pick</span>
            <span className={step === "answer" ? "is-active" : ""}>Answer</span>
          </div>

          {step === "profile" && (
            <section className="pet-qa-panel">
              <SectionLabel>Pet profile</SectionLabel>
              <div className="pet-profile-top">
                <div className="pet-avatar">
                  <Icon size={34} strokeWidth={1.5} />
                </div>
                <label className="pet-input-label">
                  Pet name
                  <input value={petName} onChange={(event) => setPetName(event.target.value)} placeholder="Mochi" />
                </label>
              </div>

              <div className="pet-field-group">
                <p>Animal type</p>
                <div className="pet-pill-grid">
                  {PET_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnimalType(type)}
                      className={animalType === type ? "is-selected" : ""}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pet-field-group">
                <p>Personality <span>pick one or more</span></p>
                <div className="pet-pill-grid">
                  {visiblePersonalities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => togglePersonality(item)}
                      className={personalities.includes(item) ? "is-selected" : ""}
                    >
                      {item}
                    </button>
                  ))}
                  {showAllPersonalities && (
                    <button
                      type="button"
                      onClick={() => setShowPersonalityNote((current) => !current)}
                      className="pet-description-pill hint-tap-sparkle"
                    >
                      <MessageCircle size={15} />
                      {showPersonalityNote ? "Hide description" : "Add your description"}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllPersonalities((current) => !current)}
                  className="pet-more-button hint-tap-sparkle"
                >
                  {showAllPersonalities ? "Show less" : "More personalities"}
                </button>
              </div>

              {showPersonalityNote && (
                <label className="pet-input-label">
                  Describe your pet
                  <textarea
                    value={personalityNote}
                    onChange={(event) => setPersonalityNote(event.target.value)}
                    placeholder="Example: needy in the morning, ignores me at night, loves snacks, scared of strangers..."
                  />
                </label>
              )}

              <StepNav previousDisabled onNext={() => setStep("question")} nextLabel="Next" />
            </section>
          )}

          {step === "question" && (
            <section className="pet-qa-panel">
              <SectionLabel>Choose a topic</SectionLabel>
              <div className="pet-category-grid">
                {CATEGORY_OPTIONS.map((item) => {
                  const CategoryIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={category === item.id ? "is-selected" : ""}
                    >
                      <CategoryIcon size={18} />
                      <strong>{item.label}</strong>
                      <span>{item.prompt}</span>
                    </button>
                  );
                })}
              </div>

              <label className="pet-input-label mt-4">
                Your question
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={`What does ${petName.trim() || "my pet"} want me to know?`}
                />
              </label>

              <div className="pet-draw-actions">
                <button
                  type="button"
                  onClick={() => setDepth("quick")}
                  className={`${depth === "quick" ? "animal-primary-button" : "animal-secondary-button"} hint-tap-sparkle`}
                >
                  <Sparkles size={16} />
                  <span className="pet-draw-button-copy">
                    <strong>Quick answer: draw 1</strong>
                    <small>Owner draws 5 cards, then let pet pick one.</small>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDepth("deep")}
                  className={`${depth === "deep" ? "animal-primary-button" : "animal-secondary-button"} hint-tap-sparkle`}
                >
                  <HelpCircle size={16} />
                  <span className="pet-draw-button-copy">
                    <strong>Deep answer: draw 3</strong>
                    <small>Owner draws 10 cards, then let pet pick three.</small>
                  </span>
                </button>
              </div>
              <StepNav onPrevious={() => setStep("profile")} onNext={() => startDraw(depth)} nextLabel="Next" />
            </section>
          )}

          {step === "owner" && (
            <section className="pet-qa-panel">
              <SectionLabel>{depth === "quick" ? "Owner picks 5" : "Owner picks 9"}</SectionLabel>
              <h2 className="pet-qa-heading">Choose {ownerSelectionGoal} cards from the 78-card deck.</h2>
              <p className="pet-qa-copy">
                You only see the card backs here. Pick by instinct first, then let {petName.trim() || "your pet"} choose from your cards.
              </p>
              <div className="pet-owner-count">
                {ownerSelectedIds.length} / {ownerSelectionGoal} selected
              </div>
              <div className="pet-card-grid is-owner-deck">
                {drawnCards.map((card, index) => (
                  <PetCard
                    key={card.cardId}
                    card={card}
                    index={index}
                    reveal={false}
                    selected={ownerSelectedIds.includes(card.cardId)}
                    disabled={!ownerSelectedIds.includes(card.cardId) && ownerSelectedIds.length >= ownerSelectionGoal}
                    onSelect={() => toggleOwnerCard(card.cardId)}
                  />
                ))}
              </div>
              <div className="pet-draw-actions">
                <button type="button" onClick={() => startDraw(depth)} className="animal-secondary-button hint-tap-sparkle">
                  <RefreshCcw size={15} />
                  Shuffle again
                </button>
              </div>
              <StepNav
                onPrevious={() => setStep("question")}
                onNext={() => {
                  setSelectedIds([]);
                  setStep("cards");
                }}
                nextLabel="Next"
                nextDisabled={ownerSelectedIds.length !== ownerSelectionGoal}
              />
            </section>
          )}

          {step === "cards" && (
            <section className="pet-qa-panel">
              <SectionLabel>{depth === "quick" ? "Let your pet pick 1" : "Let your pet pick 3"}</SectionLabel>
              <h2 className="pet-qa-heading">Place your phone near {petName.trim() || "your pet"} and watch their first reaction.</h2>
              <p className="pet-qa-copy">
                A paw touch, nose touch, sniff, stare, moving closer, sound, or your gut feeling can count.
              </p>
              <div className={`pet-card-grid ${depth === "deep" ? "is-deep" : ""}`}>
                {ownerCards.map((card, index) => (
                  <PetCard
                    key={card.cardId}
                    card={card}
                    index={index}
                    reveal={false}
                    selected={selectedIds.includes(card.cardId)}
                    disabled={!selectedIds.includes(card.cardId) && selectedIds.length >= selectionGoal}
                    onSelect={() => toggleCard(card.cardId)}
                  />
                ))}
              </div>
              <div className="pet-draw-actions">
                <button type="button" onClick={() => startDraw(depth)} className="animal-secondary-button hint-tap-sparkle">
                  <RefreshCcw size={15} />
                  Start over
                </button>
              </div>
              <StepNav
                onPrevious={() => setStep("owner")}
                onNext={() => setStep("confirm")}
                nextLabel="Next"
                nextDisabled={selectedIds.length !== selectionGoal}
              />
            </section>
          )}

          {step === "confirm" && (
            <section className="pet-qa-panel">
              <SectionLabel>Confirm choice</SectionLabel>
              <h2 className="pet-qa-heading">
                {depth === "quick"
                  ? `Are you sure this is ${possessiveName(petName)} card?`
                  : `Are these the three cards ${petName.trim() || "your pet"} chose?`}
              </h2>
              <div className="pet-confirm-grid">
                {chosenCards.map((card) => (
                  <div key={card.cardId} className="pet-confirm-card">
                    <div className="pet-card-back" aria-label="Chosen hidden tarot card">
                      <PawPrint size={28} strokeWidth={1.5} />
                    </div>
                    <strong>Chosen card</strong>
                  </div>
                ))}
              </div>
              <StepNav
                previousLabel="Previous"
                nextLabel="Next"
                onPrevious={() => setStep("cards")}
                onNext={() => setStep("answer")}
              />
            </section>
          )}

          {step === "answer" && (
            <section className="pet-qa-panel">
              <SectionLabel>{depth === "quick" ? "Pet answer" : "Deep pet answer"}</SectionLabel>
              <h2 className="pet-qa-heading">{petName.trim() || "Your pet"} answered through the cards.</h2>
              <p className="pet-qa-question">Question: {selectedQuestion}</p>
              {depth === "quick" ? (
                <div className="grid gap-3">
                  {quickLines.map((line, index) => (
                    <ReadingBlock key={line} label={index === 0 ? chosenCards[0]?.name ?? "Card" : `Message ${index}`}>
                      {line}
                    </ReadingBlock>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3">
                  {deepBlocks.map((block) => (
                    <ReadingBlock key={block.label} label={block.label} card={block.card}>
                      {block.copy}
                    </ReadingBlock>
                  ))}
                </div>
              )}
              <StepNav
                previousLabel="Previous"
                nextLabel="New pet profile"
                onPrevious={() => setStep("confirm")}
                onNext={resetQuiz}
              />
            </section>
          )}
        </div>
      </GlassPanel>
    </AppScreen>
  );
}
