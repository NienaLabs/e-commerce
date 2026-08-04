/**
 * One place that decides which 3D icon and filter schema a category gets.
 * ──────────────────────────────────────────────────────────────────────
 * This mapping used to live in three places — the hardcoded CATEGORIES list on
 * the home screen, the slug matcher that maps live DB categories, and the
 * all-categories screen — and all three disagreed. "Automotive" got a football,
 * "Books" got a t-shirt, and the DB matcher only knew 8 of the 19 filter
 * schemas, so most categories silently fell back to generic filters.
 *
 * Adding an icon is now a one-line change here.
 */

// ── The icons we actually have art for ───────────────────────────────
const HEADPHONES = require('@/assets/3d icons/3d-headphones.png');
const CLOTHES = require('@/assets/3d icons/3d-clothes.png');
const HOUSE = require('@/assets/3d icons/3d-house.png');
const WATCH = require('@/assets/3d icons/3d-watch.png');
const SPORTS = require('@/assets/3d icons/3d-sports.png');
const FOOD = require('@/assets/3d icons/3d-food.png');
const BEAUTY = require('@/assets/3d icons/3d-beauty.png');
const HEALTH = require('@/assets/3d icons/3d-health.png');
const AUTOMOTIVE = require('@/assets/3d icons/3d-automotives.png');
const ARTS = require('@/assets/3d icons/3d-arts.png');
const PHONE = require('@/assets/3d icons/3d-phone.png');
const LAPTOP = require('@/assets/3d icons/3d-laptop.png');
const CAMERA = require('@/assets/3d icons/3d-camera.png');
const GAMING = require('@/assets/3d icons/3d-gaming.png');
const BOOKS = require('@/assets/3d icons/3d-books.png');
const TOYS = require('@/assets/3d icons/3d-toys.png');
const PETS = require('@/assets/3d icons/3d-pets.png');

export interface CategoryVisual {
  /** Image source, or undefined when no icon exists for this category yet. */
  icon?: any;
  /** Key into filterSchemas.ts — decides which filters the sheet offers. */
  schemaKey: string;
}

/**
 * Ordered rules, most specific first. Order is load-bearing: "Home Appliances"
 * must be tested before "Home", "Beauty" before "Health", and "Outdoors"
 * before "Sports", or the broader rule swallows the narrower one.
 *
 * `icon: undefined` means we have no art for it yet — the card falls back to a
 * neutral glyph rather than borrowing a misleading icon. See MISSING_ICONS.
 */
const RULES: { test: RegExp; schemaKey: string; icon?: any }[] = [
  { test: /phone|smartphone|mobile/, schemaKey: 'phones', icon: PHONE },
  { test: /computer|laptop|tablet|\bpc\b/, schemaKey: 'computers', icon: LAPTOP },
  { test: /camera|photograph/, schemaKey: 'cameras', icon: CAMERA },
  { test: /gam(e|ing)|console/, schemaKey: 'gaming', icon: GAMING },
  { test: /book|stationer|magazine/, schemaKey: 'books', icon: BOOKS },
  { test: /toy|hobb/, schemaKey: 'toys', icon: TOYS },
  { test: /\bpets?\b/, schemaKey: 'pet_supplies', icon: PETS },
  { test: /wearable|watch|jewel/, schemaKey: 'wearables', icon: WATCH },
  // 'beauty' is the Accessories schema — watches, bags, jewellery, sunglasses.
  // Confusing name, but it's the id the rest of the app already uses.
  { test: /accessor/, schemaKey: 'beauty', icon: WATCH },
  // Beauty is tested BEFORE health on purpose: a combined "Health & Beauty"
  // aisle matches here and gets the cosmetics icon, while a standalone
  // "Health" / "Pharmacy" / "Wellness" falls through to the rule below and
  // gets its own. Both share the health_beauty filter schema, which covers
  // skincare through supplements.
  { test: /beaut|cosmetic|makeup|skincare|haircare|fragrance/, schemaKey: 'health_beauty', icon: BEAUTY },
  { test: /health|wellness|pharmac|supplement|personal care/, schemaKey: 'health_beauty', icon: HEALTH },
  { test: /appliance/, schemaKey: 'home_appliances', icon: HOUSE },
  { test: /outdoor|camping|hiking/, schemaKey: 'outdoor', icon: SPORTS },
  { test: /sport|fitness|\bgym\b/, schemaKey: 'sports', icon: SPORTS },
  { test: /electronic|audio|headphone/, schemaKey: 'electronics', icon: HEADPHONES },
  { test: /fashion|cloth|apparel|shoe|wear\b/, schemaKey: 'fashion', icon: CLOTHES },
  { test: /food|grocer|beverage|drink|snack/, schemaKey: 'food', icon: FOOD },
  { test: /auto|\bcars?\b|vehicle|motor/, schemaKey: 'automotive', icon: AUTOMOTIVE },
  { test: /\barts?\b|craft|collectib|handmade/, schemaKey: 'art_crafts', icon: ARTS },
  { test: /home|furnitur|living|kitchen|decor/, schemaKey: 'home', icon: HOUSE },
];

/** Direct lookup for the hardcoded lists, which already use schema keys as ids. */
const BY_SCHEMA_KEY: Record<string, any> = {
  electronics: HEADPHONES,
  fashion: CLOTHES,
  home: HOUSE,
  home_appliances: HOUSE,
  wearables: WATCH,
  beauty: WATCH,
  health_beauty: BEAUTY,
  health: HEALTH,
  sports: SPORTS,
  outdoor: SPORTS,
  food: FOOD,
  automotive: AUTOMOTIVE,
  art_crafts: ARTS,
  phones: PHONE,
  computers: LAPTOP,
  cameras: CAMERA,
  gaming: GAMING,
  books: BOOKS,
  toys: TOYS,
  pet_supplies: PETS,
};

/**
 * Resolve a category's icon and filter schema from its slug or display name.
 * Always safe to call — an unrecognised category yields no icon and the
 * 'default' filter schema.
 */
export function resolveCategory(slugOrName: string | null | undefined): CategoryVisual {
  if (!slugOrName) return { schemaKey: 'default' };
  const s = slugOrName.toLowerCase();
  for (const rule of RULES) {
    if (rule.test.test(s)) return { icon: rule.icon, schemaKey: rule.schemaKey };
  }
  return { schemaKey: 'default' };
}

/** Icon for a known schema key, or undefined when we have no art for it. */
export function iconForSchemaKey(schemaKey: string): any | undefined {
  return BY_SCHEMA_KEY[schemaKey];
}

/**
 * Categories that have a filter schema but no 3D icon yet — they fall back to
 * the neutral glyph in CategoryCard. Every schema key currently has art; add
 * to this list only as documentation if a new schema lands without an icon.
 */
export const MISSING_ICONS: readonly string[] = [];
