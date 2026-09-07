/**
 * Traduz as mensagens de erro do Supabase Auth (inglês, técnicas) para pt-BR
 * legível. Usado no AuthContext, então todas as telas de auth já pegam prontas.
 */
export function translateAuthError(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.toLowerCase();

  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Esse e-mail já tem uma conta. Toque em "Já tem conta? Entrar".';
  if (m.includes('email not confirmed'))
    return 'Confirme seu e-mail antes de entrar — o link está na sua caixa de entrada (e no spam).';
  if (m.includes('should be at least') && m.includes('character'))
    return 'A senha precisa de pelo menos 6 caracteres.';
  if (m.includes('unable to validate email') || m.includes('invalid format') || m.includes('invalid email'))
    return 'E-mail inválido.';
  if (m.includes('for security purposes') || m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
  if (m.includes('signup') && m.includes('disabled')) return 'O cadastro está temporariamente indisponível.';
  if (m.includes('provider is not enabled') || m.includes('unsupported provider'))
    return 'Esse método de login ainda não está disponível.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão. Verifique sua internet e tente de novo.';
  if (m.includes('new password should be different'))
    return 'A nova senha precisa ser diferente da anterior.';

  return 'Não foi possível concluir agora. Tente de novo em instantes.';
}
