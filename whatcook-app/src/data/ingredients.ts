// Taxonomia de itens do what?cook.
//
// Um item = { label (pt-BR, exibição), icon (emoji fallback), query (chave EN, único vínculo
// com recipes.ts — NUNCA renomear sem migrar as receitas), category, essential? }.
//
// `essential: true` faz o item aparecer TAMBÉM na seção "Ingredientes essenciais" no topo da
// tela, além da sua categoria real. A seção é montada por filtro, não é lista manual.
//
// Equipamentos vivem em `EQUIPAMENTOS` (category: 'equipamentos') e são tratados à parte no
// motor de busca (filtro "basta ter um"), não contam como ingrediente.

export type CategoryKey =
  | 'hortalicas'
  | 'cogumelos'
  | 'frutas'
  | 'geleias-conserva-fruta'
  | 'frutas-secas-nozes'
  | 'queijos'
  | 'laticinios-ovos'
  | 'veganos-vegetarianos'
  | 'frios'
  | 'carnes'
  | 'aves'
  | 'pescados'
  | 'especiarias'
  | 'acucar-adocantes'
  | 'pimentas'
  | 'flores'
  | 'farinhas-fermentos'
  | 'graos-cereais'
  | 'massas'
  | 'oleos-gorduras-vinagres'
  | 'conservas-vegetais'
  | 'molhos-condimentos'
  | 'sopas-caldos'
  | 'sobremesas-guloseimas'
  | 'bebidas-sem-alcool'
  | 'bebidas-com-alcool'
  | 'padaria'
  | 'equipamentos';

export interface IngredientOption {
  label: string;
  icon: string;
  /** Chave única em inglês, casada 1:1 com recipes.ts. */
  query: string;
  category: CategoryKey;
  /** Também listado na seção "Ingredientes essenciais". */
  essential?: boolean;
}

export interface IngredientCategory {
  key: CategoryKey;
  label: string;
  icon: string;
}

/** Categorias de ingrediente na ordem de exibição da tela (equipamentos é tratado à parte). */
export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  { key: 'hortalicas', label: 'Hortaliças e verduras', icon: '🥬' },
  { key: 'cogumelos', label: 'Cogumelos e fungos', icon: '🍄' },
  { key: 'frutas', label: 'Frutas', icon: '🍎' },
  { key: 'geleias-conserva-fruta', label: 'Geleias e frutas em conserva', icon: '🍯' },
  { key: 'frutas-secas-nozes', label: 'Frutas secas e nozes', icon: '🥜' },
  { key: 'queijos', label: 'Queijos', icon: '🧀' },
  { key: 'laticinios-ovos', label: 'Laticínios e ovos', icon: '🥛' },
  { key: 'veganos-vegetarianos', label: 'Veganos e vegetarianos', icon: '🌱' },
  { key: 'frios', label: 'Cortes frios', icon: '🥓' },
  { key: 'carnes', label: 'Carnes', icon: '🥩' },
  { key: 'aves', label: 'Aves', icon: '🍗' },
  { key: 'pescados', label: 'Pescados e frutos do mar', icon: '🐟' },
  { key: 'especiarias', label: 'Especiarias', icon: '🌿' },
  { key: 'acucar-adocantes', label: 'Açúcar, adoçantes e aditivos', icon: '🍬' },
  { key: 'pimentas', label: 'Pimentas quentes', icon: '🌶️' },
  { key: 'flores', label: 'Flores comestíveis', icon: '🌸' },
  { key: 'farinhas-fermentos', label: 'Farinhas, fermentos e leveduras', icon: '🌾' },
  { key: 'graos-cereais', label: 'Sementes, grãos, cereais e leguminosas', icon: '🫘' },
  { key: 'massas', label: 'Massas', icon: '🍝' },
  { key: 'oleos-gorduras-vinagres', label: 'Óleos, gorduras e vinagres', icon: '🫒' },
  { key: 'conservas-vegetais', label: 'Conservas vegetais', icon: '🥫' },
  { key: 'molhos-condimentos', label: 'Molhos e condimentos', icon: '🍶' },
  { key: 'sopas-caldos', label: 'Sopas e caldos', icon: '🍲' },
  { key: 'sobremesas-guloseimas', label: 'Sobremesas, salgadinhos e guloseimas', icon: '🍫' },
  { key: 'bebidas-sem-alcool', label: 'Bebidas sem álcool', icon: '🥤' },
  { key: 'bebidas-com-alcool', label: 'Bebidas com álcool', icon: '🍸' },
  { key: 'padaria', label: 'Padaria', icon: '🍞' },
];

