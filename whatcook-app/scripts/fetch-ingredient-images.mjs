// One-time enrichment script: generates one AI photo per ingredient/equipment item via the
// Gemini API's Imagen model, saves it to public/ingredient-photos/, and writes a lookup to
// src/data/ingredientImages.ts (keyed by the same `query` used in ingredients.ts). Not part of
// the shipped app / not run automatically.
//
// Usage:
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --category=frutas
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --category=carnes,aves
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --all
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --all --force   (regenera tudo)
//   GEMINI_API_KEY=xxx node scripts/fetch-ingredient-images.mjs --test          (1 item, sem escrita)
//
// Categorias = as chaves de CATEGORIES abaixo, alinhadas a CategoryKey em src/data/ingredients.ts.
// Ao adicionar itens em ingredients.ts, adicione o subject aqui também — o script avisa no
// startup se algum query de INGREDIENTS/EQUIPAMENTOS estiver sem entrada.

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
const INGREDIENTS_TS = path.join(__dirname, '..', 'src', 'data', 'ingredients.ts');
const EXISTING_TS = existsSync(OUTPUT_TS) ? readFileSync(OUTPUT_TS, 'utf-8') : null;

// query -> subject en (frase usada no prompt). Agrupado pela categoria nova (CategoryKey).
// "kind" do prompt vem de KIND_BY_CATEGORY: 'product' (garrafas, latas, eletros) ou 'food'.
const CATEGORIES = {
  aves: {
    chicken: 'whole raw chicken',
    'chicken breast': 'raw chicken breast fillet',
    'chicken thigh': 'raw chicken thigh',
    'chicken drumstick': 'raw chicken drumstick',
    'chicken wings': 'raw chicken wings',
    'chicken heart': 'raw chicken hearts',
  },
  carnes: {
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
    pork: 'raw pork meat cut',
    'pork loin': 'raw pork loin',
    'pork leg': 'raw pork leg roast',
    'pork chop': 'raw pork chop',
    'pork ribs': 'raw pork ribs',
    'pork belly': 'raw pork belly',
    bacon: 'raw bacon strips',
    'pork sausage': 'brazilian pork sausage linguica',
    sausage: 'sausages',
  },
  frios: {
    mortadella: 'sliced mortadella',
    ham: 'sliced ham',
    turkey: 'sliced turkey breast',
  },
  pescados: {
    fish: 'whole raw fish',
    tilapia: 'raw tilapia fillet',
    salmon: 'raw salmon fillet',
    tuna: 'raw tuna steak',
    sardine: 'fresh sardines',
    shrimp: 'raw shrimp',
    'canned tuna': 'can of tuna',
    'canned sardine': 'can of sardines',
  },
  hortalicas: {
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
    celery: 'fresh celery stalks',
  },
  cogumelos: {
    mushroom: 'fresh mushrooms',
  },
  frutas: {
    banana: 'fresh bananas',
    apple: 'fresh red apple',
    lemon: 'fresh limes',
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
  'geleias-conserva-fruta': {
    'canned peach': 'can of peach halves in syrup',
  },
  'frutas-secas-nozes': {
    peanut: 'roasted peanuts',
    'shredded coconut': 'shredded coconut',
  },
  queijos: {
    cheese: 'block of cheese',
    'cream cheese': 'brazilian requeijao cream cheese',
  },
  'laticinios-ovos': {
    egg: 'fresh eggs',
    milk: 'glass of milk',
    'powdered milk': 'powdered milk in a bowl',
    'condensed milk': 'can of condensed milk',
    'heavy cream': 'heavy cream carton',
    yogurt: 'bowl of yogurt',
    butter: 'block of butter',
  },
  'veganos-vegetarianos': {
    'coconut milk': 'can of coconut milk',
  },
  'oleos-gorduras-vinagres': {
    'vegetable oil': 'bottle of vegetable oil',
    'olive oil': 'bottle of olive oil',
    margarine: 'margarine tub',
    vinegar: 'bottle of vinegar',
  },
  'farinhas-fermentos': {
    flour: 'wheat flour in a bowl',
    breadcrumbs: 'breadcrumbs in a bowl',
    'cassava flour': 'brazilian cassava flour farinha',
    'corn flour': 'yellow corn flour fuba',
    cornstarch: 'cornstarch powder',
    'tapioca starch': 'tapioca starch powder',
    'baking powder': 'baking powder in a bowl',
  },
  'graos-cereais': {
    rice: 'raw white rice grains',
    'brown rice': 'raw brown rice grains',
    'pinto beans': 'raw pinto beans',
    'black beans': 'raw black beans',
    'black-eyed peas': 'raw black-eyed peas',
    lentils: 'raw lentils',
    chickpeas: 'raw chickpeas',
    quinoa: 'raw quinoa grains',
    oats: 'raw rolled oats',
    popcorn: 'popcorn kernels',
  },
  massas: {
    pasta: 'raw pasta',
  },
  padaria: {
    bread: 'loaf of bread',
    'maria cookies': 'maria cookies biscuits',
  },
  'conservas-vegetais': {
    'canned corn': 'can of corn kernels',
    'canned peas': 'can of green peas',
    'canned beans': 'can of beans',
    'canned chickpeas': 'can of chickpeas',
    'heart of palm': 'heart of palm palmito',
    olives: 'green and black olives',
    'mixed vegetables': 'can of mixed vegetables',
    'canned mushroom': 'can of sliced mushrooms',
  },
  'acucar-adocantes': {
    sugar: 'white sugar in a bowl',
    honey: 'jar of honey',
  },
  'sobremesas-guloseimas': {
    'cocoa powder': 'cocoa powder in a bowl',
    chocolate: 'chocolate bar and chips',
  },
  especiarias: {
    'black pepper': 'black peppercorns',
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
    ginger: 'fresh ginger root',
  },
  pimentas: {
    'calabrian pepper': 'crushed calabrian chili pepper',
    'hot sauce': 'bottle of hot sauce',
  },
  'sopas-caldos': {
    'vegetable bouillon': 'vegetable bouillon cubes',
  },
  'molhos-condimentos': {
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
    'garlic sauce': 'bowl of garlic sauce',
    'sweet and sour sauce': 'bowl of sweet and sour sauce',
    vinaigrette: 'bowl of vinaigrette dressing',
  },
  'bebidas-com-alcool': {
    cachaca: 'bottle of cachaça brazilian sugarcane spirit',
    vodka: 'bottle of vodka',
    gin: 'bottle of gin',
    'white rum': 'bottle of white rum',
    'dark rum': 'bottle of dark aged rum',
    tequila: 'bottle of tequila',
    whiskey: 'bottle of whiskey',
    brandy: 'bottle of brandy',
    'triple sec': 'bottle of triple sec orange liqueur',
    aperol: 'bottle of orange bitter aperitif liqueur',
    campari: 'bottle of red bitter aperitif liqueur',
    'dry vermouth': 'bottle of dry vermouth',
    'sweet vermouth': 'bottle of sweet red vermouth',
    'red wine': 'bottle of red wine',
    'white wine': 'bottle of white wine',
    'sparkling wine': 'bottle of sparkling wine prosecco',
    beer: 'bottle of lager beer',
    'coffee liqueur': 'bottle of coffee liqueur',
    'cassis liqueur': 'bottle of blackcurrant cassis liqueur',
    sake: 'bottle of sake rice wine',
  },
  'bebidas-sem-alcool': {
    'sparkling water': 'bottle of sparkling water',
    'tonic water': 'bottle of tonic water',
    cola: 'glass bottle of cola soda',
    'lemon-lime soda': 'bottle of clear lemon lime soda',
    'ginger ale': 'bottle of ginger ale',
    'ginger beer': 'bottle of ginger beer',
    'energy drink': 'can of energy drink',
    'coconut water': 'carton of coconut water',
    'orange juice': 'glass of fresh orange juice',
    'cranberry juice': 'glass of cranberry juice',
    'pineapple juice': 'glass of pineapple juice',
    'grape juice': 'glass of purple grape juice',
    'simple syrup': 'bottle of clear simple sugar syrup',
    grenadine: 'bottle of red grenadine syrup',
    coffee: 'cup of black coffee',
    'black tea': 'glass of iced black tea',
    'hibiscus tea': 'glass of red hibiscus iced tea',
    'sparkling grape juice': 'bottle of non-alcoholic sparkling grape juice',
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
    'cocktail shaker': 'stainless steel cocktail shaker',
  },
};

// Categorias fotografadas como "produto" (garrafa/lata/eletro sobre fundo branco) e não "comida".
const PRODUCT_CATEGORIES = new Set(['equipamentos', 'bebidas-com-alcool', 'bebidas-sem-alcool']);

function buildPrompt(subject, category) {
  if (PRODUCT_CATEGORIES.has(category)) {
    return `Professional product photography of a ${subject}, centered, on a pure solid white seamless studio background (#FFFFFF), soft even diffused studio lighting, minimal soft shadow directly under the object, square composition, high detail, sharp focus, no text, no watermark, no people, no props`;
  }
  return `Professional studio food photography of ${subject}, centered, on a pure solid white seamless studio background (#FFFFFF), soft even diffused studio lighting, minimal soft shadow directly under the subject, square composition, high detail, sharp focus, appetizing, natural colors, no text, no watermark, no people, no plate unless natural to the ingredient`;
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

// Lê os `query` de INGREDIENTS + EQUIPAMENTOS em ingredients.ts e avisa se algum não tem subject aqui.
function checkCoverage() {
  if (!existsSync(INGREDIENTS_TS)) return;
  const src = readFileSync(INGREDIENTS_TS, 'utf-8');
  const declared = new Set(Object.values(CATEGORIES).flatMap((g) => Object.keys(g)));
  const inCode = [...src.matchAll(/query: '([^']+)'/g)].map((m) => m[1]);
  const missing = [...new Set(inCode)].filter((q) => !declared.has(q));
  const extra = [...declared].filter((q) => !inCode.includes(q));
  if (missing.length) console.warn(`AVISO: sem subject para: ${missing.join(', ')}`);
  if (extra.length) console.warn(`AVISO: subject sem item em ingredients.ts: ${extra.join(', ')}`);
}

// 503/429/500 do modelo são picos de demanda transitórios — tenta de novo com backoff.
async function generateImage(prompt, attempt = 1) {
  const MAX_ATTEMPTS = 5;
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
    if ([429, 500, 503].includes(res.status) && attempt < MAX_ATTEMPTS) {
      const wait = 2000 * 2 ** (attempt - 1);
      console.log(`  ...${res.status}, retry ${attempt + 1}/${MAX_ATTEMPTS} em ${wait / 1000}s`);
      await sleep(wait);
      return generateImage(prompt, attempt + 1);
    }
    throw new Error(`Gemini error ${res.status}: ${raw.slice(0, 300)}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Non-JSON response: ${raw.slice(0, 300)}`);
  }
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) {
    if (attempt < MAX_ATTEMPTS) {
      await sleep(2000 * attempt);
      return generateImage(prompt, attempt + 1);
    }
    throw new Error(`No image in response: ${raw.slice(0, 300)}`);
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
  checkCoverage();

  if (test) {
    console.log(`Testing model "${MODEL}" with a single item ("chicken breast")...`);
    const buf = await generateImage(buildPrompt('raw chicken breast fillet', 'aves'));
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
