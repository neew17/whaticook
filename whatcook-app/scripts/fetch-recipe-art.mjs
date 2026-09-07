// One-time enrichment script: generates one AI photo per recipe via the Gemini API
// (gemini-2.5-flash-image, "nano banana"), saves it under public/recipe-art/, and writes a
// lookup to src/data/recipe-images.ts (keyed by recipe id, same `RECIPE_IMAGES` export the app
// already consumes). Not part of the shipped app / not run automatically.
//
// Replaces the old Pexels-based scripts/fetch-recipe-images.mjs — same output file, same shape
// ({ url }), so no app change. Every consumer only reads `RECIPE_IMAGES[id]?.url`.
//
// Usage:
//   GEMINI_API_KEY=xxx node scripts/fetch-recipe-art.mjs --test           (1 recipe, writes scripts/test-output.jpg only)
//   GEMINI_API_KEY=xxx node scripts/fetch-recipe-art.mjs --all            (only recipes still missing a photo)
//   GEMINI_API_KEY=xxx node scripts/fetch-recipe-art.mjs --all --force    (regenerate everything)
//   GEMINI_API_KEY=xxx node scripts/fetch-recipe-art.mjs --only=quindim,bolo-de-rolo
//
// Optional: `npm i -D sharp` before running to downscale each image to ~640px wide JPEG (~40-70 KB).
// Without sharp the raw model output is written as-is (~1 MB each) and a warning is printed.
//
// The RECIPES map below must stay 1:1 with the recipe ids in src/data/recipes.ts — the script
// prints a coverage warning at startup for any id it can't find a subject for.

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
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'recipe-art');
const OUTPUT_TS = path.join(__dirname, '..', 'src', 'data', 'recipe-images.ts');
const RECIPES_TS = path.join(__dirname, '..', 'src', 'data', 'recipes.ts');
const EXISTING_TS = existsSync(OUTPUT_TS) ? readFileSync(OUTPUT_TS, 'utf-8') : null;