export const INGREDIENTS: IngredientOption[] = [
  // ── Aves ────────────────────────────────────────────────────────────────
  { label: 'Frango inteiro', icon: '🍗', query: 'chicken', category: 'aves' },
  { label: 'Filé de frango', icon: '🍗', query: 'chicken breast', category: 'aves' },
  { label: 'Coxa de frango', icon: '🍗', query: 'chicken thigh', category: 'aves' },
  { label: 'Sobrecoxa', icon: '🍗', query: 'chicken drumstick', category: 'aves' },
  { label: 'Asa de frango', icon: '🍗', query: 'chicken wings', category: 'aves' },
  { label: 'Coração de frango', icon: '🍗', query: 'chicken heart', category: 'aves' },

  // ── Carnes ──────────────────────────────────────────────────────────────
  { label: 'Picanha', icon: '🥩', query: 'picanha', category: 'carnes' },
  { label: 'Alcatra', icon: '🥩', query: 'top sirloin', category: 'carnes' },
  { label: 'Filé mignon', icon: '🥩', query: 'beef tenderloin', category: 'carnes' },
  { label: 'Contrafilé', icon: '🥩', query: 'ribeye', category: 'carnes' },
  { label: 'Patinho', icon: '🥩', query: 'patinho', category: 'carnes' },
  { label: 'Maminha', icon: '🥩', query: 'maminha', category: 'carnes' },
  { label: 'Fraldinha', icon: '🥩', query: 'flank steak', category: 'carnes' },
  { label: 'Cupim', icon: '🥩', query: 'cupim', category: 'carnes' },
  { label: 'Lagarto', icon: '🥩', query: 'lagarto', category: 'carnes' },
  { label: 'Acém', icon: '🍖', query: 'chuck roast', category: 'carnes' },
  { label: 'Músculo', icon: '🍖', query: 'beef shank', category: 'carnes' },
  { label: 'Costela bovina', icon: '🍖', query: 'beef ribs', category: 'carnes' },
  { label: 'Carne moída', icon: '🍔', query: 'ground beef', category: 'carnes' },
  { label: 'Carne seca', icon: '🥩', query: 'dried beef', category: 'carnes' },
  { label: 'Carne de sol', icon: '🥩', query: 'sun-dried beef', category: 'carnes' },
  { label: 'Fígado', icon: '🍖', query: 'liver', category: 'carnes' },
  { label: 'Carne de porco', icon: '🍖', query: 'pork', category: 'carnes' },
  { label: 'Lombo suíno', icon: '🍖', query: 'pork loin', category: 'carnes' },
  { label: 'Pernil', icon: '🍖', query: 'pork leg', category: 'carnes' },
  { label: 'Bisteca', icon: '🥩', query: 'pork chop', category: 'carnes' },
  { label: 'Costela suína', icon: '🍖', query: 'pork ribs', category: 'carnes' },
  { label: 'Panceta (barriga)', icon: '🥓', query: 'pork belly', category: 'carnes' },
  { label: 'Bacon', icon: '🥓', query: 'bacon', category: 'carnes' },
  { label: 'Linguiça', icon: '🌭', query: 'pork sausage', category: 'carnes' },
  { label: 'Salsicha', icon: '🌭', query: 'sausage', category: 'carnes' },

  // ── Cortes frios ────────────────────────────────────────────────────────
  { label: 'Mortadela', icon: '🥓', query: 'mortadella', category: 'frios' },
  { label: 'Presunto', icon: '🥓', query: 'ham', category: 'frios' },
  { label: 'Peru', icon: '🦃', query: 'turkey', category: 'frios' },

  // ── Pescados e frutos do mar ────────────────────────────────────────────
  { label: 'Peixe', icon: '🐟', query: 'fish', category: 'pescados' },
  { label: 'Tilápia', icon: '🐟', query: 'tilapia', category: 'pescados' },
  { label: 'Salmão', icon: '🐟', query: 'salmon', category: 'pescados' },
  { label: 'Atum', icon: '🐟', query: 'tuna', category: 'pescados' },
  { label: 'Sardinha', icon: '🐟', query: 'sardine', category: 'pescados' },
  { label: 'Camarão', icon: '🦐', query: 'shrimp', category: 'pescados' },
  { label: 'Atum enlatado', icon: '🥫', query: 'canned tuna', category: 'pescados' },
  { label: 'Sardinha enlatada', icon: '🥫', query: 'canned sardine', category: 'pescados' },

  // ── Hortaliças e verduras ───────────────────────────────────────────────
  { label: 'Batata', icon: '🥔', query: 'potato', category: 'hortalicas' },
  { label: 'Batata doce', icon: '🍠', query: 'sweet potato', category: 'hortalicas' },
  { label: 'Batata baroa', icon: '🥔', query: 'arracacha', category: 'hortalicas' },
  { label: 'Cenoura', icon: '🥕', query: 'carrot', category: 'hortalicas' },
  { label: 'Cebola', icon: '🧅', query: 'onion', category: 'hortalicas', essential: true },
  { label: 'Alho', icon: '🧄', query: 'garlic', category: 'hortalicas', essential: true },
  { label: 'Beterraba', icon: '🍠', query: 'beet', category: 'hortalicas' },
  { label: 'Mandioca', icon: '🥔', query: 'cassava', category: 'hortalicas' },
  { label: 'Chuchu', icon: '🥒', query: 'chayote', category: 'hortalicas' },
  { label: 'Inhame', icon: '🍠', query: 'yam', category: 'hortalicas' },
  { label: 'Cará', icon: '🍠', query: 'taro', category: 'hortalicas' },
  { label: 'Nabo', icon: '⚪', query: 'turnip', category: 'hortalicas' },
  { label: 'Rabanete', icon: '🔴', query: 'radish', category: 'hortalicas' },
  { label: 'Alface', icon: '🥬', query: 'lettuce', category: 'hortalicas' },
  { label: 'Couve', icon: '🥬', query: 'collard greens', category: 'hortalicas' },
  { label: 'Espinafre', icon: '🥬', query: 'spinach', category: 'hortalicas' },
  { label: 'Rúcula', icon: '🥬', query: 'arugula', category: 'hortalicas' },
  { label: 'Repolho', icon: '🥬', query: 'cabbage', category: 'hortalicas' },
  { label: 'Brócolis', icon: '🥦', query: 'broccoli', category: 'hortalicas' },
  { label: 'Couve-flor', icon: '🥦', query: 'cauliflower', category: 'hortalicas' },
  { label: 'Agrião', icon: '🥬', query: 'watercress', category: 'hortalicas' },
  { label: 'Acelga', icon: '🥬', query: 'chard', category: 'hortalicas' },
  { label: 'Almeirão', icon: '🥬', query: 'escarole', category: 'hortalicas' },
  { label: 'Escarola', icon: '🥬', query: 'batavia lettuce', category: 'hortalicas' },
  { label: 'Chicória', icon: '🥬', query: 'chicory', category: 'hortalicas' },
  { label: 'Mostarda (folha)', icon: '🥬', query: 'mustard greens', category: 'hortalicas' },
  { label: 'Taioba', icon: '🥬', query: 'taioba', category: 'hortalicas' },
  { label: 'Tomate', icon: '🍅', query: 'tomato', category: 'hortalicas', essential: true },
  { label: 'Pimentão', icon: '🫑', query: 'bell pepper', category: 'hortalicas' },
  { label: 'Abobrinha', icon: '🥒', query: 'zucchini', category: 'hortalicas' },
  { label: 'Berinjela', icon: '🍆', query: 'eggplant', category: 'hortalicas' },
  { label: 'Pepino', icon: '🥒', query: 'cucumber', category: 'hortalicas' },
  { label: 'Milho', icon: '🌽', query: 'corn', category: 'hortalicas' },
  { label: 'Ervilha', icon: '🟢', query: 'peas', category: 'hortalicas' },
  { label: 'Vagem', icon: '🫛', query: 'green beans', category: 'hortalicas' },
  { label: 'Abóbora', icon: '🎃', query: 'pumpkin', category: 'hortalicas' },
  { label: 'Quiabo', icon: '🫛', query: 'okra', category: 'hortalicas' },
  { label: 'Jiló', icon: '🟢', query: 'scarlet eggplant', category: 'hortalicas' },
  { label: 'Aspargo', icon: '🌱', query: 'asparagus', category: 'hortalicas' },
  { label: 'Alho-poró', icon: '🧅', query: 'leek', category: 'hortalicas' },
  { label: 'Aipo', icon: '🌿', query: 'celery', category: 'hortalicas' },

  // ── Cogumelos e fungos ──────────────────────────────────────────────────
  { label: 'Cogumelo', icon: '🍄', query: 'mushroom', category: 'cogumelos' },

  // ── Frutas ──────────────────────────────────────────────────────────────
  { label: 'Banana', icon: '🍌', query: 'banana', category: 'frutas' },
  { label: 'Maçã', icon: '🍎', query: 'apple', category: 'frutas' },
  { label: 'Limão', icon: '🍋', query: 'lemon', category: 'frutas' },
  { label: 'Laranja', icon: '🍊', query: 'orange', category: 'frutas' },
  { label: 'Tangerina', icon: '🍊', query: 'tangerine', category: 'frutas' },
  { label: 'Abacaxi', icon: '🍍', query: 'pineapple', category: 'frutas' },
  { label: 'Manga', icon: '🥭', query: 'mango', category: 'frutas' },
  { label: 'Morango', icon: '🍓', query: 'strawberry', category: 'frutas' },
  { label: 'Uva', icon: '🍇', query: 'grape', category: 'frutas' },
  { label: 'Abacate', icon: '🥑', query: 'avocado', category: 'frutas' },
  { label: 'Coco', icon: '🥥', query: 'coconut', category: 'frutas' },
  { label: 'Melancia', icon: '🍉', query: 'watermelon', category: 'frutas' },
  { label: 'Melão', icon: '🍈', query: 'melon', category: 'frutas' },
  { label: 'Mamão', icon: '🟠', query: 'papaya', category: 'frutas' },
  { label: 'Maracujá', icon: '🟣', query: 'passion fruit', category: 'frutas' },
  { label: 'Goiaba', icon: '🍐', query: 'guava', category: 'frutas' },
  { label: 'Pêssego', icon: '🍑', query: 'peach', category: 'frutas' },
  { label: 'Pera', icon: '🍐', query: 'pear', category: 'frutas' },
  { label: 'Kiwi', icon: '🥝', query: 'kiwi', category: 'frutas' },
  { label: 'Cereja', icon: '🍒', query: 'cherry', category: 'frutas' },
  { label: 'Ameixa', icon: '🟣', query: 'plum', category: 'frutas' },
  { label: 'Caju', icon: '🟠', query: 'cashew fruit', category: 'frutas' },
  { label: 'Acerola', icon: '🔴', query: 'acerola', category: 'frutas' },
  { label: 'Lichia', icon: '⚪', query: 'lychee', category: 'frutas' },

  // ── Geleias e frutas em conserva ────────────────────────────────────────
  { label: 'Pêssego em calda', icon: '🥫', query: 'canned peach', category: 'geleias-conserva-fruta' },

  // ── Frutas secas e nozes ────────────────────────────────────────────────
  { label: 'Amendoim', icon: '🥜', query: 'peanut', category: 'frutas-secas-nozes' },
  { label: 'Coco ralado', icon: '🥥', query: 'shredded coconut', category: 'frutas-secas-nozes' },

  // ── Queijos ─────────────────────────────────────────────────────────────
  { label: 'Queijo', icon: '🧀', query: 'cheese', category: 'queijos' },
  { label: 'Requeijão', icon: '🧀', query: 'cream cheese', category: 'queijos' },

  // ── Laticínios e ovos ───────────────────────────────────────────────────
  { label: 'Ovo', icon: '🥚', query: 'egg', category: 'laticinios-ovos', essential: true },
  { label: 'Leite', icon: '🥛', query: 'milk', category: 'laticinios-ovos', essential: true },
  { label: 'Leite em pó', icon: '🥛', query: 'powdered milk', category: 'laticinios-ovos' },
  { label: 'Leite condensado', icon: '🥫', query: 'condensed milk', category: 'laticinios-ovos' },
  { label: 'Creme de leite', icon: '🥛', query: 'heavy cream', category: 'laticinios-ovos' },
  { label: 'Iogurte', icon: '🥛', query: 'yogurt', category: 'laticinios-ovos' },
  { label: 'Manteiga', icon: '🧈', query: 'butter', category: 'laticinios-ovos', essential: true },

  // ── Veganos e vegetarianos ──────────────────────────────────────────────
  { label: 'Leite de coco', icon: '🥥', query: 'coconut milk', category: 'veganos-vegetarianos' },

  // ── Óleos, gorduras e vinagres ──────────────────────────────────────────
  { label: 'Óleo', icon: '🛢️', query: 'vegetable oil', category: 'oleos-gorduras-vinagres', essential: true },
  { label: 'Azeite', icon: '🫒', query: 'olive oil', category: 'oleos-gorduras-vinagres', essential: true },
  { label: 'Margarina', icon: '🧈', query: 'margarine', category: 'oleos-gorduras-vinagres' },
  { label: 'Vinagre', icon: '🍶', query: 'vinegar', category: 'oleos-gorduras-vinagres' },

  // ── Farinhas, fermentos e leveduras ─────────────────────────────────────
  { label: 'Farinha de Trigo', icon: '🌾', query: 'flour', category: 'farinhas-fermentos', essential: true },
  { label: 'Farinha de rosca', icon: '🌾', query: 'breadcrumbs', category: 'farinhas-fermentos' },
  { label: 'Farinha de mandioca', icon: '🌾', query: 'cassava flour', category: 'farinhas-fermentos' },
  { label: 'Fubá', icon: '🌽', query: 'corn flour', category: 'farinhas-fermentos' },
  { label: 'Maisena', icon: '🌽', query: 'cornstarch', category: 'farinhas-fermentos' },
  { label: 'Polvilho', icon: '🌾', query: 'tapioca starch', category: 'farinhas-fermentos' },
  { label: 'Fermento', icon: '🫧', query: 'baking powder', category: 'farinhas-fermentos', essential: true },

  // ── Sementes, grãos, cereais e leguminosas ──────────────────────────────
  { label: 'Arroz', icon: '🍚', query: 'rice', category: 'graos-cereais' },
  { label: 'Arroz integral', icon: '🍚', query: 'brown rice', category: 'graos-cereais' },
  { label: 'Feijão carioca', icon: '🫘', query: 'pinto beans', category: 'graos-cereais' },
  { label: 'Feijão preto', icon: '🫘', query: 'black beans', category: 'graos-cereais' },
  { label: 'Feijão fradinho', icon: '🫘', query: 'black-eyed peas', category: 'graos-cereais' },
  { label: 'Lentilha', icon: '🫘', query: 'lentils', category: 'graos-cereais' },
  { label: 'Grão de bico', icon: '🫘', query: 'chickpeas', category: 'graos-cereais' },
  { label: 'Quinoa', icon: '🌾', query: 'quinoa', category: 'graos-cereais' },
  { label: 'Aveia', icon: '🌾', query: 'oats', category: 'graos-cereais' },
  { label: 'Milho de pipoca', icon: '🌽', query: 'popcorn', category: 'graos-cereais' },

  // ── Massas ──────────────────────────────────────────────────────────────
  { label: 'Macarrão', icon: '🍝', query: 'pasta', category: 'massas' },

  // ── Padaria ─────────────────────────────────────────────────────────────
  { label: 'Pão', icon: '🍞', query: 'bread', category: 'padaria' },
  { label: 'Biscoito maisena', icon: '🍪', query: 'maria cookies', category: 'padaria' },

  // ── Conservas vegetais ──────────────────────────────────────────────────
  { label: 'Milho enlatado', icon: '🥫', query: 'canned corn', category: 'conservas-vegetais' },
  { label: 'Ervilha enlatada', icon: '🥫', query: 'canned peas', category: 'conservas-vegetais' },
  { label: 'Feijão enlatado', icon: '🥫', query: 'canned beans', category: 'conservas-vegetais' },
  { label: 'Grão de bico enlatado', icon: '🥫', query: 'canned chickpeas', category: 'conservas-vegetais' },
  { label: 'Palmito', icon: '🥫', query: 'heart of palm', category: 'conservas-vegetais' },
  { label: 'Azeitona', icon: '🫒', query: 'olives', category: 'conservas-vegetais' },
  { label: 'Seleta de legumes', icon: '🥫', query: 'mixed vegetables', category: 'conservas-vegetais' },
  { label: 'Champignon enlatado', icon: '🍄', query: 'canned mushroom', category: 'conservas-vegetais' },

  // ── Açúcar, adoçantes e aditivos ────────────────────────────────────────
  { label: 'Açúcar', icon: '🍬', query: 'sugar', category: 'acucar-adocantes', essential: true },
  { label: 'Mel', icon: '🍯', query: 'honey', category: 'acucar-adocantes' },

  // ── Sobremesas, salgadinhos e guloseimas ────────────────────────────────
  { label: 'Chocolate em pó', icon: '🍫', query: 'cocoa powder', category: 'sobremesas-guloseimas' },
  { label: 'Chocolate (barra ou gotas)', icon: '🍫', query: 'chocolate', category: 'sobremesas-guloseimas' },

  // ── Especiarias ─────────────────────────────────────────────────────────
  { label: 'Pimenta do Reino', icon: '🌶️', query: 'black pepper', category: 'especiarias', essential: true },
  { label: 'Colorau', icon: '🔴', query: 'paprika', category: 'especiarias' },
  { label: 'Páprica', icon: '🌶️', query: 'sweet paprika', category: 'especiarias' },
  { label: 'Açafrão', icon: '🟡', query: 'turmeric', category: 'especiarias' },
  { label: 'Orégano', icon: '🌿', query: 'oregano', category: 'especiarias' },
  { label: 'Manjericão', icon: '🌿', query: 'basil', category: 'especiarias' },
  { label: 'Tomilho', icon: '🌿', query: 'thyme', category: 'especiarias' },
  { label: 'Alecrim', icon: '🌿', query: 'rosemary', category: 'especiarias' },
  { label: 'Louro', icon: '🌿', query: 'bay leaf', category: 'especiarias' },
  { label: 'Coentro', icon: '🌿', query: 'cilantro', category: 'especiarias' },
  { label: 'Hortelã', icon: '🌿', query: 'mint', category: 'especiarias' },
  { label: 'Cheiro verde', icon: '🌿', query: 'parsley', category: 'especiarias' },
  { label: 'Cominho', icon: '🌿', query: 'cumin', category: 'especiarias' },
  { label: 'Alho em pó', icon: '🧄', query: 'garlic powder', category: 'especiarias' },
  { label: 'Canela', icon: '🟤', query: 'cinnamon', category: 'especiarias' },
  { label: 'Cravo', icon: '🟤', query: 'cloves', category: 'especiarias' },
  { label: 'Noz-moscada', icon: '🌰', query: 'nutmeg', category: 'especiarias' },
  { label: 'Curry', icon: '🍛', query: 'curry powder', category: 'especiarias' },
  { label: 'Gengibre', icon: '🫚', query: 'ginger', category: 'especiarias' },

  // ── Pimentas quentes ────────────────────────────────────────────────────
  { label: 'Pimenta calabresa', icon: '🌶️', query: 'calabrian pepper', category: 'pimentas' },
  { label: 'Molho de pimenta', icon: '🌶️', query: 'hot sauce', category: 'pimentas' },

  // ── Sopas e caldos ──────────────────────────────────────────────────────
  { label: 'Caldo de legumes', icon: '🧂', query: 'vegetable bouillon', category: 'sopas-caldos' },

  // ── Molhos e condimentos ────────────────────────────────────────────────
  { label: 'Molho de Tomate', icon: '🥫', query: 'tomato sauce', category: 'molhos-condimentos' },
  { label: 'Molho rosé', icon: '🍅', query: 'rose sauce', category: 'molhos-condimentos' },
  { label: 'Molho branco', icon: '🥛', query: 'white sauce', category: 'molhos-condimentos' },
  { label: 'Molho pesto', icon: '🌿', query: 'pesto sauce', category: 'molhos-condimentos' },
  { label: 'Ketchup', icon: '🍅', query: 'ketchup', category: 'molhos-condimentos' },
  { label: 'Mostarda', icon: '🌭', query: 'mustard', category: 'molhos-condimentos' },
  { label: 'Maionese', icon: '🥚', query: 'mayonnaise', category: 'molhos-condimentos' },
  { label: 'Barbecue', icon: '🍖', query: 'barbecue sauce', category: 'molhos-condimentos' },
  { label: 'Molho de soja', icon: '🍶', query: 'soy sauce', category: 'molhos-condimentos' },
  { label: 'Molho inglês', icon: '🍶', query: 'worcestershire sauce', category: 'molhos-condimentos' },
  { label: 'Molho de alho', icon: '🧄', query: 'garlic sauce', category: 'molhos-condimentos' },
  { label: 'Molho agridoce', icon: '🍯', query: 'sweet and sour sauce', category: 'molhos-condimentos' },
  { label: 'Vinagrete', icon: '🍅', query: 'vinaigrette', category: 'molhos-condimentos' },

  // ── Bebidas com álcool (bar) ────────────────────────────────────────────
  { label: 'Cachaça', icon: '🍶', query: 'cachaca', category: 'bebidas-com-alcool' },
  { label: 'Vodka', icon: '🍸', query: 'vodka', category: 'bebidas-com-alcool' },
  { label: 'Gin', icon: '🍸', query: 'gin', category: 'bebidas-com-alcool' },
  { label: 'Rum branco', icon: '🥃', query: 'white rum', category: 'bebidas-com-alcool' },
  { label: 'Rum escuro', icon: '🥃', query: 'dark rum', category: 'bebidas-com-alcool' },
  { label: 'Tequila', icon: '🥃', query: 'tequila', category: 'bebidas-com-alcool' },
  { label: 'Whisky', icon: '🥃', query: 'whiskey', category: 'bebidas-com-alcool' },
  { label: 'Conhaque', icon: '🥃', query: 'brandy', category: 'bebidas-com-alcool' },
  { label: 'Triple sec', icon: '🍊', query: 'triple sec', category: 'bebidas-com-alcool' },
  { label: 'Aperol', icon: '🧡', query: 'aperol', category: 'bebidas-com-alcool' },
  { label: 'Campari', icon: '❤️', query: 'campari', category: 'bebidas-com-alcool' },
  { label: 'Vermute seco', icon: '🍷', query: 'dry vermouth', category: 'bebidas-com-alcool' },
  { label: 'Vermute tinto', icon: '🍷', query: 'sweet vermouth', category: 'bebidas-com-alcool' },
  { label: 'Vinho tinto', icon: '🍷', query: 'red wine', category: 'bebidas-com-alcool' },
  { label: 'Vinho branco', icon: '🥂', query: 'white wine', category: 'bebidas-com-alcool' },
  { label: 'Espumante', icon: '🍾', query: 'sparkling wine', category: 'bebidas-com-alcool' },
  { label: 'Cerveja', icon: '🍺', query: 'beer', category: 'bebidas-com-alcool' },
  { label: 'Licor de café', icon: '☕', query: 'coffee liqueur', category: 'bebidas-com-alcool' },
  { label: 'Licor de cassis', icon: '🫐', query: 'cassis liqueur', category: 'bebidas-com-alcool' },
  { label: 'Saquê', icon: '🍶', query: 'sake', category: 'bebidas-com-alcool' },

  // ── Bebidas sem álcool (bar) ────────────────────────────────────────────
  { label: 'Água com gás', icon: '💧', query: 'sparkling water', category: 'bebidas-sem-alcool' },
  { label: 'Água tônica', icon: '🫧', query: 'tonic water', category: 'bebidas-sem-alcool' },
  { label: 'Refrigerante de cola', icon: '🥤', query: 'cola', category: 'bebidas-sem-alcool' },
  { label: 'Refrigerante de limão', icon: '🥤', query: 'lemon-lime soda', category: 'bebidas-sem-alcool' },
  { label: 'Ginger ale', icon: '🫚', query: 'ginger ale', category: 'bebidas-sem-alcool' },
  { label: 'Ginger beer', icon: '🫚', query: 'ginger beer', category: 'bebidas-sem-alcool' },
  { label: 'Energético', icon: '⚡', query: 'energy drink', category: 'bebidas-sem-alcool' },
  { label: 'Água de coco', icon: '🥥', query: 'coconut water', category: 'bebidas-sem-alcool' },
  { label: 'Suco de laranja', icon: '🧃', query: 'orange juice', category: 'bebidas-sem-alcool' },
  { label: 'Suco de cranberry', icon: '🧃', query: 'cranberry juice', category: 'bebidas-sem-alcool' },
  { label: 'Suco de abacaxi', icon: '🧃', query: 'pineapple juice', category: 'bebidas-sem-alcool' },
  { label: 'Suco de uva', icon: '🧃', query: 'grape juice', category: 'bebidas-sem-alcool' },
  { label: 'Xarope de açúcar', icon: '🍯', query: 'simple syrup', category: 'bebidas-sem-alcool' },
  { label: 'Granadina', icon: '🔴', query: 'grenadine', category: 'bebidas-sem-alcool' },
  { label: 'Café', icon: '☕', query: 'coffee', category: 'bebidas-sem-alcool' },
  { label: 'Chá preto', icon: '🍵', query: 'black tea', category: 'bebidas-sem-alcool' },
  { label: 'Chá de hibisco', icon: '🌺', query: 'hibiscus tea', category: 'bebidas-sem-alcool' },
  { label: 'Espumante sem álcool', icon: '🍾', query: 'sparkling grape juice', category: 'bebidas-sem-alcool' },
];

