// One-time enrichment script: generates one AI photo per ingredient/equipment item via the
// Gemini API's Imagen model, saves it to public/ingredient-photos/, and writes a lookup to
// src/data/ingredientImages.ts (keyed by the same `query` used in ingredients.ts). Not part of
// the shipped app / not run automatically.
//
// Usage:
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --category=frango
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --category=frango,bovinos
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --all
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --test   (single item, no file writes)
//
// Categories: frango, bovinos, suinos, peixes, embutidos, graos, frutas, legumes, verduras,
// vegetais, enlatados, condimentos, temperos, molhos, equipamentos

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable.');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'ingredient-photos');
const OUTPUT_TS = path.join(__dirname, '..', 'src', 'data', 'ingredientImages.ts');
const EXISTING_TS = existsSync(OUTPUT_TS) ? readFileSync(OUTPUT_TS, 'utf-8') : null;

// query -> { label, kind } — "kind" tweaks the prompt template (food close-up vs. appliance).
// One entry per item across ALIMENTOS_TABS / CONDIMENTOS / TEMPEROS / MOLHOS / EQUIPAMENTOS.
const CATEGORIES = {
  frango: {
    chicken: 'whole raw chicken',
    'chicken breast': 'raw chicken breast fillet',
    'chicken thigh': 'raw chicken thigh',
    'chicken drumstick': 'raw chicken drumstick',
    'chicken wings': 'raw chicken wings',
    'chicken heart': 'raw chicken hearts',
  },
  bovinos: {
    picanha: 'raw picanha beef cut',
    'top sirloin': 'raw top sirloin steak',
    'beef tenderloin': 'raw beef tenderloin',
    ribeye: 'raw ribeye steak',
    patinho: 'raw beef round cut',
    maminha: 'raw beef sirloin cap',
    'flank steak': 'raw flank steak',
    cupim: 'raw beef hump cut',
    lagarto: 'raw beef eye of round',
    'chuck roast': 'raw beef chuck roast',
    'beef shank': 'raw beef shank',
    'beef ribs': 'raw beef ribs',
    'ground beef': 'raw ground beef',
    'dried beef': 'dried salted beef jerky',
    'sun-dried beef': 'brazilian sun-dried beef carne de sol',
    liver: 'raw beef liver',
  },
  suinos: {
    pork: 'raw pork meat cut',
    'pork loin': 'raw pork loin',
    'pork leg': 'raw pork leg roast',
    'pork chop': 'raw pork chop',
    'pork ribs': 'raw pork ribs',
    'pork belly': 'raw pork belly',
  },
  peixes: {
    fish: 'whole raw fish',
    tilapia: 'raw tilapia fillet',
    salmon: 'raw salmon fillet',
    tuna: 'raw tuna steak',
    sardine: 'fresh sardines',
    shrimp: 'raw shrimp',
  },
  embutidos: {
    bacon: 'raw bacon strips',
    'pork sausage': 'brazilian pork sausage linguica',
    sausage: 'sausages',
    mortadella: 'sliced mortadella',
    ham: 'sliced ham',
    turkey: 'sliced turkey breast',
  },
  graos: {
    rice: 'raw white rice grains',
    'brown rice': 'raw brown rice grains',
    'pinto beans': 'raw pinto beans',
    'black beans': 'raw black beans',
    'black-eyed peas': 'raw black-eyed peas',
    lentils: 'raw lentils',
    chickpeas: 'raw chickpeas',
    pasta: 'raw pasta',
    quinoa: 'raw quinoa grains',
    oats: 'raw rolled oats',
    popcorn: 'popcorn kernels',
    bread: 'loaf of bread',
  },
  frutas: {
    banana: 'fresh bananas',
    apple: 'fresh red apple',
    lemon: 'fresh lemons',
    orange: 'fresh oranges',
    tangerine: 'fresh tangerines',
    pineapple: 'fresh pineapple',
    mango: 'fresh mango',
    strawberry: 'fresh strawberries',
    grape: 'fresh grapes',
    avocado: 'fresh avocado halved',
    coconut: 'fresh whole coconut',
    watermelon: 'fresh watermelon slice',
    melon: 'fresh melon slice',
    papaya: 'fresh papaya halved',
    'passion fruit': 'fresh passion fruit halved',
    guava: 'fresh guava halved',
    peach: 'fresh peach',
    pear: 'fresh pear',
    kiwi: 'fresh kiwi halved',
    cherry: 'fresh cherries',
    plum: 'fresh plums',
    'cashew fruit': 'fresh cashew fruit',
    acerola: 'fresh acerola cherries',
    lychee: 'fresh lychee fruit',
  },
  legumes: {
    potato: 'fresh potatoes',
    'sweet potato': 'fresh sweet potatoes',
    arracacha: 'fresh arracacha root peruvian parsnip',
    carrot: 'fresh carrots',
    onion: 'fresh onions',
    garlic: 'fresh garlic bulb',
    beet: 'fresh beets',
    cassava: 'fresh cassava root',
    chayote: 'fresh chayote squash',
    yam: 'fresh yam root',
    taro: 'fresh taro root',
    turnip: 'fresh turnip',
    radish: 'fresh radishes',
    ginger: 'fresh ginger root',
  },
  verduras: {
    lettuce: 'fresh lettuce head',
    'collard greens': 'fresh collard greens',
    spinach: 'fresh spinach leaves',
    arugula: 'fresh arugula leaves',
    cabbage: 'fresh cabbage head',
    broccoli: 'fresh broccoli',
    cauliflower: 'fresh cauliflower',
    watercress: 'fresh watercress',
    chard: 'fresh swiss chard',
    escarole: 'fresh escarole leaves',
    'batavia lettuce': 'fresh batavia lettuce',
    chicory: 'fresh chicory leaves',
    'mustard greens': 'fresh mustard greens',
    taioba: 'fresh taioba leaves brazilian greens',
  },
  vegetais: {
    tomato: 'fresh tomatoes',
    'bell pepper': 'fresh bell peppers',
    zucchini: 'fresh zucchini',
    eggplant: 'fresh eggplant',
    cucumber: 'fresh cucumber',
    corn: 'fresh corn on the cob',
    peas: 'fresh green peas',
    'green beans': 'fresh green beans',
    pumpkin: 'fresh pumpkin',
    okra: 'fresh okra',
    'scarlet eggplant': 'fresh scarlet eggplant jilo',
    asparagus: 'fresh asparagus',
    leek: 'fresh leek',
    mushroom: 'fresh mushrooms',
    celery: 'fresh celery stalks',
  },
  enlatados: {
    'canned corn': 'can of corn kernels',
    'canned peas': 'can of green peas',
    'canned tuna': 'can of tuna',
    'canned sardine': 'can of sardines',
    'canned beans': 'can of beans',
    'canned chickpeas': 'can of chickpeas',
    'heart of palm': 'heart of palm palmito',
    olives: 'green and black olives',
    'mixed vegetables': 'can of mixed vegetables',
    'canned mushroom': 'can of sliced mushrooms',
    'canned peach': 'can of peach halves in syrup',
  },
  condimentos: {
    flour: 'wheat flour in a bowl',
    breadcrumbs: 'breadcrumbs in a bowl',
    'cassava flour': 'brazilian cassava flour farinha',
    'corn flour': 'yellow corn flour fuba',
    cornstarch: 'cornstarch powder',
    'vegetable oil': 'bottle of vegetable oil',
    'olive oil': 'bottle of olive oil',
    egg: 'fresh eggs',
    milk: 'glass of milk',
    'powdered milk': 'powdered milk in a bowl',
    'condensed milk': 'can of condensed milk',
    'heavy cream': 'heavy cream carton',
    yogurt: 'bowl of yogurt',
    butter: 'block of butter',
    margarine: 'margarine tub',
    cheese: 'block of cheese',
    'cream cheese': 'brazilian requeijao cream cheese',
    'shredded coconut': 'shredded coconut',
    'coconut milk': 'can of coconut milk',
    'maria cookies': 'maria cookies biscuits',
    sugar: 'white sugar in a bowl',
    honey: 'jar of honey',
    'baking powder': 'baking powder in a bowl',
    vinegar: 'bottle of vinegar',
    'cocoa powder': 'cocoa powder in a bowl',
    chocolate: 'chocolate bar and chips',
    'tapioca starch': 'tapioca starch powder',
  },
  temperos: {
    'black pepper': 'black peppercorns',
    'calabrian pepper': 'crushed calabrian chili pepper',
    paprika: 'colorau paprika powder',
    'sweet paprika': 'sweet paprika powder',
    turmeric: 'turmeric powder and root',
    oregano: 'dried oregano',
    basil: 'fresh basil leaves',
    thyme: 'fresh thyme sprigs',
    rosemary: 'fresh rosemary sprigs',
    'bay leaf': 'dried bay leaves',
    cilantro: 'fresh cilantro leaves',
    mint: 'fresh mint leaves',
    parsley: 'fresh parsley',
    cumin: 'ground cumin powder',
    'garlic powder': 'garlic powder',
    cinnamon: 'cinnamon sticks and powder',
    cloves: 'whole cloves spice',
    nutmeg: 'whole and ground nutmeg',
    'curry powder': 'curry powder',
    'vegetable bouillon': 'vegetable bouillon cubes',
  },
  molhos: {
    'tomato sauce': 'bowl of tomato sauce',
    'rose sauce': 'bowl of pink rose pasta sauce',
    'white sauce': 'bowl of white bechamel sauce',
    'pesto sauce': 'bowl of green pesto sauce',
    ketchup: 'bottle of ketchup',
    mustard: 'bottle of mustard',
    mayonnaise: 'bowl of mayonnaise',
    'barbecue sauce': 'bottle of barbecue sauce',
    'soy sauce': 'bottle of soy sauce',
    'worcestershire sauce': 'bottle of worcestershire sauce',
    'hot sauce': 'bottle of hot sauce',
    'garlic sauce': 'bowl of garlic sauce',
    'sweet and sour sauce': 'bowl of sweet and sour sauce',
    vinaigrette: 'bowl of vinaigrette dressing',
  },
  equipamentos: {
    stove: 'kitchen gas stove top',
    oven: 'kitchen oven',
    'air fryer': 'air fryer appliance',
    microwave: 'microwave oven',
    'grill pan': 'cast iron grill pan',
    'barbecue grill': 'outdoor barbecue grill',
    griddle: 'flat griddle chapa',
    blender: 'kitchen blender',
    'pressure cooker': 'pressure cooker pot',
  },
};