// recipe id -> { s: english subject phrase for the prompt, t: tipo }
const RECIPES = {
  "arroz-feijao-simples": { s: "rice and beans", t: "salgado" },
  "feijao-preto-temperado": { s: "black beans stew", t: "salgado" },
  "frango-grelhado-limao": { s: "grilled chicken lemon", t: "salgado" },
  "frango-milanesa": { s: "breaded chicken cutlet", t: "salgado" },
  "frango-xadrez": { s: "chinese chicken stir fry", t: "salgado" },
  "frango-curry": { s: "chicken curry", t: "salgado" },
  "coxa-frango-assada": { s: "roasted chicken thighs", t: "salgado" },
  "bife-acebolado": { s: "steak with onions", t: "salgado" },
  "picadinho-carne": { s: "beef stew", t: "salgado" },
  "carne-panela": { s: "braised beef stew", t: "salgado" },
  "escondidinho-carne-seca": { s: "shepherds pie", t: "salgado" },
  "bacon-ovos": { s: "bacon and eggs", t: "salgado" },
  "omelete-queijo": { s: "cheese omelette", t: "salgado" },
  "ovos-mexidos-tomate": { s: "scrambled eggs tomato", t: "salgado" },
  "salsicha-acebolada": { s: "sausage with onions", t: "salgado" },
  "linguica-acebolada": { s: "grilled sausage onions", t: "salgado" },
  "costela-barbecue": { s: "bbq ribs", t: "salgado" },
  "lombo-assado-batatas": { s: "roast pork with potatoes", t: "salgado" },
  "peixe-frito": { s: "fried fish", t: "salgado" },
  "peixe-assado-limao": { s: "baked fish lemon", t: "salgado" },
  "salmao-grelhado": { s: "grilled salmon", t: "salgado" },
  "atum-macarrao": { s: "tuna pasta", t: "salgado" },
  "sardinha-panela": { s: "sardines tomato sauce", t: "salgado" },
  "camarao-alho-oleo": { s: "garlic shrimp", t: "salgado" },
  "moqueca-simples": { s: "fish coconut stew", t: "salgado" },
  "macarrao-alho-oleo": { s: "spaghetti aglio olio", t: "salgado" },
  "macarrao-sugo": { s: "spaghetti tomato sauce", t: "salgado" },
  "macarrao-frango": { s: "chicken pasta", t: "salgado" },
  "nhoque-batata": { s: "potato gnocchi", t: "salgado" },
  "risoto-frango": { s: "chicken risotto", t: "salgado" },
  "arroz-forno": { s: "baked rice casserole", t: "salgado" },
  "feijoada-simplificada": { s: "feijoada brazilian", t: "salgado" },
  "sopa-legumes": { s: "vegetable soup", t: "salgado" },
  "canja-galinha": { s: "chicken soup rice", t: "salgado" },
  "pure-batata": { s: "mashed potatoes", t: "salgado" },
  "batata-doce-assada": { s: "roasted sweet potato", t: "salgado" },
  "legumes-refogados": { s: "sauteed vegetables", t: "salgado" },
  "abobrinha-recheada": { s: "stuffed zucchini", t: "salgado" },
  "berinjela-parmegiana": { s: "eggplant parmesan", t: "salgado" },
  "salada-tomate-cebola": { s: "tomato onion salad", t: "salgado" },
  "salada-verde": { s: "green salad", t: "salgado" },
  "salada-grao-bico": { s: "chickpea salad", t: "salgado" },
  "salada-atum": { s: "tuna salad", t: "salgado" },
  "vinagrete": { s: "brazilian vinaigrette salsa", t: "salgado" },
  "farofa-simples": { s: "toasted cassava flour", t: "salgado" },
  "polenta-cremosa": { s: "creamy polenta", t: "salgado" },
  "pipoca-simples": { s: "popcorn bowl", t: "salgado" },
  "aveia-banana": { s: "oatmeal banana", t: "doce" },
  "salada-frutas": { s: "fruit salad", t: "doce" },
  "vitamina-abacate": { s: "avocado smoothie", t: "doce" },
  "macarrao-molho-branco": { s: "pasta white sauce", t: "salgado" },
  "frango-barbecue": { s: "bbq chicken", t: "salgado" },
  "costelinha-agridoce": { s: "sweet and sour pork ribs", t: "salgado" },
  "salpicao-frango": { s: "chicken salad mayonnaise", t: "salgado" },
  "omelete-espinafre": { s: "spinach omelette", t: "salgado" },
  "sopa-ervilha": { s: "pea soup", t: "salgado" },
  "risoto-camarao": { s: "shrimp risotto", t: "salgado" },
  "sufle-brocolis": { s: "broccoli souffle", t: "salgado" },
  "couve-refogada": { s: "sauteed kale", t: "salgado" },
  "salada-repolho": { s: "coleslaw cabbage salad", t: "salgado" },
  "palmito-molho-branco": { s: "hearts of palm gratin", t: "salgado" },
  "salada-palmito": { s: "hearts of palm salad", t: "salgado" },
  "brigadeiro": { s: "brazilian brigadeiro chocolate truffle", t: "doce" },
  "bolo-cenoura-chocolate": { s: "carrot cake chocolate frosting", t: "doce" },
  "bolo-chocolate-molhadinho": { s: "moist chocolate cake slice", t: "doce" },
  "pudim-leite-condensado": { s: "flan caramel pudding", t: "doce" },
  "bolinho-chuva": { s: "brazilian donuts cinnamon sugar", t: "doce" },
  "bolo-fuba-cremoso": { s: "cornmeal cake", t: "doce" },
  "pao-de-queijo": { s: "brazilian cheese bread", t: "salgado" },
  "coxinha-frango": { s: "brazilian chicken croquette", t: "salgado" },
  "misto-quente": { s: "grilled ham cheese sandwich", t: "salgado" },
  "pastel-forno-carne": { s: "baked beef pastry empanada", t: "salgado" },
  "lasanha-bolonhesa": { s: "lasagna bolognese", t: "salgado" },
  "panqueca-carne-moida": { s: "beef crepe pancake", t: "salgado" },
  "torta-frango-liquidificador": { s: "chicken pie", t: "salgado" },
  "chocolate-quente-cremoso": { s: "hot chocolate mug", t: "doce" },
  "suco-laranja-natural": { s: "fresh orange juice", t: "doce" },
  "vitamina-banana": { s: "banana milkshake smoothie", t: "doce" },
  "suco-verde-detox": { s: "green detox juice", t: "doce" },
  "cocada-cremosa": { s: "coconut candy brazilian", t: "doce" },
  "beijinho": { s: "brazilian coconut truffle candy", t: "doce" },
  "mousse-chocolate": { s: "chocolate mousse dessert", t: "doce" },
  "danoninho-caseiro": { s: "yogurt dessert cup", t: "doce" },
  "sanduiche-natural-frango": { s: "chicken sandwich lettuce tomato", t: "salgado" },
  "pizza-liquidificador": { s: "homemade pizza slice", t: "salgado" },
  "arroz-doce": { s: "rice pudding cinnamon", t: "doce" },
  "frango-assado-ervas": { s: "roast chicken herbs", t: "salgado" },
  "picanha-chapa": { s: "grilled steak brazilian picanha", t: "salgado" },
  "carne-sol-abobora-coentro": { s: "shredded beef pumpkin", t: "salgado" },
  "carne-porco-refogada-cominho": { s: "pork stir fry bell pepper", t: "salgado" },
  "pernil-assado-alecrim": { s: "roast pork leg rosemary", t: "salgado" },
  "mortadela-chapa": { s: "grilled bologna sandwich", t: "salgado" },
  "figado-acebolado": { s: "liver and onions", t: "salgado" },
  "peru-assado-natal": { s: "roast turkey christmas", t: "salgado" },
  "posta-atum-grelhado": { s: "seared tuna steak", t: "salgado" },
  "arroz-integral-legumes": { s: "brown rice vegetables", t: "salgado" },
  "feijao-fradinho-bacon": { s: "black eyed peas bacon", t: "salgado" },
  "salada-lentilha-legumes": { s: "lentil salad vegetables", t: "salgado" },
  "salada-quinoa-grao-bico": { s: "quinoa chickpea salad", t: "salgado" },
  "salada-milho-ervilha": { s: "corn pea salad", t: "salgado" },
  "sardinha-enlatada-cebola-tomate": { s: "canned sardines onion tomato", t: "salgado" },
  "feijao-grao-bico-enlatados": { s: "beans chickpeas stew", t: "salgado" },
  "salpicao-seleta-legumes": { s: "chicken salad mixed vegetables", t: "salgado" },
  "strogonoff-cogumelos": { s: "mushroom stroganoff", t: "salgado" },
  "pessego-calda-creme": { s: "peach dessert cream", t: "doce" },
  "bolo-laranja-margarina": { s: "orange cake slice", t: "doce" },
  "peixe-molho-acafrao": { s: "fish turmeric sauce", t: "salgado" },
  "limonada-hortela": { s: "lemonade mint", t: "doce" },
  "frango-empanado-alho-po": { s: "breaded chicken fillet", t: "salgado" },
  "compota-maca-cravo-canela": { s: "apple compote cinnamon", t: "doce" },
  "pure-batata-noz-moscada": { s: "mashed potatoes nutmeg", t: "salgado" },
  "batata-rustica-paprica": { s: "roasted potatoes paprika", t: "salgado" },
  "macarrao-molho-rose": { s: "pasta pink sauce", t: "salgado" },
  "macarrao-pesto": { s: "pasta pesto", t: "salgado" },
  "bife-molho-ingles": { s: "steak worcestershire sauce", t: "salgado" },
  "frango-molho-pimenta-mel": { s: "chicken hot honey glaze", t: "salgado" },
  "pao-alho-molho-alho": { s: "garlic bread", t: "salgado" },
  "salada-vinagrete-simples": { s: "lettuce tomato salad", t: "salgado" },
  "sopa-raizes": { s: "root vegetable soup", t: "salgado" },
  "refogado-folhas-variadas": { s: "sauteed leafy greens", t: "salgado" },
  "legumes-assados-ervas-2": { s: "roasted cauliflower asparagus", t: "salgado" },
  "quiabo-jilo-refogados": { s: "okra eggplant saute", t: "salgado" },
  "salada-rabanete-gengibre": { s: "radish salad ginger", t: "salgado" },
  "salada-tropical-frutas": { s: "tropical fruit salad", t: "doce" },
  "compota-frutas-vermelhas": { s: "cherry plum compote", t: "doce" },
  "suco-detox-caju-acerola": { s: "tropical fruit juice", t: "doce" },
  "salada-frutas-goiaba-pessego-lichia": { s: "exotic fruit salad", t: "doce" },
  "sobrecoxa-assada": { s: "roasted chicken drumsticks", t: "salgado" },
  "asa-frango-mel-soja": { s: "honey soy chicken wings", t: "salgado" },
  "coracao-frango-espeto": { s: "chicken heart skewers", t: "salgado" },
  "file-mignon-ervas": { s: "beef tenderloin steak herbs", t: "salgado" },
  "patinho-molho-cebola": { s: "beef steak onion sauce", t: "salgado" },
  "contrafile-chapa": { s: "grilled ribeye steak", t: "salgado" },
  "maminha-assada": { s: "roasted beef sirloin cap", t: "salgado" },
  "fraldinha-churrasqueira": { s: "grilled flank steak", t: "salgado" },
  "cupim-panela-pressao": { s: "braised beef brisket", t: "salgado" },
  "lagarto-rosbife-mostarda": { s: "roast beef mustard", t: "salgado" },
  "acem-cozido-legumes": { s: "beef stew vegetables", t: "salgado" },
  "musculo-molho-tomate": { s: "beef shank tomato stew", t: "salgado" },
  "costelinha-suina-mel-mostarda": { s: "pork ribs honey mustard", t: "salgado" },
  "panceta-crocante": { s: "crispy pork belly", t: "salgado" },
  "bisteca-grelhada-limao": { s: "grilled pork chop lemon", t: "salgado" },
  "espaguete-a-carbonara": { s: "spaghetti carbonara", t: "salgado" },
  "mousse-de-banana": { s: "banana mousse dessert", t: "doce" },
  "avocado-toast-ovo-poche": { s: "avocado toast poached egg", t: "salgado" },
  "banana-toast": { s: "banana toast bread", t: "doce" },
  "bauru-de-forno": { s: "baked ham cheese sandwich", t: "salgado" },
  "geladinho-de-abacaxi": { s: "pineapple popsicle", t: "doce" },
  "rosquinha-de-leite-frita": { s: "fried doughnuts sugar", t: "doce" },
  "torta-fria-de-frango": { s: "chicken sandwich loaf", t: "salgado" },
  "feijao-de-coco": { s: "beans coconut milk stew", t: "salgado" },
  "palha-italiana": { s: "chocolate fudge squares", t: "doce" },
  "torta-limao-sem-forno": { s: "no bake lemon pie", t: "doce" },
  "brownie-chocolate": { s: "chocolate brownie", t: "doce" },
  "bolo-milho-cremoso": { s: "creamy corn cake", t: "doce" },
  "curau-milho-verde": { s: "sweet corn pudding", t: "doce" },
  "bolo-banana-canela": { s: "banana cinnamon cake", t: "doce" },
  "cheesecake-morango-geladeira": { s: "strawberry cheesecake", t: "doce" },
  "doce-abobora-coco": { s: "pumpkin coconut jam", t: "doce" },
  "bananas-caramelizadas-canela": { s: "caramelized bananas cinnamon", t: "doce" },
  "pipoca-doce-caramelizada": { s: "caramel popcorn", t: "doce" },
  "manga-iogurte-mel": { s: "mango yogurt honey bowl", t: "doce" },
  "banana-frita-canela": { s: "fried banana cinnamon", t: "doce" },
  "doce-batata-doce-coco": { s: "sweet potato coconut dessert", t: "doce" },
  "quindim": { s: "quindim brazilian coconut custard", t: "doce" },
  "bolo-de-rolo": { s: "rolled cake guava", t: "doce" },
  "geladinho-morango": { s: "strawberry ice pop", t: "doce" },
  "geladinho-maracuja": { s: "passion fruit popsicle", t: "doce" },
  "geladinho-coco": { s: "coconut popsicle", t: "doce" },
  "geladinho-uva": { s: "grape popsicle", t: "doce" },
  "vitamina-morango": { s: "strawberry milkshake smoothie", t: "doce" },
  "vitamina-mamao": { s: "papaya smoothie", t: "doce" },
  "vitamina-manga": { s: "mango smoothie glass", t: "doce" },
  "suco-abacaxi-hortela": { s: "pineapple mint juice", t: "doce" },
  "suco-melancia": { s: "watermelon juice", t: "doce" },
  "suco-maracuja": { s: "passion fruit juice", t: "doce" },
  "suco-uva-natural": { s: "grape juice glass", t: "doce" },
  "espetinho-frutas-mel": { s: "fruit skewers honey", t: "doce" },
  "abacaxi-grelhado-canela": { s: "grilled pineapple cinnamon", t: "doce" },
  "melancia-hortela-limao": { s: "watermelon mint lime salad", t: "doce" },
  "coco-gelado-leite-condensado": { s: "coconut dessert condensed milk", t: "doce" },
  "pudim-coco": { s: "coconut flan pudding", t: "doce" },
  "pudim-maracuja": { s: "passion fruit pudding", t: "doce" },
  "manjar-branco-calda-ameixa": { s: "coconut blancmange plum sauce", t: "doce" },
  "ambrosia-coco": { s: "ambrosia coconut dessert", t: "doce" },
  "brigadeirao": { s: "chocolate flan brigadeiro", t: "doce" },
  "mousse-maracuja": { s: "passion fruit mousse", t: "doce" },
  "mousse-morango": { s: "strawberry mousse", t: "doce" },
  "mousse-limao": { s: "lemon mousse dessert", t: "doce" },
  "pave-chocolate": { s: "chocolate biscuit layered dessert", t: "doce" },
  "pave-morango": { s: "strawberry layered dessert", t: "doce" },
  "torta-bolacha-chocolate": { s: "chocolate biscuit cake", t: "doce" },
  "cheesecake-maracuja-geladeira": { s: "passion fruit cheesecake", t: "doce" },
  "doce-leite-cremoso": { s: "dulce de leche bowl", t: "doce" },
  "compota-pessego": { s: "peach compote jar", t: "doce" },
  "compota-abacaxi": { s: "pineapple compote", t: "doce" },
  "bolo-coco": { s: "coconut cake slice", t: "doce" },
  "bolo-laranja-calda": { s: "orange syrup cake", t: "doce" },
  "bolo-formigueiro": { s: "chocolate chip vanilla cake", t: "doce" },
  "bolo-iogurte": { s: "yogurt cake slice", t: "doce" },
  "bolo-maca-canela": { s: "apple cinnamon cake", t: "doce" },
  "bolo-limao-glace": { s: "lemon glaze cake", t: "doce" },
  "bolo-fuba-coco": { s: "cornmeal coconut cake", t: "doce" },
  "bolo-pe-de-moca": { s: "peanut cake brazilian", t: "doce" },
  "bolo-gelado-pernambuco": { s: "coconut milk cake squares", t: "doce" },
  "rocambole-doce-leite": { s: "swiss roll dulce de leche", t: "doce" },
  "torta-holandesa-simples": { s: "dutch cream chocolate cake", t: "doce" },
  "bolo-banana-aveia": { s: "banana oat cake", t: "doce" },
  "bolo-cenoura-simples": { s: "carrot cake slice", t: "doce" },
  "churros-caseiros": { s: "churros cinnamon sugar", t: "doce" },
  "sonhos-recheados-creme": { s: "cream filled doughnuts", t: "doce" },
  "geladinho-manga": { s: "mango popsicle", t: "doce" },
  "picole-caseiro-abacaxi-hortela": { s: "pineapple mint ice pop", t: "doce" },
  "taca-morango-chantininho": { s: "strawberry cream cup dessert", t: "doce" },
  "banana-com-mel-canela": { s: "banana honey cinnamon", t: "doce" },
  "maca-assada-canela": { s: "baked apple cinnamon", t: "doce" },
  "pera-cozida-mel": { s: "poached pear honey", t: "doce" },
  "trufa-chocolate": { s: "chocolate truffles", t: "doce" },
  "bombom-morango": { s: "chocolate covered strawberries", t: "doce" },
  "bombom-uva": { s: "chocolate covered grapes", t: "doce" },
  "creme-abacate-cacau": { s: "avocado chocolate mousse", t: "doce" },
  "creme-manga-coco": { s: "mango coconut cream dessert", t: "doce" },
  "iogurte-frutas-vermelhas-mel": { s: "yogurt berries honey", t: "doce" },
  "salada-frutas-citricas": { s: "citrus fruit salad", t: "doce" },
  "banana-caramelizada-forno": { s: "baked caramelized banana", t: "doce" },
  "pipoca-doce-chocolate": { s: "chocolate popcorn", t: "doce" },
  "bolo-mandioca-coco": { s: "cassava coconut cake", t: "doce" },
  "tapioca-doce-coco": { s: "sweet tapioca coconut condensed milk", t: "doce" },
  "cocada-queimada": { s: "burnt coconut candy", t: "doce" },
  "bolinho-coco-frito": { s: "fried coconut fritters", t: "doce" },
  "doce-mamao-coco": { s: "papaya coconut jam", t: "doce" },
  "bolo-abacaxi-calda": { s: "pineapple upside down cake", t: "doce" },
  "bolo-maracuja-cobertura": { s: "passion fruit cake frosting", t: "doce" },
  "cheesecake-limao-geladeira": { s: "lemon cheesecake", t: "doce" },
  "pudim-pao": { s: "bread pudding", t: "doce" },
  "rosquinhas-acucar-canela-forno": { s: "baked cinnamon sugar doughnuts", t: "doce" },
  "bolo-chocolate-cobertura-brigadeiro": { s: "chocolate cake fudge frosting", t: "doce" },
  "mousse-coco": { s: "coconut mousse dessert", t: "doce" },
  "geleia-frutas-vermelhas-caseira": { s: "homemade berry jam", t: "doce" },
  "banana-split-caseiro": { s: "banana split ice cream", t: "doce" },
  "suco-caju": { s: "cashew fruit juice", t: "doce" },
  "beijinho-limao": { s: "coconut lime truffles", t: "doce" },
  "doce-abobora-cristalizada": { s: "candied pumpkin", t: "doce" },
  "compota-goiaba": { s: "guava compote", t: "doce" },
  "suco-goiaba": { s: "guava juice", t: "doce" },
  "vitamina-abacaxi-coco": { s: "pineapple coconut smoothie", t: "doce" },
  "bolo-chocolate-banana": { s: "chocolate banana cake", t: "doce" },
  "torta-maca-sem-forno": { s: "no bake apple pie", t: "doce" },
  "creme-maracuja-colher": { s: "passion fruit cream dessert", t: "doce" },
  "cocada-de-forno": { s: "baked coconut candy", t: "doce" },
  "salada-frutas-mel-hortela": { s: "fruit salad honey mint", t: "doce" },
  "suco-manga-laranja": { s: "mango orange juice", t: "doce" },
  "vitamina-coco-banana": { s: "banana coconut smoothie", t: "doce" },
  "pudim-abacaxi": { s: "pineapple pudding", t: "doce" },
  "limonada-suica": { s: "brazilian lemonade", t: "doce" },
  "geladinho-de-morango-iogurte": { s: "strawberry yogurt popsicle", t: "doce" },
  "suspiro-forno": { s: "baked meringue kisses", t: "doce" },
  "bolo-pudim-caseiro": { s: "flan cake magic", t: "doce" },
  "bananada": { s: "banana paste candy", t: "doce" },
  "goiabada-caseira": { s: "guava paste bar", t: "doce" },
  "bolo-salame-chocolate": { s: "chocolate salami dessert", t: "doce" },
  "pipoca-doce-microondas": { s: "sweet popcorn bowl", t: "doce" },
  "banana-airfryer-canela-mel": { s: "air fryer banana cinnamon honey", t: "doce" },
  "abacaxi-airfryer-canela": { s: "roasted pineapple cinnamon", t: "doce" },
  "torta-banana-bolacha-sem-forno": { s: "no bake banana biscuit pie", t: "doce" },
  "compota-cereja": { s: "cherry compote", t: "doce" },
  "compota-ameixa": { s: "plum compote", t: "doce" },
  "vitamina-kiwi-maca": { s: "kiwi apple smoothie", t: "doce" },
  "suco-acerola": { s: "acerola cherry juice", t: "doce" },
  "cheesecake-cereja": { s: "cherry cheesecake", t: "doce" },
  "limonada-maracuja": { s: "passion fruit lemonade", t: "doce" },
  "strogonoff-carne-moida": { s: "ground beef stroganoff rice", t: "salgado" },
  "strogonoff-frango": { s: "chicken stroganoff rice", t: "salgado" },
  "hamburguer-caseiro": { s: "homemade hamburger", t: "salgado" },
  "quibe-de-forno": { s: "baked kibbeh", t: "salgado" },
  "boi-atolado": { s: "beef cassava stew", t: "salgado" },
  "file-frango-parmegiana": { s: "chicken parmesan", t: "salgado" },
  "polenta-ragu-carne-linguica": { s: "polenta beef sausage ragu", t: "salgado" },
  "crepioca-salgada-queijo": { s: "tapioca egg cheese wrap", t: "salgado" },
  "pao-tapioca-queijo": { s: "tapioca cheese bread", t: "salgado" },
  "baiao-de-dois": { s: "rice beans cheese brazilian", t: "salgado" },
  "tutu-de-feijao": { s: "refried beans brazilian", t: "salgado" },
  "galinhada": { s: "chicken rice one pot", t: "salgado" },
  "frango-com-quiabo": { s: "chicken okra stew", t: "salgado" },
  "camarao-na-moranga": { s: "shrimp pumpkin bowl", t: "salgado" },
  "peixada-simples": { s: "fish stew brazilian", t: "salgado" },
  "escondidinho-de-frango": { s: "chicken shepherds pie cassava", t: "salgado" },
  "torta-palmito-liquidificador": { s: "hearts of palm pie", t: "salgado" },
  "rocambole-de-carne": { s: "meatloaf roll", t: "salgado" },
  "enroladinho-de-salsicha": { s: "sausage rolls pastry", t: "salgado" },
  "bolinho-de-peixe-frito": { s: "fried fish cakes", t: "salgado" },
  "empadao-de-frango": { s: "chicken pot pie", t: "salgado" },
  "pastel-frito-de-queijo": { s: "fried cheese pastry", t: "salgado" },
  "risole-presunto-queijo": { s: "ham cheese rissole", t: "salgado" },
  "croquete-de-carne": { s: "beef croquettes", t: "salgado" },
  "frango-molho-curry-tomate": { s: "chicken curry tomato sauce", t: "salgado" },
  "frango-teriyaki": { s: "chicken teriyaki", t: "salgado" },
  "picanha-assada-forno-sal-grosso": { s: "roast picanha beef", t: "salgado" },
  "frango-ensopado-batata-baroa": { s: "chicken stew parsnip", t: "salgado" },
  "frango-a-camponesa": { s: "chicken vegetable stew", t: "salgado" },
  "frango-leite-coco-gengibre": { s: "chicken coconut milk ginger", t: "salgado" },
  "lasanha-frango-requeijao": { s: "creamy chicken lasagna", t: "salgado" },
  "frango-recheado-farofa": { s: "stuffed roast chicken", t: "salgado" },
  "bobo-de-camarao": { s: "shrimp cassava cream stew", t: "salgado" },
  "vatapa-de-camarao": { s: "vatapa shrimp bread stew", t: "salgado" },
  "costela-bovina-pressao-legumes": { s: "beef ribs stew vegetables", t: "salgado" },
  "fondue-de-carne-molhos": { s: "beef fondue sauces", t: "salgado" },
  "file-tilapia-grelhado-alho": { s: "grilled tilapia garlic", t: "salgado" },
  "salmao-molho-mostarda-mel": { s: "salmon honey mustard", t: "salgado" },
  "arroz-de-camarao": { s: "shrimp rice", t: "salgado" },
  "macarrao-camarao-alho-oleo": { s: "shrimp garlic pasta", t: "salgado" },
  "risoto-de-cogumelos": { s: "mushroom risotto", t: "salgado" },
  "risoto-de-abobora": { s: "pumpkin risotto", t: "salgado" },
  "arroz-carreteiro": { s: "beef rice brazilian", t: "salgado" },
  "feijao-tropeiro": { s: "beans cassava flour bacon", t: "salgado" },
  "omelete-presunto-queijo": { s: "ham cheese omelette", t: "salgado" },
  "panqueca-frango-requeijao": { s: "chicken crepe cream cheese", t: "salgado" },
  "bife-a-role-recheado": { s: "beef roulade stuffed", t: "salgado" },
  "lombo-suino-molho-laranja": { s: "pork loin orange sauce", t: "salgado" },
  "sufle-de-milho": { s: "corn souffle", t: "salgado" },
  "pure-batata-baroa": { s: "parsnip puree", t: "salgado" },
  "farofa-de-bacon": { s: "toasted cassava flour bacon", t: "salgado" },
  "farofa-de-banana": { s: "cassava flour banana", t: "salgado" },
  "arroz-biro-biro": { s: "fried rice egg bacon brazilian", t: "salgado" },
  "maionese-batata-cenoura-ervilha": { s: "potato salad carrot peas", t: "salgado" },
  "salada-caesar-frango-grelhado": { s: "caesar salad grilled chicken", t: "salgado" },
  "salada-pepino-iogurte": { s: "cucumber yogurt salad", t: "salgado" },
  "berinjela-grelhada-azeite-ervas": { s: "grilled eggplant herbs", t: "salgado" },
  "abobrinha-grelhada-parmesao": { s: "grilled zucchini parmesan", t: "salgado" },
  "sopa-abobora-gengibre": { s: "pumpkin ginger soup", t: "salgado" },
  "sopa-feijao-bacon": { s: "bean soup bacon", t: "salgado" },
  "creme-de-milho-salgado": { s: "creamy corn soup", t: "salgado" },
  "peixe-empanado-farinha-rosca": { s: "breaded fish fillet", t: "salgado" },
  "camarao-empanado-frito": { s: "fried breaded shrimp", t: "salgado" },
  "isca-frango-airfryer": { s: "air fryer chicken strips", t: "salgado" },
  "batata-frita-caseira-airfryer": { s: "air fryer french fries", t: "salgado" },
  "aneis-cebola-empanados": { s: "onion rings", t: "salgado" },
  "macarrao-linguica-brocolis": { s: "pasta sausage broccoli", t: "salgado" },
  "nhoque-molho-gorgonzola": { s: "gnocchi gorgonzola sauce", t: "salgado" },
  "feijao-enlatado-bacon-ervas": { s: "beans bacon herbs", t: "salgado" },
  "couve-com-bacon": { s: "sauteed collard greens bacon", t: "salgado" },
  "repolho-refogado-bacon": { s: "sauteed cabbage bacon", t: "salgado" },
  "chuchu-refogado-bacon": { s: "sauteed chayote bacon", t: "salgado" },
  "inhame-cozido-alho-azeite": { s: "boiled yam garlic olive oil", t: "salgado" },
  "cara-refogado-manteiga": { s: "sauteed yam butter", t: "salgado" },
  "beterraba-cozida-vinagrete": { s: "boiled beetroot vinaigrette", t: "salgado" },
  "nabo-refogado-manteiga": { s: "sauteed turnip butter", t: "salgado" },
  "aspargo-grelhado-alho": { s: "grilled asparagus garlic", t: "salgado" },
  "cogumelos-salteados-alho-ervas": { s: "sauteed mushrooms garlic herbs", t: "salgado" },
  "pimentao-recheado-arroz-carne": { s: "stuffed bell peppers rice beef", t: "salgado" },
  "bolo-chocolate-panela-pressao": { s: "chocolate cake slice", t: "doce" },
  "bolo-fuba-panela-pressao": { s: "cornmeal cake slice", t: "doce" },
  "bolo-cenoura-panela-pressao-chocolate": { s: "carrot cake chocolate topping", t: "doce" },
  "doce-leite-panela-pressao": { s: "dulce de leche jar", t: "doce" },
  "panqueca-americana-mel-chapa": { s: "pancakes stack honey", t: "doce" },
  "panqueca-banana-canela-chapa": { s: "banana pancakes cinnamon", t: "doce" },
  "crepioca-doce-banana-canela": { s: "tapioca pancake banana", t: "doce" },
  "tapioca-doce-leite-morango-chapa": { s: "tapioca crepe strawberry", t: "doce" },
  "pao-doce-churrasqueira-doce-leite": { s: "grilled sweet bread dulce de leche", t: "doce" },
  "banana-grelhada-churrasqueira-canela-mel": { s: "grilled banana honey cinnamon", t: "doce" },
  "pessego-grelhado-churrasqueira-mel-canela": { s: "grilled peach honey", t: "doce" },
  "bolo-caneca-chocolate-microondas": { s: "chocolate mug cake", t: "doce" },
  "brigadeiro-microondas": { s: "brigadeiro chocolate truffle", t: "doce" },
  "pudim-express-microondas": { s: "caramel pudding cup", t: "doce" },
  "maca-recheada-microondas-aveia-canela": { s: "baked apple oat cinnamon", t: "doce" },
  "cookies-chocolate-aveia": { s: "chocolate oatmeal cookies", t: "doce" },
  "biscoito-amanteigado-simples": { s: "butter cookies", t: "doce" },
  "muffin-chocolate": { s: "chocolate muffin", t: "doce" },
  "pao-de-mel-caseiro": { s: "honey cake chocolate covered", t: "doce" },
  "biscoito-polvilho-doce-assado": { s: "tapioca starch biscuits", t: "doce" },
  "granola-caseira-assada-mel": { s: "homemade granola honey", t: "doce" },
  "bolo-chocolate-cobertura-requeijao": { s: "chocolate cake cream cheese frosting", t: "doce" },
  "bolo-amendoim": { s: "peanut cake slice", t: "doce" },
  "pacoca-amendoim-caseira": { s: "peanut candy brazilian pacoca", t: "doce" },
  "pe-de-moleque-amendoim": { s: "peanut brittle", t: "doce" },
  "cajuzinho": { s: "peanut cashew truffle brazilian", t: "doce" },
  "olho-de-sogra": { s: "prune stuffed coconut candy", t: "doce" },
  "rabanada-tradicional": { s: "french toast cinnamon sugar", t: "doce" },
  "barra-cereal-caseira-sem-forno": { s: "homemade granola bars", t: "doce" },
  "mingau-aveia-banana-canela": { s: "oatmeal porridge banana cinnamon", t: "doce" },
  "parfait-iogurte-frutas-vermelhas-granola": { s: "yogurt granola berry parfait", t: "doce" },
  "fondue-chocolate-frutas": { s: "chocolate fondue fruit", t: "doce" },
  "biscoito-nata-caseiro": { s: "cream cookies", t: "doce" },
  "pao-doce-caseiro-rapido": { s: "sweet bread rolls", t: "doce" },
  "bolo-pote-doce-leite-bolacha": { s: "layered dessert jar dulce de leche", t: "doce" },
  "creme-mamao-leite-condensado": { s: "papaya cream dessert", t: "doce" },
  "cuca-banana-farofa-doce": { s: "banana crumb cake", t: "doce" },
  "torta-limao-assada": { s: "baked lemon meringue pie", t: "doce" },
  "cheesecake-assado-chocolate": { s: "baked chocolate cheesecake", t: "doce" },
  "sufle-chocolate": { s: "chocolate souffle", t: "doce" },
  "petit-gateau-caseiro": { s: "molten chocolate lava cake", t: "doce" },
  "espetinho-frutas-chocolate": { s: "chocolate dipped fruit skewers", t: "doce" },
  "rocambole-chocolate-morango": { s: "chocolate swiss roll strawberry", t: "doce" },
  "geladinho-chocolate": { s: "chocolate popsicle", t: "doce" },
  "sorvete-cremoso-morango-sem-sorveteira": { s: "strawberry ice cream", t: "doce" },
  "beijinho-chocolate": { s: "chocolate coconut truffle", t: "doce" },
  "romeu-julieta-goiaba-queijo": { s: "guava paste cheese dessert", t: "doce" },
  "bolo-chocolate-airfryer": { s: "chocolate cake slice plate", t: "doce" },
  "torrada-doce-canela-acucar": { s: "cinnamon sugar toast", t: "doce" },
  "iogurte-caseiro-natural": { s: "homemade natural yogurt bowl", t: "doce" },
  "caipirinha": { s: "caipirinha cocktail", t: "drink" },
  "caipiroska": { s: "vodka lime cocktail", t: "drink" },
  "caipifruta-morango": { s: "strawberry caipirinha cocktail", t: "drink" },
  "mojito": { s: "mojito cocktail", t: "drink" },
  "daiquiri": { s: "daiquiri cocktail", t: "drink" },
  "margarita": { s: "margarita cocktail", t: "drink" },
  "tequila-sunrise": { s: "tequila sunrise cocktail", t: "drink" },
  "paloma": { s: "paloma grapefruit cocktail", t: "drink" },
  "negroni": { s: "negroni cocktail", t: "drink" },
  "gin-tonica": { s: "gin tonic cocktail", t: "drink" },
  "tom-collins": { s: "tom collins cocktail", t: "drink" },
  "dry-martini": { s: "dry martini cocktail", t: "drink" },
  "cuba-libre": { s: "cuba libre rum coke cocktail", t: "drink" },
  "pina-colada": { s: "pina colada cocktail", t: "drink" },
  "moscow-mule": { s: "moscow mule copper mug", t: "drink" },
  "cosmopolitan": { s: "cosmopolitan cocktail", t: "drink" },
  "bay-breeze": { s: "cranberry pineapple cocktail", t: "drink" },
  "screwdriver": { s: "screwdriver orange cocktail", t: "drink" },
  "aperol-spritz": { s: "aperol spritz cocktail", t: "drink" },
  "campari-spritz": { s: "campari spritz cocktail", t: "drink" },
  "americano-cocktail": { s: "americano cocktail campari", t: "drink" },
  "garibaldi": { s: "campari orange juice cocktail", t: "drink" },
  "whisky-sour": { s: "whiskey sour cocktail", t: "drink" },
  "old-fashioned": { s: "old fashioned cocktail", t: "drink" },
  "perfect-manhattan": { s: "manhattan cocktail", t: "drink" },
  "sidecar": { s: "sidecar cocktail", t: "drink" },
  "espresso-martini": { s: "espresso martini cocktail", t: "drink" },
  "white-russian": { s: "white russian cocktail", t: "drink" },
  "sangria-tinta": { s: "red sangria pitcher", t: "drink" },
  "batida-de-coco": { s: "coconut cream cocktail", t: "drink" },
  "batida-de-maracuja": { s: "passion fruit cocktail", t: "drink" },
  "batida-de-morango": { s: "strawberry cream cocktail", t: "drink" },
  "batida-de-amendoim": { s: "peanut cocktail cream", t: "drink" },
  "caipirinha-frozen": { s: "frozen caipirinha cocktail", t: "drink" },
  "margarita-frozen": { s: "frozen margarita cocktail", t: "drink" },
  "daiquiri-morango-frozen": { s: "frozen strawberry daiquiri", t: "drink" },
  "pina-colada-frozen": { s: "frozen pina colada", t: "drink" },
  "frozen-de-manga": { s: "frozen mango cocktail", t: "drink" },
  "frozen-de-melancia": { s: "frozen watermelon cocktail", t: "drink" },
  "clericot-batido": { s: "white wine fruit sangria", t: "drink" },
  "sangria-branca": { s: "white sangria pitcher", t: "drink" },
  "batida-de-cafe": { s: "coffee cream cocktail", t: "drink" },
  "frozen-de-cassis": { s: "frozen blackcurrant cocktail", t: "drink" },
  "batida-de-banana": { s: "banana cream cocktail", t: "drink" },
  "virgin-mojito": { s: "virgin mojito mocktail", t: "drink" },
  "virgin-colada": { s: "virgin pina colada mocktail", t: "drink" },
  "shirley-temple": { s: "shirley temple mocktail cherry", t: "drink" },
  "virgin-tonic": { s: "virgin tonic mocktail", t: "drink" },
  "nojito-gengibre": { s: "ginger mint mocktail", t: "drink" },
  "ponche-de-frutas": { s: "fruit punch bowl", t: "drink" },
  "cha-gelado-pessego": { s: "iced peach tea", t: "drink" },
  "cha-gelado-limao": { s: "iced lemon tea", t: "drink" },
  "refresco-de-hibisco": { s: "hibiscus iced tea", t: "drink" },
  "cha-hibisco-laranja": { s: "hibiscus orange tea", t: "drink" },
  "spritz-sem-alcool": { s: "non alcoholic spritz mocktail", t: "drink" },
  "brinde-frutas-vermelhas": { s: "berry mocktail glass", t: "drink" },
  "cuba-libre-sem-alcool": { s: "cola lime mocktail", t: "drink" },
  "refresco-energetico-tropical": { s: "tropical energy drink", t: "drink" },
  "energetico-com-frutas": { s: "fruit energy drink", t: "drink" },
  "agua-de-coco-limao": { s: "coconut water lime", t: "drink" },
  "isotonico-natural": { s: "homemade sports drink", t: "drink" },
  "ginger-ale-limao": { s: "ginger ale lime glass", t: "drink" },
  "soda-italiana-morango": { s: "italian soda strawberry", t: "drink" },
  "soda-italiana-maracuja": { s: "italian soda passion fruit", t: "drink" },
  "limonada-rosa": { s: "pink lemonade", t: "drink" },
  "suco-detox-verde": { s: "green detox juice glass", t: "drink" },
  "vitamina-de-mamao": { s: "papaya smoothie glass", t: "drink" },
  "smoothie-frutas-vermelhas": { s: "berry smoothie", t: "drink" },
  "vitamina-de-banana": { s: "banana smoothie glass", t: "drink" },
  "vitamina-de-abacate": { s: "avocado smoothie glass", t: "drink" },
  "shake-de-morango": { s: "strawberry milkshake", t: "drink" },
  "shake-de-chocolate": { s: "chocolate milkshake", t: "drink" },
  "shake-de-cafe": { s: "coffee milkshake", t: "drink" },
  "smoothie-de-manga": { s: "mango smoothie", t: "drink" },
  "smoothie-tropical": { s: "tropical smoothie", t: "drink" },
  "vitamina-mamao-laranja": { s: "papaya orange smoothie", t: "drink" },
  "iogurte-batido-frutas": { s: "yogurt fruit smoothie", t: "drink" },
  "vitamina-de-aveia": { s: "oat smoothie glass", t: "drink" },
  "milkshake-de-baunilha": { s: "vanilla milkshake", t: "drink" },
  "vitamina-de-coco": { s: "coconut smoothie glass", t: "drink" },
  "shake-cremoso-cafe": { s: "creamy iced coffee shake", t: "drink" },
  "vitamina-de-uva": { s: "grape smoothie", t: "drink" },
  "suco-verde": { s: "green juice glass", t: "drink" },
  "suco-laranja-cenoura": { s: "orange carrot juice", t: "drink" },
  "limonada-de-gengibre": { s: "ginger lemonade", t: "drink" },
  "suco-de-maracuja": { s: "passion fruit juice glass", t: "drink" },
  "refresco-abacaxi-hortela": { s: "pineapple mint drink", t: "drink" },
  "saquerinha": { s: "sake lime cocktail", t: "drink" },
  "kir": { s: "kir cocktail white wine", t: "drink" },
  "ponche-de-hibisco": { s: "hibiscus punch", t: "drink" },
  "radler": { s: "radler beer lemon", t: "drink" },
  "michelada": { s: "michelada beer cocktail", t: "drink" },
  "tinto-de-verano": { s: "tinto de verano wine drink", t: "drink" },
  "aperol-tangerina": { s: "aperol tangerine cocktail", t: "drink" },
  "suco-melancia-gengibre": { s: "watermelon ginger juice", t: "drink" },
  "saquerinha-de-kiwi": { s: "kiwi sake cocktail", t: "drink" },
  "cafe-gelado-cremoso": { s: "iced coffee cream", t: "drink" },
  "cold-brew-tonico": { s: "cold brew tonic coffee", t: "drink" },
  "dark-n-stormy": { s: "dark and stormy cocktail", t: "drink" },
};