export const EQUIPAMENTOS: IngredientOption[] = [
  { label: 'Fogão', icon: '🔥', query: 'stove', category: 'equipamentos' },
  { label: 'Forno', icon: '🍞', query: 'oven', category: 'equipamentos' },
  { label: 'Airfryer', icon: '🌀', query: 'air fryer', category: 'equipamentos' },
  { label: 'Micro-ondas', icon: '📡', query: 'microwave', category: 'equipamentos' },
  { label: 'Grelha', icon: '🍢', query: 'grill pan', category: 'equipamentos' },
  { label: 'Churrasqueira', icon: '🔥', query: 'barbecue grill', category: 'equipamentos' },
  { label: 'Chapa', icon: '🥘', query: 'griddle', category: 'equipamentos' },
  { label: 'Liquidificador', icon: '🥤', query: 'blender', category: 'equipamentos' },
  { label: 'Panela de pressão', icon: '🍲', query: 'pressure cooker', category: 'equipamentos' },
  { label: 'Coqueteleira', icon: '🍸', query: 'cocktail shaker', category: 'equipamentos' },
];

/** Todos os itens selecionáveis (ingredientes + equipamentos), lista única. */
export const ALL_ITEMS: IngredientOption[] = [...INGREDIENTS, ...EQUIPAMENTOS];

/** Itens marcados como essenciais, na ordem em que aparecem em INGREDIENTS. */
export const ESSENTIAL_INGREDIENTS: IngredientOption[] = INGREDIENTS.filter((i) => i.essential);

/** Ingredientes de uma categoria específica (não inclui equipamentos). */
export function ingredientsFor(category: CategoryKey): IngredientOption[] {
  return INGREDIENTS.filter((i) => i.category === category);
}
