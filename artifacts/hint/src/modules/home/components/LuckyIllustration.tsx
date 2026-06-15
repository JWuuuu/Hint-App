import type { ReactNode } from "react";
import type { DailyLuckyItem } from "../types/home.types";

type LuckyIllustrationProps = {
  item: DailyLuckyItem;
  size?: number;
};

const stroke = "var(--hint-lucky-stroke, #5b5365)";
const ink = "var(--hint-lucky-ink, #3f3948)";
const iconInk = "#3f3948";
const blush = "#f5a5b8";
const rose = "#ef7f9f";
const peach = "#f6b385";
const mint = "#94d5bd";
const sage = "#a7c49b";
const sky = "#8cc9ec";
const lavender = "#b9a6e8";
const butter = "#f3cf72";
const cream = "#f7ead6";
const mocha = "#a7795f";
const gold = "#e7ba59";
const silver = "#c4ccd6";

export const LUCKY_COLOR_SWATCHES: Record<string, string> = {
  "Sky Blue": "#91d8f6",
  "Sage Green": "#aeba9b",
  Lavender: "#aa93e7",
  "Sunset Pink": "#ff9193",
  "Ocean Blue": "#1688bd",
  "Cream White": "#fff8ea",
  "Mocha Brown": "#79523d",
  Peach: "#ff8b80",
  "Mint Green": "#8ee7b8",
  Lilac: "#d4a6ed",
  Coral: "#ff675f",
  "Butter Yellow": "#ffe07b",
  "Rose Pink": "#efa0b2",
  "Dusty Blue": "#8daabd",
  "Emerald Green": "#18af7e",
  Champagne: "#f3d9aa",
  "Soft Gray": "#c9c7d0",
  Ivory: "#fff9eb",
  Terracotta: "#cf744f",
  Plum: "#9b2e70",
  Aqua: "#69ddd6",
  "Baby Blue": "#bce3f8",
  "Blush Pink": "#ffc5c2",
  Caramel: "#d7832f",
  "Olive Green": "#767e3e",
  Burgundy: "#8e1734",
  "Midnight Blue": "#183d73",
  Apricot: "#ffc493",
  Mauve: "#c684a0",
  "Honey Beige": "#e8c58c",
};

const JEWELRY_ASSETS: Record<string, string> = {
  "Gold Ring": "/lucky/jewelry/gold-ring.png?v=jewelry-clean-20260611",
  "Silver Ring": "/lucky/jewelry/silver-ring.png?v=jewelry-clean-20260611",
  "Pearl Earrings": "/lucky/jewelry/pearl-earrings.png?v=jewelry-clean-20260611",
  "Gold Necklace": "/lucky/jewelry/gold-necklace.png?v=jewelry-clean-20260611",
  "Silver Necklace": "/lucky/jewelry/silver-necklace.png?v=jewelry-clean-20260611",
  "Rose Quartz": "/lucky/jewelry/rose-quartz.png?v=jewelry-clean-20260611",
  Moonstone: "/lucky/jewelry/moonstone.png?v=jewelry-clean-20260611",
  Amethyst: "/lucky/jewelry/amethyst.png?v=jewelry-clean-20260611",
  "Pearl Bracelet": "/lucky/jewelry/pearl-bracelet.png?v=jewelry-clean-20260611",
  "Hoop Earrings": "/lucky/jewelry/hoop-earrings.png?v=jewelry-clean-20260611",
  "Star Necklace": "/lucky/jewelry/star-necklace.png?v=jewelry-clean-20260611",
  "Heart Pendant": "/lucky/jewelry/heart-pendant.png?v=jewelry-clean-20260611",
  "Crystal Earrings": "/lucky/jewelry/crystal-earrings.png?v=jewelry-clean-20260611",
  "Sapphire Ring": "/lucky/jewelry/sapphire-ring.png?v=jewelry-clean-20260611",
  "Emerald Pendant": "/lucky/jewelry/emerald-pendant.png?v=jewelry-clean-20260611",
  "Opal Ring": "/lucky/jewelry/opal-ring.png?v=jewelry-clean-20260611",
  "Silver Bangle": "/lucky/jewelry/silver-bangle.png?v=jewelry-clean-20260611",
  "Charm Bracelet": "/lucky/jewelry/charm-bracelet.png?v=jewelry-clean-20260611",
  "Butterfly Necklace": "/lucky/jewelry/butterfly-necklace.png?v=jewelry-clean-20260611",
  "Sun Pendant": "/lucky/jewelry/sun-pendant.png?v=jewelry-clean-20260611",
  "Moon Pendant": "/lucky/jewelry/moon-pendant.png?v=jewelry-clean-20260611",
  "Diamond Studs": "/lucky/jewelry/diamond-studs.png?v=jewelry-clean-20260611",
  "Rose Gold Ring": "/lucky/jewelry/rose-gold-ring.png?v=jewelry-clean-20260611",
  "Quartz Bracelet": "/lucky/jewelry/quartz-bracelet.png?v=jewelry-clean-20260611",
  "Zodiac Necklace": "/lucky/jewelry/zodiac-necklace.png?v=jewelry-clean-20260611",
  "Clover Charm": "/lucky/jewelry/clover-charm.png?v=jewelry-clean-20260611",
  "Shell Necklace": "/lucky/jewelry/shell-necklace.png?v=jewelry-clean-20260611",
  "Birthstone Ring": "/lucky/jewelry/birthstone-ring.png?v=jewelry-clean-20260611",
  "Gem Earrings": "/lucky/jewelry/gem-earrings.png?v=jewelry-clean-20260611",
  "Infinity Bracelet": "/lucky/jewelry/infinity-bracelet.png?v=jewelry-clean-20260611",
};

