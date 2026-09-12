// Service worker mínimo pra push notifications (fundação — ver src/utils/pushNotifications.ts).
// Não faz cache de assets/offline: única responsabilidade aqui é receber o push e mostrar
// a notificação, e reagir a clique nela. O disparo de verdade (Edge Function no Supabase)
// ainda não existe — isso só recebe o evento 'push' quando ele passar a acontecer.

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'what?cook', body: event.data.text() };
  }
  const { title, body, url, tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title || 'what?cook', {
      body,
      icon: '/favicon.svg',
      tag: tag || 'whatcook-notification',
      data: { url: url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
