(function(self) {
  'use strict';

  self.addEventListener('install', function (event) {
    return event.waitUntil(
      self.caches.open(${cacheName}).then(function (cache) {
        return cache.addAll(${requests});
      })
    );
  });

  self.addEventListener('fetch', function (event) {
    return event.respondWith(
      self.caches.open(${cacheName}).then(function (cache) {
        return cache.match(event.request).then(function (response) {
          if (response) {
            event.waitUntil(cache.add(event.request));
            return response;
          }

          return fetch(event.request);
        });
      })
    );
  });
})(self);