const FOOD_ASSETS: Record<string, string> = {
  "Bubble Tea": "/lucky/food/bubble-tea.png?v=food-cutout-20260610",
  Avocado: "/lucky/food/avocado.png?v=food-cutout-20260610",
  Strawberry: "/lucky/food/strawberry.png?v=food-cutout-20260610",
  Matcha: "/lucky/food/matcha.png?v=food-cutout-20260610",
  Croissant: "/lucky/food/croissant.png?v=food-cutout-20260610",
  Ramen: "/lucky/food/ramen.png?v=food-cutout-20260610",
  "Fried Rice": "/lucky/food/fried-rice.png?v=food-cutout-20260610",
  Sushi: "/lucky/food/sushi.png?v=food-cutout-20260610",
  Yogurt: "/lucky/food/yogurt.png?v=food-cutout-20260610",
  Chocolate: "/lucky/food/chocolate.png?v=food-cutout-20260610",
  Blueberries: "/lucky/food/blueberries.png?v=food-cutout-20260610",
  Salmon: "/lucky/food/salmon.png?v=food-cutout-20260610",
  "Iced Coffee": "/lucky/food/iced-coffee.png?v=food-cutout-20260610",
  Macarons: "/lucky/food/macarons.png?v=food-cutout-20260610",
  Donut: "/lucky/food/donut.png?v=food-cutout-20260610",
  Dumplings: "/lucky/food/dumplings.png?v=food-cutout-20260610",
  Mango: "/lucky/food/mango.png?v=food-cutout-20260610",
  Pancakes: "/lucky/food/pancakes.png?v=food-cutout-20260610",
  Tacos: "/lucky/food/tacos.png?v=food-cutout-20260610",
  Salad: "/lucky/food/salad.png?v=food-cutout-20260610",
  "Ice Cream": "/lucky/food/ice-cream.png?v=food-cutout-20260610",
  Cheesecake: "/lucky/food/cheesecake.png?v=food-cutout-20260610",
  "Acai Bowl": "/lucky/food/acai-bowl.png?v=food-cutout-20260610",
  Apple: "/lucky/food/apple.png?v=food-cutout-20260610",
  Grapes: "/lucky/food/grapes.png?v=food-cutout-20260610",
  Pasta: "/lucky/food/pasta.png?v=food-cutout-20260610",
  Waffles: "/lucky/food/waffles.png?v=food-cutout-20260610",
  "Honey Toast": "/lucky/food/honey-toast.png?v=food-cutout-20260610",
};

const CARRY_ASSETS: Record<string, string> = {
  "AirPods Case": "/lucky/carry/airpods-case.png?v=carry-safe-20260610",
  "Lip Balm": "/lucky/carry/lip-balm.png?v=carry-safe-20260610",
  "Hair Ties": "/lucky/carry/hair-ties.png?v=carry-safe-20260610",
  Phone: "/lucky/carry/phone.png?v=carry-safe-20260610",
  Sunglasses: "/lucky/carry/sunglasses.png?v=carry-safe-20260610",
  "Water Bottle": "/lucky/carry/water-bottle.png?v=carry-safe-20260610",
  Perfume: "/lucky/carry/perfume.png?v=carry-safe-20260610",
  "Canvas Bag": "/lucky/carry/canvas-bag.png?v=carry-safe-20260610",
  Notebook: "/lucky/carry/notebook.png?v=carry-safe-20260610",
  Keychain: "/lucky/carry/keychain.png?v=carry-safe-20260610",
  Lipstick: "/lucky/carry/lipstick.png?v=carry-safe-20260610",
  "Hand Cream": "/lucky/carry/hand-cream.png?v=carry-safe-20260610",
  Ring: "/lucky/carry/ring.png?v=carry-safe-20260610",
  Bracelet: "/lucky/carry/bracelet.png?v=carry-safe-20260610",
  Necklace: "/lucky/carry/necklace.png?v=carry-safe-20260610",
  Mirror: "/lucky/carry/mirror.png?v=carry-safe-20260610",
  Charger: "/lucky/carry/charger.png?v=carry-safe-20260610",
  Wallet: "/lucky/carry/wallet.png?v=carry-safe-20260610",
  Scrunchie: "/lucky/carry/scrunchie.png?v=carry-safe-20260610",
  "Claw Clip": "/lucky/carry/claw-clip.png?v=carry-safe-20260610",
  Camera: "/lucky/carry/camera.png?v=carry-safe-20260610",
  "Earbuds Case": "/lucky/carry/earbuds-case.png?v=carry-safe-20260610",
  "Makeup Bag": "/lucky/carry/makeup-bag.png?v=carry-safe-20260610",
  "Crystal Charm": "/lucky/carry/crystal-charm.png?v=carry-safe-20260610",
  "Coin Purse": "/lucky/carry/coin-purse.png?v=carry-safe-20260610",
  Pen: "/lucky/carry/pen.png?v=carry-safe-20260610",
  "Mini Plush": "/lucky/carry/mini-plush.png?v=carry-safe-20260610",
  "Travel Mug": "/lucky/carry/travel-mug.png?v=carry-safe-20260610",
  Glasses: "/lucky/carry/glasses.png?v=carry-safe-20260610",
  Headphones: "/lucky/carry/headphones.png?v=carry-safe-20260610",
};

