/**
 * Contexto passado para a tela /entrar quando o login é exigido por uma ação
 * (favoritar, salvar, seguir, postar...). O funil de cozinhar nunca usa isto —
 * cozinhar e navegar são anônimos. Ver docs da auditoria, Problema 1.
 */
export type AuthIntent =
  | 'favorite'
  | 'save'
  | 'follow'
  | 'post'
  | 'like'
  | 'comment'
  | 'create'
  | 'profile';

export const AUTH_INTENT_COPY: Record<AuthIntent, string> = {
  favorite: 'Entre pra guardar suas receitas favoritas.',
  save: 'Crie sua conta pra salvar esse prato no seu perfil.',
  follow: 'Entre pra seguir outros cozinheiros e acompanhar o que eles fazem.',
  post: 'Entre pra publicar seu prato e aparecer no feed da comunidade.',
  like: 'Entre pra curtir os pratos da comunidade.',
  comment: 'Entre pra comentar e conversar com outros cozinheiros.',
  create: 'Entre pra criar e publicar sua própria receita.',
  profile: 'Entre na sua conta.',
};
