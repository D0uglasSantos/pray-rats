self.addEventListener("push", (event) => {
  let data = { title: "PrayRats", body: "", link: "/" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // use defaults
  }

  // Absolute URLs avoid intermittent broken icons when the SW resolves
  // relative paths incorrectly. Badge must be a white silhouette on
  // transparent background — Android tints opaque pixels white in the
  // status bar (a full-color square becomes a white square).
  const origin = self.location.origin;
  const icon = data.icon || `${origin}/icons/icon-192.png`;
  const badge = data.badge || `${origin}/icons/badge-96.png`;

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon,
      badge,
      data: { link: data.link },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/notifications";
  event.waitUntil(clients.openWindow(link));
});
