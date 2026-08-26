import { supabase } from '../lib/supabaseClient';

/** Uploads a story photo to the shared "recipe-photos" bucket and creates the story row. */
export async function postStory(userId: string, blob: Blob, sourceDishId?: string): Promise<{ error: string | null }> {
  const path = `${userId}/story-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('recipe-photos')
    .upload(path, blob, { contentType: 'image/jpeg' });
  if (uploadError) return { error: `Não foi possível enviar a foto do story. (${uploadError.message})` };

  const photoUrl = supabase.storage.from('recipe-photos').getPublicUrl(path).data.publicUrl;
  const { error: insertError } = await supabase
    .from('stories')
    .insert({ user_id: userId, photo_url: photoUrl, source_dish_id: sourceDishId ?? null });
  if (insertError) return { error: `Não foi possível publicar o story. (${insertError.message})` };

  return { error: null };
}

/** Relative "há Xh" / "há Xd" label for story timestamps. */
export function timeAgoLabel(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}