const KIND_BY_CATEGORY = {
  equipamentos: 'appliance',
};

function buildPrompt(subject, category) {
  const kind = KIND_BY_CATEGORY[category] ?? 'food';
  if (kind === 'appliance') {
    return `Professional product photography of a ${subject}, centered, on a dark moody background, dramatic soft studio lighting, square composition, high detail, no text, no watermark, no people`;
  }
  return `Professional studio food photography of ${subject}, centered, on a dark moody background, dramatic soft side lighting, square composition, high detail, appetizing, no text, no watermark, no people, no plate unless natural to the ingredient`;
}

function slugify(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateImage(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${raw.slice(0, 500)}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Non-JSON response: ${raw.slice(0, 500)}`);
  }
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) {
    throw new Error(`No image in response: ${raw.slice(0, 500)}`);
  }
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const test = args.includes('--test');
  const all = args.includes('--all');
  const catArg = args.find((a) => a.startsWith('--category='));
  const categories = catArg ? catArg.replace('--category=', '').split(',') : [];
  return { test, all, categories };
}

async function main() {
  const { test, all, categories } = parseArgs();

  if (test) {
    console.log(`Testing model "${MODEL}" with a single item ("chicken breast")...`);
    const buf = await generateImage(buildPrompt('raw chicken breast fillet', 'frango'));
    const testPath = path.join(__dirname, 'test-output.jpg');
    writeFileSync(testPath, buf);
    console.log(`OK — wrote ${buf.length} bytes to ${testPath}. Open it to check quality before running a batch.`);
    return;
  }

  let selectedCategories;
  if (all) {
    selectedCategories = Object.keys(CATEGORIES);
  } else if (categories.length > 0) {
    selectedCategories = categories;
  } else {
    console.error('Pass --test, --category=<name>[,<name>...], or --all. See file header for category names.');
    process.exit(1);
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // Preserve entries already generated in a previous run (so re-running one category doesn't wipe others).
  const existingMatch = EXISTING_TS?.match(/INGREDIENT_IMAGES: Record<string, string> = (\{[\s\S]*?\n\});/);
  const results = existingMatch ? JSON.parse(existingMatch[1]) : {};

  let ok = 0;
  let failed = [];
  const entries = [];
  for (const cat of selectedCategories) {
    const items = CATEGORIES[cat];
    if (!items) {
      console.log(`Unknown category "${cat}", skipping.`);
      continue;
    }
    for (const [query, subject] of Object.entries(items)) {
      entries.push({ query, subject, cat });
    }
  }

  const force = process.argv.includes('--force');
  const pending = entries.filter(({ query }) => {
    const slug = slugify(query);
    const already = results[query] && existsSync(path.join(OUTPUT_DIR, `${slug}.jpg`));
    return force || !already;
  });
  const skipped = entries.length - pending.length;

  console.log(
    `Generating ${pending.length} image(s) across ${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'}` +
      (skipped > 0 ? ` (${skipped} already done, skipped — pass --force to regenerate)` : '') +
      '...\n'
  );

  for (const { query, subject, cat } of pending) {
    const slug = slugify(query);
    const filePath = path.join(OUTPUT_DIR, `${slug}.jpg`);
    try {
      const buf = await generateImage(buildPrompt(subject, cat));
      writeFileSync(filePath, buf);
      results[query] = `/ingredient-photos/${slug}.jpg`;
      ok++;
      console.log(`OK   ${query} -> ${slug}.jpg`);
    } catch (err) {
      failed.push(query);
      console.log(`FAIL ${query}: ${err.message}`);
    }
    await sleep(1500);
  }

  const fileContent = `// Auto-generated by scripts/fetch-ingredient-images.mjs — do not hand-edit.
// Images generated by the Gemini API (${MODEL}), saved under public/ingredient-photos/.

export const INGREDIENT_IMAGES: Record<string, string> = ${JSON.stringify(results, null, 2)};
`;
  writeFileSync(OUTPUT_TS, fileContent, 'utf-8');

  console.log(`\nDone. ${ok}/${entries.length} images saved this run. Total in lookup: ${Object.keys(results).length}.`);
  if (failed.length > 0) {
    console.log(`Failed (kept emoji fallback): ${failed.join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
