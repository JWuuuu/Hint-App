export type TarotCardBackStyle = "nocturne" | "ivory" | "rose";

const TAROT_CARD_BACK_BASE_PATH = "/brand/tarot/card-backs";
const TAROT_CARD_BACK_ASSET_VERSION = "20260625-sky-deck-borderless";

export const TAROT_CARD_BACK_FILES = [
  "00_Hint_Sky_Deck/01_Sky_Deck_Celestial_Navy_Gold.png",
  "01_Final_Eight_Set/01_Star_Orbit_Realm_Navy_Gold.png",
  "01_Final_Eight_Set/02_Moon_Tide_Lavender_Gold.png",
  "01_Final_Eight_Set/03_Flame_Heart_Burgundy_Gold.png",
  "01_Final_Eight_Set/04_Earth_Breath_Sage_Gold.png",
  "01_Final_Eight_Set/05_Dawn_Gate_Ivory_Gold.png",
  "01_Final_Eight_Set/06_Fate_Wheel_Dark_Plum_Rose_Gold.png",
  "01_Final_Eight_Set/07_Guiding_Star_Mist_Blue_Gold.png",
  "01_Final_Eight_Set/08_Infinite_Realm_Black_Gold.png",
  "02_Premium_Refined/01_Star_Orbit_Realm_Rich_Navy_Gold.png",
  "02_Premium_Refined/02_Infinite_Realm_Rich_Black_Gold.png",
  "02_Premium_Refined/03_Earth_Relic_Rich_Sage_Gold.png",
  "02_Premium_Refined/04_Flame_Heart_Rich_Burgundy_Gold.png",
  "02_Premium_Refined/05_Guiding_Star_Rich_Sky_Blue_Gold.png",
  "02_Premium_Refined/06_Dawn_Gate_Rich_Ivory_Gold.png",
  "02_Premium_Refined/07_Fate_Wheel_Rich_Purple_Rose_Gold.png",
  "02_Premium_Refined/08_Moon_Tide_Rich_Purple_Gold.png",
  "03_Minimal_Balanced/01_Minimal_Ivory_Gold.png",
  "03_Minimal_Balanced/02_Minimal_Moon_Lavender_Gold.png",
  "03_Minimal_Balanced/03_Minimal_Earth_Sage_Gold.png",
  "03_Minimal_Balanced/04_Minimal_Sky_Periwinkle_Gold.png",
  "04_Elemental_Series/01_Water_Element_Teal_Gold.png",
  "04_Elemental_Series/02_Fire_Element_Burgundy_Gold.png",
  "04_Elemental_Series/03_Earth_Element_Sage_Gold.png",
  "04_Elemental_Series/04_Air_Element_Mist_Blue_Gold.png",
  "05_Luxury_Concepts/01_Celestial_Compass_Light_Blue_Gold.png",
  "05_Luxury_Concepts/02_Radiant_Portal_Ivory_Gold.png",
  "05_Luxury_Concepts/03_Earth_Crystal_Mountain_Green_Gold.png",
  "05_Luxury_Concepts/04_Flame_Sigil_Burgundy_Gold.png",
  "05_Luxury_Concepts/05_Moonlit_Water_Purple_Gold.png",
  "05_Luxury_Concepts/06_Deep_Space_Orbit_Black_Gold.png",
  "06_Early_Zodiac_And_Specials/01_Sagittarius_Early_Purple_Gold.png",
  "06_Early_Zodiac_And_Specials/02_Virgo_Early_Sage_Gold.png",
  "06_Early_Zodiac_And_Specials/03_Aquarius_Early_Blue_Gold.png",
  "06_Early_Zodiac_And_Specials/04_Dark_Lilac_Floral_Minimal.png",
  "06_Early_Zodiac_And_Specials/05_Ivory_Botanical_Minimal.png",
  "06_Early_Zodiac_And_Specials/06_Dusty_Rose_Floral_Minimal.png",
  "06_Early_Zodiac_And_Specials/07_Ornate_Pink_Floral_Star.png",
  "07_Zodiac_Set_A_Detailed/01_Aries_Ram_Fire_Swirls.png",
  "07_Zodiac_Set_A_Detailed/02_Taurus_Horns_Botanical_Green_Gold.png",
  "07_Zodiac_Set_A_Detailed/03_Gemini_Twin_Air_Navy_Gold.png",
  "07_Zodiac_Set_A_Detailed/04_Cancer_Shell_Water_Teal_Gold.png",
  "07_Zodiac_Set_A_Detailed/05_Leo_Solar_Lion_Bronze_Gold.png",
  "07_Zodiac_Set_A_Detailed/06_Virgo_Wheat_Sage_Gold.png",
  "07_Zodiac_Set_A_Detailed/07_Libra_Scales_Plumberry_Gold.png",
  "07_Zodiac_Set_A_Detailed/08_Scorpio_Claws_Shadow_Plum_Gold.png",
  "07_Zodiac_Set_A_Detailed/09_Sagittarius_Bow_Arrow_Burgundy_Gold.png",
  "07_Zodiac_Set_A_Detailed/10_Capricorn_Sea_Goat_Mountain_Gold.png",
  "07_Zodiac_Set_A_Detailed/11_Aquarius_Waterbearer_Teal_Gold.png",
  "07_Zodiac_Set_A_Detailed/12_Pisces_Twin_Fish_Navy_Gold.png",
  "08_Zodiac_Set_B_Minimal/01_Aries_Ram_Fire_Minimal.png",
  "08_Zodiac_Set_B_Minimal/02_Taurus_Horns_Sage_Minimal.png",
  "08_Zodiac_Set_B_Minimal/03_Gemini_Twin_Veil_Minimal.png",
  "08_Zodiac_Set_B_Minimal/04_Cancer_Shell_Tide_Minimal.png",
  "08_Zodiac_Set_B_Minimal/05_Leo_Sunburst_Minimal.png",
  "08_Zodiac_Set_B_Minimal/06_Virgo_Wheat_Minimal.png",
  "08_Zodiac_Set_B_Minimal/07_Libra_Violet_Balance_Minimal.png",
  "08_Zodiac_Set_B_Minimal/08_Scorpio_Claws_Dark_Minimal.png",
  "08_Zodiac_Set_B_Minimal/09_Sagittarius_Pink_Archer_Minimal.png",
  "08_Zodiac_Set_B_Minimal/10_Capricorn_Goat_Horns_Minimal.png",
  "08_Zodiac_Set_B_Minimal/11_Aquarius_Waterbearer_Minimal.png",
  "08_Zodiac_Set_B_Minimal/12_Pisces_Fish_Waves_Minimal.png",
] as const;

