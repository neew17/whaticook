// One-time enrichment script: fetches one photo per recipe from Pexels and
// writes the result to src/data/recipe-images.ts. Not part of the shipped app.
//
// Usage: PEXELS_API_KEY=xxx node scripts/fetch-recipe-images.mjs

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('Missing PEXELS_API_KEY environment variable.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'recipe-images.ts');

const QUERIES = {
  'arroz-feijao-simples': 'rice and beans',
  'feijao-preto-temperado': 'black beans stew',
  'frango-grelhado-limao': 'grilled chicken lemon',
  'frango-milanesa': 'breaded chicken cutlet',
  'frango-xadrez': 'chinese chicken stir fry',
  'frango-curry': 'chicken curry',
  'coxa-frango-assada': 'roasted chicken thighs',
  'bife-acebolado': 'steak with onions',
  'picadinho-carne': 'beef stew',
  'carne-panela': 'braised beef stew',
  'escondidinho-carne-seca': 'shepherds pie',
  'bacon-ovos': 'bacon and eggs',
  'omelete-queijo': 'cheese omelette',
  'ovos-mexidos-tomate': 'scrambled eggs tomato',
  'salsicha-acebolada': 'sausage with onions',
  'linguica-acebolada': 'grilled sausage onions',
  'costela-barbecue': 'bbq ribs',
  'lombo-assado-batatas': 'roast pork with potatoes',
  'peixe-frito': 'fried fish',
  'peixe-assado-limao': 'baked fish lemon',
  'salmao-grelhado': 'grilled salmon',
  'atum-macarrao': 'tuna pasta',
  'sardinha-panela': 'sardines tomato sauce',
  'camarao-alho-oleo': 'garlic shrimp',
  'moqueca-simples': 'fish coconut stew',
  'macarrao-alho-oleo': 'spaghetti aglio olio',
  'macarrao-sugo': 'spaghetti tomato sauce',
  'macarrao-frango': 'chicken pasta',
  'nhoque-batata': 'potato gnocchi',
  'risoto-frango': 'chicken risotto',
  'arroz-forno': 'baked rice casserole',
  'feijoada-simplificada': 'feijoada brazilian',
  'sopa-legumes': 'vegetable soup',
  'canja-galinha': 'chicken soup rice',
  'pure-batata': 'mashed potatoes',
  'batata-doce-assada': 'roasted sweet potato',
  'legumes-refogados': 'sauteed vegetables',
  'abobrinha-recheada': 'stuffed zucchini',
  'berinjela-parmegiana': 'eggplant parmesan',
  'salada-tomate-cebola': 'tomato onion salad',
  'salada-verde': 'green salad',
  'salada-grao-bico': 'chickpea salad',
  'salada-atum': 'tuna salad',
  'vinagrete': 'brazilian vinaigrette salsa',
  'farofa-simples': 'toasted cassava flour',
  'polenta-cremosa': 'creamy polenta',
  'pipoca-simples': 'popcorn bowl',
  'aveia-banana': 'oatmeal banana',
  'salada-frutas': 'fruit salad',
  'vitamina-abacate': 'avocado smoothie',
  'macarrao-molho-branco': 'pasta white sauce',
  'frango-barbecue': 'bbq chicken',
  'costelinha-agridoce': 'sweet and sour pork ribs',
  'salpicao-frango': 'chicken salad mayonnaise',
  'omelete-espinafre': 'spinach omelette',
  'sopa-ervilha': 'pea soup',
  'risoto-camarao': 'shrimp risotto',
  'sufle-brocolis': 'broccoli souffle',
  'couve-refogada': 'sauteed kale',
  'salada-repolho': 'coleslaw cabbage salad',
  'palmito-molho-branco': 'hearts of palm gratin',
  'salada-palmito': 'hearts of palm salad',
  'brigadeiro': 'brazilian brigadeiro chocolate truffle',
  'bolo-cenoura-chocolate': 'carrot cake chocolate frosting',
  'bolo-chocolate-molhadinho': 'moist chocolate cake slice',
  'pudim-leite-condensado': 'flan caramel pudding',
  'bolinho-chuva': 'brazilian donuts cinnamon sugar',
  'bolo-fuba-cremoso': 'cornmeal cake',
  'pao-de-queijo': 'brazilian cheese bread',
  'coxinha-frango': 'brazilian chicken croquette',
  'misto-quente': 'grilled ham cheese sandwich',
  'pastel-forno-carne': 'baked beef pastry empanada',
  'lasanha-bolonhesa': 'lasagna bolognese',
  'panqueca-carne-moida': 'beef crepe pancake',
  'torta-frango-liquidificador': 'chicken pie',
  'chocolate-quente-cremoso': 'hot chocolate mug',
  'suco-laranja-natural': 'fresh orange juice',
  'vitamina-banana': 'banana milkshake smoothie',
  'suco-verde-detox': 'green detox juice',
  'cocada-cremosa': 'coconut candy brazilian',
  'beijinho': 'brazilian coconut truffle candy',
  'mousse-chocolate': 'chocolate mousse dessert',
  'danoninho-caseiro': 'yogurt dessert cup',
  'sanduiche-natural-frango': 'chicken sandwich lettuce tomato',
  'pizza-liquidificador': 'homemade pizza slice',
  'arroz-doce': 'rice pudding cinnamon',
  'frango-assado-ervas': 'roast chicken herbs',
  'picanha-chapa': 'grilled steak brazilian picanha',
  'carne-sol-abobora-coentro': 'shredded beef pumpkin',
  'carne-porco-refogada-cominho': 'pork stir fry bell pepper',
  'pernil-assado-alecrim': 'roast pork leg rosemary',
  'mortadela-chapa': 'grilled bologna sandwich',
  'figado-acebolado': 'liver and onions',
  'peru-assado-natal': 'roast turkey christmas',
  'posta-atum-grelhado': 'seared tuna steak',
  'arroz-integral-legumes': 'brown rice vegetables',
  'feijao-fradinho-bacon': 'black eyed peas bacon',
  'salada-lentilha-legumes': 'lentil salad vegetables',
  'salada-quinoa-grao-bico': 'quinoa chickpea salad',
  'salada-milho-ervilha': 'corn pea salad',
  'sardinha-enlatada-cebola-tomate': 'canned sardines onion tomato',
  'feijao-grao-bico-enlatados': 'beans chickpeas stew',
  'salpicao-seleta-legumes': 'chicken salad mixed vegetables',
  'strogonoff-cogumelos': 'mushroom stroganoff',
  'pessego-calda-creme': 'peach dessert cream',
  'bolo-laranja-margarina': 'orange cake slice',
  'peixe-molho-acafrao': 'fish turmeric sauce',
  'limonada-hortela': 'lemonade mint',
  'frango-empanado-alho-po': 'breaded chicken fillet',
  'compota-maca-cravo-canela': 'apple compote cinnamon',
  'pure-batata-noz-moscada': 'mashed potatoes nutmeg',
  'batata-rustica-paprica': 'roasted potatoes paprika',
  'macarrao-molho-rose': 'pasta pink sauce',
  'macarrao-pesto': 'pasta pesto',
  'bife-molho-ingles': 'steak worcestershire sauce',
  'frango-molho-pimenta-mel': 'chicken hot honey glaze',
  'pao-alho-molho-alho': 'garlic bread',
  'salada-vinagrete-simples': 'lettuce tomato salad',
  'sopa-raizes': 'root vegetable soup',
  'refogado-folhas-variadas': 'sauteed leafy greens',
  'legumes-assados-ervas-2': 'roasted cauliflower asparagus',
  'quiabo-jilo-refogados': 'okra eggplant saute',
  'salada-rabanete-gengibre': 'radish salad ginger',
  'salada-tropical-frutas': 'tropical fruit salad',
  'compota-frutas-vermelhas': 'cherry plum compote',
  'suco-detox-caju-acerola': 'tropical fruit juice',
  'salada-frutas-goiaba-pessego-lichia': 'exotic fruit salad',
  'sobrecoxa-assada': 'roasted chicken drumsticks',
  'asa-frango-mel-soja': 'honey soy chicken wings',
  'coracao-frango-espeto': 'chicken heart skewers',
  'file-mignon-ervas': 'beef tenderloin steak herbs',
  'patinho-molho-cebola': 'beef steak onion sauce',
  'contrafile-chapa': 'grilled ribeye steak',
  'maminha-assada': 'roasted beef sirloin cap',
  'fraldinha-churrasqueira': 'grilled flank steak',
  'cupim-panela-pressao': 'braised beef brisket',
  'lagarto-rosbife-mostarda': 'roast beef mustard',
  'acem-cozido-legumes': 'beef stew vegetables',
  'musculo-molho-tomate': 'beef shank tomato stew',
  'costelinha-suina-mel-mostarda': 'pork ribs honey mustard',
  'panceta-crocante': 'crispy pork belly',
  'bisteca-grelhada-limao': 'grilled pork chop lemon',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchImage(query) {
  const params = new URLSearchParams({
    query,
    per_page: '1',
    orientation: 'landscape',
  });
  const res = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
    headers: { Authorization: API_KEY },
  });
  if (!res.ok) {
    throw new Error(`Pexels error ${res.status} for query "${query}"`);
  }
  const data = await res.json();
  const photo = data.photos && data.photos[0];
  if (!photo) return null;
  return {
    url: photo.src.large,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
  };
}

