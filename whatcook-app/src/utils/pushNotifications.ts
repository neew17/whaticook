import { supabase } from '../lib/supabaseClient';

/**
 * Chave pública VAPID — segura pra expor no cliente (é a metade que identifica o servidor
 * pro navegador, não autentica nada sozinha). A chave privada correspondente NÃO mora no
 * repo: fica como secret do Supabase quando a Edge Function de envio for criada (fase
 * seguinte — isso aqui é só a fundação: permissão + inscrição, ainda sem disparo real).
 */
const VAPID_PUBLIC_KEY = 'BNE0GiUZQXU4GuschrnEjHjiGdUMggh6Ae2wztOAEiKWEvAExmUyBBbKQP2C1y5Bom72iFT6nFkTFmrHr7E5230';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js');
}

/**
 * Pede permissão (se ainda não decidida), registra o service worker e salva a inscrição
 * em `push_subscriptions`. Silencioso em qualquer recusa/erro — ativar notificação é uma
 * ação opcional, nunca pode travar o resto da tela.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return false;

    const registration = await registerServiceWorker();
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    const endpoint = subscription?.endpoint;
    await subscription?.unsubscribe();
    if (endpoint) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
    }
  } catch {
    /* ignore — desativar notificação também não pode travar a tela */
  }
}