export type TarotCardBackId = (typeof TAROT_CARD_BACK_FILES)[number];

export type TarotCardBackChoice = {
  id: TarotCardBackId;
  label: string;
  collection: string;
  image: string;
};

const DEFAULT_CARD_BACK_BY_STYLE: Record<TarotCardBackStyle, TarotCardBackId> = {
  nocturne: "00_Hint_Sky_Deck/01_Sky_Deck_Celestial_Navy_Gold.png",
  ivory: "01_Final_Eight_Set/05_Dawn_Gate_Ivory_Gold.png",
  rose: "01_Final_Eight_Set/02_Moon_Tide_Lavender_Gold.png",
};

function toTitle(value: string) {
  return value
    .replace(/^\d+_/, "")
    .replace(/\.(png|jpg|jpeg|webp|svg)$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCollection(relativePath: TarotCardBackId) {
  return toTitle(relativePath.split("/")[0] ?? "");
}

function getLabel(relativePath: TarotCardBackId) {
  const parts = relativePath.split("/");
  return toTitle(parts[parts.length - 1] ?? relativePath);
}

export function isTarotCardBackId(value: unknown): value is TarotCardBackId {
  return typeof value === "string" && TAROT_CARD_BACK_FILES.some((file) => file === value);
}

export function getDefaultTarotCardBackForStyle(style: TarotCardBackStyle): TarotCardBackId {
  return DEFAULT_CARD_BACK_BY_STYLE[style];
}

export function getTarotCardBackImage(cardBackId: TarotCardBackId): string {
  return `${TAROT_CARD_BACK_BASE_PATH}/${cardBackId}?v=${TAROT_CARD_BACK_ASSET_VERSION}`;
}

export const TAROT_CARD_BACK_CHOICES: readonly TarotCardBackChoice[] = TAROT_CARD_BACK_FILES.map((relativePath) => ({
  id: relativePath,
  label: getLabel(relativePath),
  collection: getCollection(relativePath),
  image: getTarotCardBackImage(relativePath),
}));
