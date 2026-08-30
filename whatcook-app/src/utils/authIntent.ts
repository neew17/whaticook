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
  | 'cook'
  | 'profile';

export const AUTH_INTENT_COPY: Record<AuthIntent, string> = {
  favorite: 'Crie sua conta pra guardar suas receitas favoritas.',
  save: 'Crie sua conta pra salvar esse prato no seu perfil.',
  follow: 'Crie sua conta pra seguir cozinheiros e acompanhar o que eles fazem.',
  post: 'Crie sua conta pra publicar seu prato no feed da comunidade.',
  like: 'Crie sua conta pra curtir os pratos da comunidade.',
  comment: 'Crie sua conta pra comentar e conversar com outros cozinheiros.',
  create: 'Crie sua conta pra criar e publicar sua própria receita.',
  cook: 'Crie sua conta grátis pra cozinhar essa receita passo a passo.',
  profile: 'Entre na sua conta.',
};
