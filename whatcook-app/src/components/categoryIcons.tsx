/**
 * Ícones de categoria de ingrediente — substituem o emoji funcional usado nas abas da tela
 * de seleção (Categorias.tsx). Mesmo padrão visual de components/icons.tsx (viewBox 24x24,
 * stroke, sem fill), mas centralizados aqui num único componente parametrizado por chave
 * em vez de 29 funções separadas, já que são só usados nesse contexto.
 */
interface CategoryIconProps {
  categoryKey: string;
  color?: string;
  size?: number;
}

const PATHS: Record<string, string[]> = {
  essenciais: ['M9 3h6l1 4H8l1-4z', 'M8 7h8l-1 12.5a1.5 1.5 0 01-1.5 1.5h-4a1.5 1.5 0 01-1.5-1.5L8 7z', 'M11 11v.01M13 13v.01M11 15v.01'],
  hortalicas: ['M4 20c1-9 6-14 15-15-1 9-6 14-15 15z', 'M8 16c2.5-2.5 5-5 8-8'],
  cogumelos: ['M4 11a8 8 0 0116 0H4z', 'M10 11v6a2 2 0 004 0v-6'],
  frutas: ['M12 9c-4 0-6 3-6 6.5S8.5 21 12 21s6-2 6-5.5S16 9 12 9z', 'M12 9c0-2 1-3 1-5', 'M12 4c1.5 0 2.5 1 2.5 1'],
  'geleias-conserva-fruta': ['M8 4h8v3H8z', 'M7 7h10l-1 13a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 20L7 7z', 'M8 11h8'],
  'frutas-secas-nozes': ['M12 4c4 0 6.5 3.5 6.5 8s-3 9-6.5 9-6.5-4.5-6.5-9S8 4 12 4z', 'M12 4v4', 'M9 8h6'],
  queijos: ['M4 18l16-8v8H4z', 'M4 18l16-8', 'M9 14v.01M13 12v.01M11 16v.01'],
  'laticinios-ovos': ['M12 22c3.5 0 6-2.5 6-6.5C18 10 12 3 12 3s-6 7-6 12.5c0 4 2.5 6.5 6 6.5z'],
  'veganos-vegetarianos': ['M4 20c8-1 14-6 15-15-9 1-14 7-15 15z', 'M8 16c2.5-2.5 5-5 8-8', 'M6 18l2-2'],
  frios: ['M4 8c4-2 12-2 16 0', 'M4 12c4-2 12-2 16 0', 'M4 16c4-2 12-2 16 0'],
  carnes: ['M9 4c3-1 6 1 7 4 1.5 4.5-1 8.5-5 9.5C8 18.5 5 20.5 4 21c1-2 1.5-4 1-6-2-2-2.5-6 0-8.5C6.5 5 7.5 4.3 9 4z', 'M13 8c1.5 0 3 1 3 3'],
  aves: ['M13 3c3 0 5 2.5 5 5.5 0 2-1 3.5-2.5 5C17 16 15 20 12 21c-.5-2 .5-4 1.5-5.5C11 15 9 13.5 9 11c0-2 1.5-3.5 4-4-.5-1.5 0-3 0-4z'],
  pescados: ['M3 12c4-4 9-5 13-3l4 3-4 3c-4 2-9 1-13-3z', 'M16 9l3-3M16 15l3 3', 'M6 12v.01'],
  especiarias: ['M12 21V9', 'M12 13c0-3-3-3-4-6 3 0 5 1.5 4 4', 'M12 10c0-3 3-3 4-6-3 0-5 1.5-4 4', 'M12 17c0-2-2-2-3-4 2 0 3.5 1 3 3'],
  'acucar-adocantes': ['M5 5h14v14H5z', 'M5 5l14 14M19 5L5 19'],
  pimentas: ['M8 4c1 0 2 .8 2 2 0 1.5-1.5 1.5-1.5 3', 'M8.5 9c-2.5 0-4.5 2.3-4.5 5.5C4 18 6.5 21 10 21c4.5 0 9-3.5 9-8.5 0-2-1-3.5-2.5-3.5-3 0-5 2-8 0z'],
  flores: ['M12 9a3 3 0 100 6 3 3 0 000-6z', 'M12 3a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3z', 'M12 15a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3z', 'M6 12a3 3 0 013-3 3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3z', 'M18 12a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3z'],
  'farinhas-fermentos': ['M12 21V10', 'M12 14c-2-1-3.5-3-3-6 2.5 1 4 2.5 4 5', 'M12 14c2-1 3.5-3 3-6-2.5 1-4 2.5-4 5', 'M12 10c-2-1-3.5-3-3-6 2.5 1 4 2.5 4 5', 'M12 10c2-1 3.5-3 3-6-2.5 1-4 2.5-4 5'],
  'graos-cereais': ['M8 12a3 4 0 116 0 3 4 0 01-6 0z', 'M14 15a2.5 3.5 0 115 0 2.5 3.5 0 01-5 0z', 'M6 17a2 2.8 0 114 0 2 2.8 0 01-4 0z'],
  massas: ['M4 18c2-3 1-6-1-8 3 1 6 0 7-3 1 3 4 4 7 3-2 2-3 5-1 8-3-1-6 0-7 3-1-3-4-4-5-3z'],
  'oleos-gorduras-vinagres': ['M10 3h4v3l2 2v11a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 19V8l2-2V3z', 'M8 11h8'],
  'conservas-vegetais': ['M6 6h12v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6z', 'M5 6h14', 'M9 6V4h6v2'],
  'molhos-condimentos': ['M10 3h4v2h-4z', 'M9 5h6l1 4v10a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 19V9l1-4z', 'M8 11h8'],
  'sopas-caldos': ['M4 12h16l-1 5a3 3 0 01-3 3H8a3 3 0 01-3-3l-1-5z', 'M4 12a2 2 0 010-4', 'M9 4c0 1.5-1.5 1.5-1.5 3M13 4c0 1.5-1.5 1.5-1.5 3'],
  'sobremesas-guloseimas': ['M8 9h8v6a4 4 0 01-4 4 4 4 0 01-4-4V9z', 'M5 9l3-2M19 9l-3-2', 'M12 15v.01'],
  'bebidas-sem-alcool': ['M6 8h12l-1.2 11.5a1.5 1.5 0 01-1.5 1.5H8.7a1.5 1.5 0 01-1.5-1.5L6 8z', 'M9 5c0-1.1.9-2 2-2h2a2 2 0 012 2', 'M15 4l1.5-1.5'],
  'bebidas-com-alcool': ['M5 5h14l-7 8v8', 'M9 21h6'],
  padaria: ['M4 14c0-5 3.5-9 8-9s8 4 8 9-3.5 5-8 5-8 0-8-5z', 'M9 12c.5-1.5 1.5-2 3-2s2.5.5 3 2'],
  equipamentos: ['M4 12a8 8 0 1116 0', 'M2 12h2M20 12h2', 'M4 12h16v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1z'],
};

export function CategoryIcon({ categoryKey, color = 'currentColor', size = 20 }: CategoryIconProps) {
  const paths = PATHS[categoryKey];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
