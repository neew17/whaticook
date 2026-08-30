import { supabase } from '../lib/supabaseClient';

/** Sobe a foto local (data URL) pro bucket público `recipe-photos` e devolve a URL. */
export async function uploadDishPhoto(
  dishPhoto: string,
  recipeId: string,
  ownerId: string | null
): Promise<string | null> {
  try {
    const blob = await (await fetch(dishPhoto)).blob();
    const owner = ownerId ?? 'anon';
    const path = `${owner}/${recipeId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('recipe-photos')
      .upload(path, blob, { contentType: 'image/jpeg' });
    if (error) return null;
    return supabase.storage.from('recipe-photos').getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

/** Grava o prato pronto no perfil do usuário (`saved_dishes`). Sobe a foto se houver. */
export async function saveDishToProfile(params: {
  userId: string;
  recipeId: string;
  title: string;
  dishPhoto: string | null;
}): Promise<{ ok: boolean }> {
  const photoUrl = params.dishPhoto
    ? await uploadDishPhoto(params.dishPhoto, params.recipeId, params.userId)
    : null;
  const { error } = await supabase.from('saved_dishes').insert({
    user_id: params.userId,
    recipe_id: params.recipeId,
    title: params.title,
    photo_url: photoUrl,
  });
  return { ok: !error };
}