// Optional downscale/compression. `npm i -D sharp` to enable — without it the raw model output
// (~1 MB PNG/JPEG) is written unchanged.
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn(
    'AVISO: pacote "sharp" não encontrado — as imagens serão salvas sem compressão (~1 MB cada).\n' +
      '       Rode `npm i -D sharp` antes para gerar JPEGs de ~640px (~40-70 KB).\n'
  );
}

function buildPrompt(subject, tipo) {
  if (tipo === 'drink') {
    return (
      `Professional food photography of a freshly made ${subject}, served in an appropriate glass, ` +
      `on a light neutral surface (pale wood or white marble), soft natural window light, gentle shadows, ` +
      `condensation on the glass, a simple fresh garnish, 3:2 landscape composition, appetizing, natural colors, ` +
      `realistic, no text, no watermark, no hands, no people, no brand logos, no labels`
    );
  }
  return (
    `Professional overhead food photography of a finished home-cooked dish of ${subject}, ` +
    `served in a ceramic bowl or on a plate, on a light neutral surface (pale wood or white marble), ` +
    `soft natural window light, gentle shadows, a fork or napkin beside it, 3:2 landscape composition, ` +
    `fresh and appetizing, natural colors, realistic, shallow depth of field, ` +
    `no text, no watermark, no hands, no people, no brand logos`
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Warn if RECIPES drifts from the ids actually in recipes.ts.
function checkCoverage() {
  if (!existsSync(RECIPES_TS)) return;
  const src = readFileSync(RECIPES_TS, 'utf-8');
  const inCode = [...new Set([...src.matchAll(/^\s{2,4}id: '([a-z0-9-]+)',/gm)].map((m) => m[1]))];
  const declared = new Set(Object.keys(RECIPES));
  const missing = inCode.filter((id) => !declared.has(id));
  const extra = [...declared].filter((id) => !inCode.includes(id));
  if (missing.length) console.warn(`AVISO: sem subject para: ${missing.join(', ')}`);
  if (extra.length) console.warn(`AVISO: subject sem receita em recipes.ts: ${extra.join(', ')}`);
}

// 503/429/500 do modelo são picos de demanda transitórios — tenta de novo com backoff.
async function generateImage(prompt, attempt = 1) {
  const MAX_ATTEMPTS = 5;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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

async function toJpeg(buf) {
  if (!sharp) return buf;
  return sharp(buf)
    .resize({ width: 640, height: 427, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith('--only='));
  return {
    test: args.includes('--test'),
    all: args.includes('--all'),
    force: args.includes('--force'),
    only: onlyArg ? onlyArg.replace('--only=', '').split(',').filter(Boolean) : [],
  };
}

async function main() {
  const { test, all, force, only } = parseArgs();
  checkCoverage();

  if (test) {
    console.log(`Testing model "${MODEL}" with a single recipe ("quindim")...`);
    const buf = await toJpeg(await generateImage(buildPrompt(RECIPES['quindim'].s, 'doce')));
    const testPath = path.join(__dirname, 'test-output.jpg');
    writeFileSync(testPath, buf);
    console.log(`OK — wrote ${buf.length} bytes to ${testPath}. Open it to check quality before a batch.`);
    return;
  }

  if (!all && only.length === 0) {
    console.error('Pass --test, --all [--force], or --only=id1,id2. See file header.');
    process.exit(1);
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // Preserve entries from a previous run so --only doesn't wipe the rest.
  const existingMatch = EXISTING_TS?.match(/RECIPE_IMAGES: Record<string, RecipeImage> = (\{[\s\S]*?\n\});/);
  const results = existingMatch ? JSON.parse(existingMatch[1]) : {};

  let ids = all ? Object.keys(RECIPES) : only.filter((id) => RECIPES[id] || console.log(`id desconhecido: ${id}`));
  const pending = ids.filter((id) => {
    const done = results[id] && existsSync(path.join(OUTPUT_DIR, `${id}.jpg`));
    return force || !done;
  });
  const skipped = ids.length - pending.length;

  console.log(
    `Gerando ${pending.length} foto(s)` +
      (skipped > 0 ? ` (${skipped} já feitas, puladas — use --force pra refazer)` : '') +
      `${sharp ? '' : ' [sem compressão]'}...\n`
  );

  let ok = 0;
  const failed = [];
  for (const id of pending) {
    const { s, t } = RECIPES[id];
    const filePath = path.join(OUTPUT_DIR, `${id}.jpg`);
    try {
      const buf = await toJpeg(await generateImage(buildPrompt(s, t)));
      writeFileSync(filePath, buf);
      results[id] = { url: `/recipe-art/${id}.jpg` };
      ok++;
      console.log(`OK   ${id}  (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      failed.push(id);
      console.log(`FAIL ${id}: ${err.message}`);
    }
    await sleep(1200);
  }

  const fileContent = `// Auto-generated by scripts/fetch-recipe-art.mjs — do not hand-edit.
// Images generated by the Gemini API (${MODEL}), saved under public/recipe-art/.
// Keyed by recipe id. Screens fall back to the recipe emoji when an id has no entry.

export interface RecipeImage {
  url: string;
}

export const RECIPE_IMAGES: Record<string, RecipeImage> = ${JSON.stringify(results, null, 2)};
`;
  writeFileSync(OUTPUT_TS, fileContent, 'utf-8');

  console.log(`\nDone. ${ok}/${pending.length} nesta rodada. Total no lookup: ${Object.keys(results).length}/${Object.keys(RECIPES).length}.`);
  if (failed.length > 0) console.log(`Falharam (mantêm emoji): ${failed.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