async function main() {
  const entries = Object.entries(QUERIES);
  const results = {};
  let ok = 0;
  let missing = [];

  for (const [id, query] of entries) {
    try {
      const image = await fetchImage(query);
      if (image) {
        results[id] = image;
        ok++;
        console.log(`OK   ${id} -> "${query}"`);
      } else {
        missing.push(id);
        console.log(`MISS ${id} -> "${query}" (no results)`);
      }
    } catch (err) {
      missing.push(id);
      console.log(`FAIL ${id} -> "${query}": ${err.message}`);
    }
    await sleep(150);
  }

  const fileContent = `// Auto-generated by scripts/fetch-recipe-images.mjs — do not hand-edit.
// Photos courtesy of Pexels (https://www.pexels.com), free to use under the Pexels License.

export interface RecipeImage {
  url: string;
  photographer: string;
  photographerUrl: string;
}

export const RECIPE_IMAGES: Record<string, RecipeImage> = ${JSON.stringify(results, null, 2)};
`;

  writeFileSync(OUTPUT_PATH, fileContent, 'utf-8');
  console.log(`\nDone. ${ok}/${entries.length} images saved to ${OUTPUT_PATH}`);
  if (missing.length > 0) {
    console.log(`Missing (kept emoji fallback): ${missing.join(', ')}`);
  }
}

main();