const FLOWER_ASSETS: Record<string, string> = {
  Sunflower: "/lucky/flower/sunflower.png?v=flower-fit-20260611b",
  Rose: "/lucky/flower/rose.png?v=flower-fit-20260611b",
  Tulip: "/lucky/flower/tulip.png?v=flower-fit-20260611b",
  Daisy: "/lucky/flower/daisy.png?v=flower-fit-20260611b",
  Lavender: "/lucky/flower/lavender.png?v=flower-fit-20260611b",
  Peony: "/lucky/flower/peony.png?v=flower-fit-20260611b",
  Lily: "/lucky/flower/lily.png?v=flower-fit-20260611b",
  "Cherry Blossom": "/lucky/flower/cherry-blossom.png?v=flower-fit-20260611b",
  Hydrangea: "/lucky/flower/hydrangea.png?v=flower-fit-20260611b",
  Orchid: "/lucky/flower/orchid.png?v=flower-fit-20260611b",
  Jasmine: "/lucky/flower/jasmine.png?v=flower-fit-20260611b",
  Camellia: "/lucky/flower/camellia.png?v=flower-fit-20260611b",
  Iris: "/lucky/flower/iris.png?v=flower-fit-20260611b",
  Magnolia: "/lucky/flower/magnolia.png?v=flower-fit-20260611b",
  Dandelion: "/lucky/flower/dandelion.png?v=flower-fit-20260611b",
  Marigold: "/lucky/flower/marigold.png?v=flower-fit-20260611b",
  "Baby's Breath": "/lucky/flower/babys-breath.png?v=flower-fit-20260611b",
  Gardenia: "/lucky/flower/gardenia.png?v=flower-fit-20260611b",
  Lotus: "/lucky/flower/lotus.png?v=flower-fit-20260611b",
  "Poppy Seed": "/lucky/flower/poppy-seed.png?v=flower-fit-20260611b",
  "Pink Camellia": "/lucky/flower/pink-camellia.png?v=flower-fit-20260611b",
  "Forget-Me-Not": "/lucky/flower/forget-me-not.png?v=flower-fit-20260611b",
  Hibiscus: "/lucky/flower/hibiscus.png?v=flower-fit-20260611b",
  Ranunculus: "/lucky/flower/ranunculus.png?v=flower-fit-20260611c",
  Anemone: "/lucky/flower/anemone.png?v=flower-fit-20260611b",
  "Sweet Pea": "/lucky/flower/sweet-pea.png?v=flower-fit-20260611b",
  Cosmos: "/lucky/flower/cosmos.png?v=flower-fit-20260611b",
  Snapdragon: "/lucky/flower/snapdragon.png?v=flower-fit-20260611b",
  "Morning Glory": "/lucky/flower/morning-glory.png?v=flower-fit-20260611b",
  Freesia: "/lucky/flower/freesia.png?v=flower-fit-20260611b",
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function mixHex(hex: string, target: string, amount: number) {
  const from = hexToRgb(hex);
  const to = hexToRgb(target);
  const channel = (start: number, end: number) => Math.round(start + (end - start) * amount);

  return `rgb(${channel(from.r, to.r)}, ${channel(from.g, to.g)}, ${channel(from.b, to.b)})`;
}

function Svg({ size, children, label }: { size: number; children: ReactNode; label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto block shrink-0 overflow-visible"
      style={{ background: "transparent", border: "none", boxShadow: "none" }}
    >
      {children}
    </svg>
  );
}

function IconSurface({ size, children, label }: { size: number; children: ReactNode; label: string }) {
  const surfaceSize = Math.round(size * 1.24);

  return (
    <span
      role="img"
      aria-label={label}
      className="mx-auto flex shrink-0 items-center justify-center"
      style={{
        width: surfaceSize,
        height: surfaceSize,
        borderRadius: Math.round(surfaceSize * 0.2),
        background: "var(--hint-lucky-icon-bg, #fffdf8)",
        border: "1px solid var(--hint-lucky-icon-border, rgba(255,255,255,0.88))",
        boxShadow: "var(--hint-lucky-icon-shadow, 0 1px 3px rgba(37, 30, 45, 0.12))",
      }}
    >
      {children}
    </span>
  );
}

function ColorSwatch({ value, size }: { value: string; size: number }) {
  const color = LUCKY_COLOR_SWATCHES[value] ?? "#9bd4d8";
  const light = mixHex(color, "#ffffff", 0.42);
  const dark = mixHex(color, "#000000", 0.18);

  return (
    <span
      role="img"
      aria-label={value}
      className="relative mx-auto block shrink-0"
      style={{
        width: size,
        height: size,
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2"
        style={{
          width: Math.round(size * 0.72),
          height: Math.round(size * 0.72),
          borderRadius: Math.round(size * 0.18),
          background: `linear-gradient(145deg, ${light} 0%, ${color} 54%, ${dark} 100%)`,
          boxShadow: "inset 0 1.5px 2px rgba(255,255,255,0.42), inset 0 -2px 3px rgba(0,0,0,0.14), 0 2px 4px var(--hint-lucky-swatch-shadow, rgba(30,24,38,0.18))",
        }}
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-[21%] block -translate-x-1/2"
        style={{
          width: Math.round(size * 0.5),
          height: Math.round(size * 0.25),
          borderRadius: Math.round(size * 0.14),
          background: "linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0))",
        }}
      />
    </span>
  );
}

function LuckyNumber({ value, size }: { value: string; size: number }) {
  const [first, second] = value.split("and").map((part) => part.trim());

  return (
    <Svg size={size} label={value}>
      <text
        x="28"
        y="38"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="34"
        fontWeight="600"
        fill={iconInk}
      >
        {first}/{second}
      </text>
    </Svg>
  );
}

function JewelryImage({ value, size }: { value: string; size: number }) {
  const src = JEWELRY_ASSETS[value];
  const imageSize = Math.round(size * 0.92);

  if (!src) return <Jewelry value={value} size={size} />;

  return (
    <img
      src={src}
      alt={value}
      width={imageSize}
      height={imageSize}
      className="mx-auto block shrink-0 object-contain"
      style={{
        width: imageSize,
        height: imageSize,
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    />
  );
}

function FoodImage({ value, size }: { value: string; size: number }) {
  const src = FOOD_ASSETS[value];
  const imageSize = Math.round(size * 0.92);

  if (!src) return <Food value={value} size={size} />;

  return (
    <img
      src={src}
      alt={value}
      width={imageSize}
      height={imageSize}
      className="mx-auto block shrink-0 object-contain"
      style={{
        width: imageSize,
        height: imageSize,
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    />
  );
}

function CarryImage({ value, size }: { value: string; size: number }) {
  const src = CARRY_ASSETS[value];
  const imageSize = Math.round(size * 0.92);

  if (!src) return <Carry value={value} size={size} />;

  return (
    <img
      src={src}
      alt={value}
      width={imageSize}
      height={imageSize}
      className="mx-auto block shrink-0 object-contain"
      style={{
        width: imageSize,
        height: imageSize,
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    />
  );
}

function FlowerImage({ value, size }: { value: string; size: number }) {
  const src = FLOWER_ASSETS[value];
  const imageSize = Math.round(size * 0.82);

  if (!src) return <Flower value={value} size={size} />;

  return (
    <img
      src={src}
      alt={value}
      width={imageSize}
      height={imageSize}
      className="mx-auto block shrink-0 object-contain"
      style={{
        width: imageSize,
        height: imageSize,
        background: "transparent",
        border: "none",
        boxShadow: "none",
      }}
    />
  );
}

function Chain({ metal }: { metal: string }) {
  return (
    <g stroke={metal} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8C15 22 20 29 28 30C36 29 41 22 44 8" strokeWidth="2.2" />
      {Array.from({ length: 8 }, (_, index) => {
        const leftX = 13.5 + index * 1.55;
        const rightX = 42.5 - index * 1.55;
        const y = 10 + index * 2.35;

        return (
          <g key={index}>
            <ellipse cx={leftX} cy={y} rx="1.1" ry="1.7" fill="none" strokeWidth="0.8" transform={`rotate(-22 ${leftX} ${y})`} />
            <ellipse cx={rightX} cy={y} rx="1.1" ry="1.7" fill="none" strokeWidth="0.8" transform={`rotate(22 ${rightX} ${y})`} />
          </g>
        );
      })}
    </g>
  );
}

function SparkStone({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth="1.4" />
      <circle cx={cx - r * 0.28} cy={cy - r * 0.34} r={r * 0.3} fill="rgba(255,255,255,0.72)" />
      <path d={`M${cx - r * 0.75} ${cy}H${cx + r * 0.75}M${cx} ${cy - r * 0.75}V${cy + r * 0.75}`} stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}

function TeardropGem({ fill, metal }: { fill: string; metal: string }) {
  return (
    <g>
      <path d="M28 19C36 27 39 34 35 41C31 48 20 48 21 37C21.5 31 25 24 28 19Z" fill={fill} stroke={metal} strokeWidth="2.4" />
      <path d="M27 25C31 29 33 34 31 39" stroke="rgba(255,255,255,0.62)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 20H32" stroke={metal} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Jewelry({ value, size }: { value: string; size: number }) {
  const isGold = /Gold|Sun|Clover|Shell|Zodiac|Emerald|Sapphire|Birthstone|Gem|Crystal|Pearl|Hoop/i.test(value);
  const metal = isGold ? gold : /Rose/i.test(value) ? "#df9a86" : silver;
  const gem = /Emerald/i.test(value) ? "#16a874" : /Sapphire/i.test(value) ? "#2f67c8" : /Amethyst/i.test(value) ? "#8f54c7" : /Moonstone|Opal/i.test(value) ? "#bde0ff" : /Birthstone/i.test(value) ? "#6fd8e8" : /Quartz|Rose/i.test(value) ? "#f2a6b8" : cream;

  return (
    <Svg size={size} label={value}>
      {/Earrings|Studs/i.test(value) ? (
        /Hoop/i.test(value) ? (
          <>
            <ellipse cx="20" cy="28" rx="7" ry="13" fill="none" stroke={metal} strokeWidth="4" />
            <ellipse cx="36" cy="28" rx="7" ry="13" fill="none" stroke={metal} strokeWidth="4" />
            <path d="M17 16C19 14 22 14 24 16M33 16C35 14 38 14 40 16" stroke="rgba(255,255,255,0.48)" strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : /Pearl/i.test(value) ? (
          <>
            <circle cx="20" cy="28" r="8.5" fill={cream} stroke={metal} strokeWidth="1.8" />
            <circle cx="36" cy="28" r="8.5" fill={cream} stroke={metal} strokeWidth="1.8" />
            <circle cx="17" cy="25" r="2.3" fill="rgba(255,255,255,0.78)" />
            <circle cx="33" cy="25" r="2.3" fill="rgba(255,255,255,0.78)" />
            <path d="M20 18V13M36 18V13" stroke={metal} strokeWidth="2" strokeLinecap="round" />
          </>
        ) : /Diamond/i.test(value) ? (
          <>
            <SparkStone cx={20} cy={28} r={7.5} fill="#edf7ff" />
            <SparkStone cx={36} cy={28} r={7.5} fill="#edf7ff" />
          </>
        ) : (
          <>
            <SparkStone cx={19} cy={22} r={5.3} fill={/Crystal/i.test(value) ? "#edf7ff" : "#22a875"} />
            <SparkStone cx={37} cy={22} r={5.3} fill={/Crystal/i.test(value) ? "#edf7ff" : "#22a875"} />
            <path d="M19 28L15 41L23 41Z M37 28L33 41L41 41Z" fill={/Crystal/i.test(value) ? "#dfefff" : "#1aa26f"} stroke={metal} strokeWidth="1.6" />
          </>
        )
      ) : /Bracelet|Bangle/i.test(value) ? (
        /Pearl/i.test(value) || /Quartz/i.test(value) ? (
          <>
            {Array.from({ length: 14 }, (_, index) => {
              const angle = (Math.PI * 2 * index) / 14;
              const x = 28 + Math.cos(angle) * 15;
              const y = 29 + Math.sin(angle) * 10;
              return <circle key={index} cx={x} cy={y} r={/Pearl/i.test(value) ? 3.7 : 3.5} fill={/Pearl/i.test(value) ? cream : "#efb6c3"} stroke={metal} strokeWidth="0.9" />;
            })}
            <circle cx="22" cy="25" r="1.3" fill="rgba(255,255,255,0.72)" />
          </>
        ) : /Infinity/i.test(value) ? (
          <>
            <path d="M11 30C16 21 23 20 28 30C33 20 40 21 45 30C40 39 33 40 28 30C23 40 16 39 11 30Z" fill="none" stroke={metal} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 30C20 14 36 46 44 30" stroke="rgba(255,255,255,0.44)" strokeWidth="1.3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M13 31C13 20 21 14 30 15C39 16 45 25 42 35C39 45 25 47 17 40" fill="none" stroke={metal} strokeWidth="4" strokeLinecap="round" />
            {/Charm/i.test(value) && (
              <>
                <path d="M17 39L15 44L12 40L8 40L11 36L10 31L15 34L20 31L18 36L22 40Z" fill={silver} stroke={stroke} strokeWidth="1" />
                <path d="M28 40C25 37 23 35 24 32C25 29 28 30 28 33C29 30 32 29 33 32C34 35 31 37 28 40Z" fill={blush} stroke={stroke} strokeWidth="1" />
                <path d="M39 34C36 30 32 33 34 37C30 35 28 40 32 42C30 46 36 47 37 42C39 47 45 46 43 42C47 40 45 35 41 37C43 33 39 30 39 34Z" fill={mint} stroke={stroke} strokeWidth="1" />
              </>
            )}
          </>
        )
      ) : /Necklace|Pendant|Rose Quartz|Amethyst|Clover/i.test(value) ? (
        <>
          {/Clover/i.test(value) ? null : <Chain metal={metal} />}
          {/Heart/i.test(value) ? (
            <path d="M28 44C20 37 17 32 20 27C22.5 23 27 24 28 29C29 24 33.5 23 36 27C39 32 36 37 28 44Z" fill={/Silver|Heart/i.test(value) ? "#e8edf3" : blush} stroke={metal} strokeWidth="2" />
          ) : /Star/i.test(value) ? (
            <>
              <path d="M28 23L31.5 31L40 32L33.5 37.5L35.5 46L28 41.5L20.5 46L22.5 37.5L16 32L24.5 31Z" fill={butter} stroke={metal} strokeWidth="2" />
              <path d="M24 33L32 41M32 33L24 41" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
            </>
          ) : /Moon/i.test(value) ? (
            <path d="M35 23C28 25 25 36 32 43C24 41 19 34 22 26C25 18 32 17 38 21C37 21.5 36 22 35 23Z" fill="#dfe6ef" stroke={metal} strokeWidth="2" />
          ) : /Butterfly/i.test(value) ? (
            <>
              <path d="M27 34C21 24 14 27 17 36C20 44 26 39 28 34C30 39 36 44 39 36C42 27 35 24 29 34Z" fill="#dfe6ef" stroke={metal} strokeWidth="1.8" />
              <path d="M28 29V43" stroke={metal} strokeWidth="1.6" strokeLinecap="round" />
            </>
          ) : /Shell/i.test(value) ? (
            <>
              <path d="M18 43C20 30 27 24 28 24C29 24 36 30 38 43H18Z" fill={peach} stroke={metal} strokeWidth="2" />
              <path d="M22 41C24 33 27 27 28 24M28 43V25M34 41C32 33 29 27 28 24" stroke="rgba(255,255,255,0.52)" strokeWidth="1.2" strokeLinecap="round" />
            </>
          ) : /Sun/i.test(value) ? (
            <>
              <circle cx="28" cy="35" r="8.5" fill={butter} stroke={metal} strokeWidth="2" />
              {Array.from({ length: 12 }, (_, index) => {
                const angle = (Math.PI * 2 * index) / 12;
                return <path key={index} d={`M${28 + Math.cos(angle) * 11} ${35 + Math.sin(angle) * 11}L${28 + Math.cos(angle) * 15} ${35 + Math.sin(angle) * 15}`} stroke={metal} strokeWidth="2" strokeLinecap="round" />;
              })}
            </>
          ) : /Zodiac/i.test(value) ? (
            <>
              <circle cx="28" cy="36" r="12" fill="#e3b75f" stroke={metal} strokeWidth="2" />
              <path d="M28 27V36L35 40" stroke="#5d4029" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M21 34H23M33 29H35M24 43L26 41M37 36H39" stroke="#5d4029" strokeWidth="1.4" strokeLinecap="round" />
            </>
          ) : /Amethyst/i.test(value) ? (
            <>
              <path d="M28 20L37 27L32 46H24L19 27Z" fill="#8f54c7" stroke={metal} strokeWidth="2" />
              <path d="M28 20V46M20 27H36M24 46L28 27L32 46" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeLinecap="round" />
              <path d="M23 20H33" stroke={metal} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : /Clover/i.test(value) ? (
            <path d="M28 27C25 22 18 25 21 31C15 28 12 36 19 38C15 44 24 48 27 40C30 48 39 44 35 38C42 36 39 28 33 31C36 25 31 22 28 27Z" fill={gold} stroke="#9b6a2d" strokeWidth="1.8" />
          ) : /Emerald|Quartz|Rose/i.test(value) ? (
            <TeardropGem fill={gem} metal={metal} />
          ) : (
            <SparkStone cx={28} cy={36} r={9} fill={gem} />
          )}
        </>
      ) : /Rose Gold Ring/i.test(value) ? (
        <>
          <ellipse cx="28" cy="31" rx="17" ry="10" fill="none" stroke="#d99a84" strokeWidth="4" transform="rotate(-18 28 31)" />
          <path d="M15 33C21 21 33 18 42 25" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="28" cy="33" rx="16" ry="10" fill="none" stroke={metal} strokeWidth="4" transform="rotate(-18 28 33)" />
          <path d="M16 35C22 24 34 21 41 27" stroke="rgba(255,255,255,0.42)" strokeWidth="1.5" strokeLinecap="round" />
          {/Gold/i.test(value) ? (
            <SparkStone cx={29} cy={18} r={5.8} fill="#edf7ff" />
          ) : /Opal|Moonstone/i.test(value) ? (
            <SparkStone cx={29} cy={18} r={7} fill={gem} />
          ) : (
            <SparkStone cx={29} cy={18} r={6.5} fill={gem} />
          )}
        </>
      )}
    </Svg>
  );
}

function Food({ value, size }: { value: string; size: number }) {
  return (
    <Svg size={size} label={value}>
      {/Bubble Tea|Coffee|Matcha|Green Tea/i.test(value) ? (
        <>
          <path d="M20 18H36L34 45H22L20 18Z" fill={/Matcha|Green Tea/i.test(value) ? sage : /Coffee/i.test(value) ? mocha : "#d7a06b"} stroke={stroke} strokeWidth="2" />
          <path d="M19 18H37" stroke={cream} strokeWidth="5" strokeLinecap="round" />
          {/Bubble/i.test(value) && <><circle cx="25" cy="38" r="2.2" fill={ink} /><circle cx="31" cy="40" r="2.2" fill={ink} /></>}
          <path d="M34 7L30 18" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        </>
      ) : /Avocado/i.test(value) ? (
        <>
          <path d="M31 9C20 12 15 26 20 38C24 48 39 47 43 36C47 26 40 14 31 9Z" fill="#78b95e" stroke={stroke} strokeWidth="2" />
          <path d="M31 16C24 18 22 28 25 36C28 42 38 41 40 34C42 27 37 19 31 16Z" fill="#dceaa0" />
          <circle cx="33" cy="34" r="5" fill="#9a6742" />
        </>
      ) : /Strawberry/i.test(value) ? (
        <>
          <path d="M28 15C17 13 13 21 18 32C21 39 28 45 28 45C28 45 35 39 38 32C43 21 39 13 28 15Z" fill={rose} stroke={stroke} strokeWidth="2" />
          <path d="M23 15L28 8L33 15" stroke={sage} strokeWidth="4" strokeLinecap="round" />
          <circle cx="24" cy="27" r="1.3" fill={butter} /><circle cx="31" cy="31" r="1.3" fill={butter} /><circle cx="30" cy="23" r="1.3" fill={butter} />
        </>
      ) : /Croissant|Bagel|Donut|Macaron|Pancakes|Waffles|Honey Toast/i.test(value) ? (
        <>
          <path d="M12 32C18 19 38 19 44 32C39 42 18 42 12 32Z" fill={/Macaron/i.test(value) ? blush : /Donut/i.test(value) ? peach : butter} stroke={stroke} strokeWidth="2" />
          {/Donut|Bagel/i.test(value) && <circle cx="28" cy="32" r="6" fill="var(--hint-page-bg)" stroke={stroke} strokeWidth="1.6" />}
          {/Waffles|Honey Toast|Pancakes/i.test(value) && <path d="M18 29H38M20 36H36M24 24V40M32 24V40" stroke="var(--hint-lucky-soft-line, rgba(91,83,101,0.42))" strokeWidth="1.6" strokeLinecap="round" />}
        </>
      ) : /Sushi|Salmon|Ramen|Dumplings|Tacos|Fried Rice|Pasta|Salad|Acai Bowl|Yogurt/i.test(value) ? (
        <>
          <path d="M13 32C13 43 43 43 43 32H13Z" fill={/Tacos/i.test(value) ? butter : cream} stroke={stroke} strokeWidth="2" />
          <path d="M16 31C19 22 37 22 40 31" fill={/Salad/i.test(value) ? mint : /Ramen|Pasta|Fried/i.test(value) ? "#f0c87a" : /Salmon|Sushi/i.test(value) ? rose : lavender} stroke={stroke} strokeWidth="2" />
          {/Ramen|Pasta/i.test(value) && <path d="M21 28C25 32 31 24 36 28" stroke={cream} strokeWidth="2" strokeLinecap="round" />}
          {/Sushi|Salmon/i.test(value) && <path d="M20 26H36" stroke={cream} strokeWidth="3" strokeLinecap="round" />}
        </>
      ) : (
        <>
          <path d="M18 21C22 13 34 13 38 21C44 33 35 44 28 44C21 44 12 33 18 21Z" fill={/Mango|Peach|Apple|Grapes|Blueberries/i.test(value) ? peach : blush} stroke={stroke} strokeWidth="2" />
          {/Grapes|Blueberries/i.test(value) && [0, 1, 2, 3, 4].map((dot) => <circle key={dot} cx={22 + (dot % 3) * 6} cy={26 + Math.floor(dot / 3) * 7} r="4" fill={/Grapes/i.test(value) ? "#9c76c6" : "#5d8fd1"} />)}
        </>
      )}
    </Svg>
  );
}

function Carry({ value, size }: { value: string; size: number }) {
  return (
    <Svg size={size} label={value}>
      {/AirPods|Earbuds/i.test(value) ? (
        <><path d="M21 12C16 12 14 16 15 21C16 25 20 25 22 22V42" stroke={cream} strokeWidth="6" strokeLinecap="round" /><path d="M35 12C40 12 42 16 41 21C40 25 36 25 34 22V42" stroke={cream} strokeWidth="6" strokeLinecap="round" /><path d="M22 42V31M34 42V31" stroke={silver} strokeWidth="2" strokeLinecap="round" /></>
      ) : /Lip Balm|Lipstick|Perfume|Hand Cream|Makeup/i.test(value) ? (
        <><path d="M22 22H34V45H22V22Z" fill={/Perfume/i.test(value) ? sky : blush} stroke={stroke} strokeWidth="2" /><path d="M24 12H32V22H24V12Z" fill={/Lipstick/i.test(value) ? rose : cream} stroke={stroke} strokeWidth="2" /><path d="M25 12C26 7 30 7 31 12" stroke={stroke} strokeWidth="2" strokeLinecap="round" /></>
      ) : /Phone|Kindle/i.test(value) ? (
        <><rect x="19" y="8" width="18" height="40" rx="5" fill={/Kindle/i.test(value) ? "#dce4e5" : sky} stroke={stroke} strokeWidth="2" /><path d="M23 15H33M23 20H33M23 25H31" stroke="var(--hint-lucky-soft-line, rgba(63,57,72,0.42))" strokeWidth="1.6" strokeLinecap="round" /><circle cx="28" cy="43" r="1.6" fill={cream} /></>
      ) : /Mirror/i.test(value) ? (
        <><ellipse cx="28" cy="21" rx="13" ry="15" fill={silver} stroke={stroke} strokeWidth="2.2" /><path d="M28 36V48" stroke={stroke} strokeWidth="6" strokeLinecap="round" /><path d="M22 16C25 12 31 12 35 16" stroke={cream} strokeWidth="3.4" strokeLinecap="round" /></>
      ) : /Sunglasses/i.test(value) ? (
        <><path d="M12 25C16 22 22 23 25 26C27 23 29 23 31 26C34 23 40 22 44 25C43 34 34 35 31 28C29 26 27 26 25 28C22 35 13 34 12 25Z" fill="#4f6f88" stroke={stroke} strokeWidth="2" /></>
      ) : /Tote|Wallet|Coin Purse/i.test(value) ? (
        <><path d="M16 22H40L37 45H19L16 22Z" fill={/Wallet|Purse/i.test(value) ? peach : cream} stroke={stroke} strokeWidth="2" /><path d="M22 22C22 13 34 13 34 22" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" /></>
      ) : /Bottle|Travel Mug/i.test(value) ? (
        <><path d="M21 18H35L34 47H22L21 18Z" fill={sky} stroke={stroke} strokeWidth="2" /><path d="M24 9H32V18H24V9Z" fill={silver} stroke={stroke} strokeWidth="2" /><path d="M23 31H34" stroke={cream} strokeWidth="2" strokeLinecap="round" /></>
      ) : /Hair Tie|Scrunchie|Claw Clip/i.test(value) ? (
        <><circle cx="28" cy="28" r="15" fill="none" stroke={blush} strokeWidth="7" /><path d="M18 19L38 37M38 19L18 37" stroke={stroke} strokeWidth="2" strokeLinecap="round" /></>
      ) : /Camera/i.test(value) ? (
        <><rect x="13" y="21" width="30" height="22" rx="5" fill={lavender} stroke={stroke} strokeWidth="2" /><circle cx="28" cy="32" r="7" fill={sky} stroke={stroke} strokeWidth="2" /><path d="M20 21L23 15H33L36 21" fill={lavender} stroke={stroke} strokeWidth="2" /></>
      ) : (
        <><path d="M28 11L32 22L44 22L34 29L38 42L28 34L18 42L22 29L12 22L24 22Z" fill={/Coin/i.test(value) ? gold : lavender} stroke={stroke} strokeWidth="2" /></>
      )}
    </Svg>
  );
}

function Flower({ value, size }: { value: string; size: number }) {
  const petal = /Sunflower|Marigold/i.test(value) ? butter : /Lavender|Violet|Iris|Lilac/i.test(value) ? lavender : /Daisy|Baby/i.test(value) ? cream : /Rose|Peony|Camellia|Ranunculus|Anemone/i.test(value) ? blush : /Tulip|Poppy|Hibiscus/i.test(value) ? rose : peach;
  const petals = /Peony|Ranunculus|Rose/i.test(value) ? 14 : /Lavender/i.test(value) ? 10 : 8;

  return (
    <Svg size={size} label={value}>
      <path d="M28 29C28 36 27 42 23 48" stroke={sage} strokeWidth="3" strokeLinecap="round" />
      <path d="M27 38C21 35 18 36 15 40C20 43 24 42 27 38Z" fill={mint} stroke={stroke} strokeWidth="1.5" />
      {/Tulip/i.test(value) ? (
        <path d="M18 28C18 17 24 13 28 22C32 13 38 17 38 28C38 37 18 37 18 28Z" fill={petal} stroke={stroke} strokeWidth="2" />
      ) : /Lavender/i.test(value) ? (
        Array.from({ length: petals }, (_, index) => <ellipse key={index} cx={24 + (index % 2) * 8} cy={13 + index * 2.5} rx="4" ry="6" fill={petal} stroke={stroke} strokeWidth="1" transform={`rotate(${index % 2 ? 22 : -22} ${24 + (index % 2) * 8} ${13 + index * 2.5})`} />)
      ) : (
        <>
          {Array.from({ length: petals }, (_, index) => (
            <ellipse
              key={index}
              cx="28"
              cy="21"
              rx={/Peony|Rose|Ranunculus/i.test(value) ? 7 : 6}
              ry={/Peony|Rose|Ranunculus/i.test(value) ? 13 : 11}
              fill={index % 2 ? petal : "#f6c5d0"}
              stroke={stroke}
              strokeWidth="1.2"
              transform={`rotate(${(360 / petals) * index} 28 28)`}
            />
          ))}
          <circle cx="28" cy="28" r={/Sunflower|Daisy/i.test(value) ? 6 : 4.5} fill={/Sunflower|Daisy/i.test(value) ? mocha : butter} stroke={stroke} strokeWidth="1.4" />
        </>
      )}
    </Svg>
  );
}

export function LuckyIllustration({ item, size = 56 }: LuckyIllustrationProps) {
  const illustration =
    item.key === "color" ? (
      <ColorSwatch value={item.value} size={size} />
    ) : item.key === "number" ? (
      <LuckyNumber value={item.value} size={size} />
    ) : item.key === "jewelry" ? (
      <JewelryImage value={item.value} size={size} />
    ) : item.key === "food" ? (
      <FoodImage value={item.value} size={size} />
    ) : item.key === "carry" ? (
      <CarryImage value={item.value} size={size} />
    ) : (
      <FlowerImage value={item.value} size={size} />
    );

  return (
    <IconSurface size={size} label={item.value}>
      {illustration}
    </IconSurface>
  );
}
