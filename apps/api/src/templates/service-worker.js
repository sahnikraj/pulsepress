self.addEventListener('push', function (event) {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || 'New update';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      icon: payload.icon,
      image: payload.image,
      data: {
        url: payload.url,
        campaignId: payload.campaignId
      }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(clients.openWindow(url));
});
