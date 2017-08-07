const url = require('url');
const path = require('path');
const mime = require('mime-types');
const cheerio = require('cheerio');
const { Minimatch } = require('minimatch');

const { name: packageName } = require('../package.json');

const { URL } = url;

const htmlExts = mime.extensions['text/html'].join(',');
const htmlMatcher = new Minimatch(`*.{${htmlExts}}`, { matchBase: true });
const htmlFilterer = htmlMatcher.match.bind(htmlMatcher);

function getPathname(value) {
  const { pathname } = new URL(value, 'file:');
  return pathname;
}

function buildWorker(cacheName, requests) {
  return Buffer.from(`\'use strict';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(${JSON.stringify(cacheName)}).then((cache) => {
      return cache.addAll(${JSON.stringify(requests)});
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
`);
}

function buildSnippet(fileName) {
  return `<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register(${JSON.stringify(fileName)});
  });
}
</script>`;
}

function plugin(options = {}) {
  const cacheName = options.cacheName || packageName;
  const fileName = options.fileName || 'service-worker.js';
  const snippet = buildSnippet(getPathname(fileName));

  return function serviceWorker(files) {
    const fileKeys = Object.keys(files);
    const requestSet = new Set(fileKeys.concat(fileName).map(getPathname));

    fileKeys.filter(htmlFilterer).forEach((key) => {
      const { dir, name } = path.parse(key);
      if (name === 'index') {
        requestSet.add(getPathname(dir));
      }

      const $ = cheerio.load(files[key].contents);
      const base = $('base').attr('href') || '/';

      $('link[rel="stylesheet"], script[src]').each((i, el) => {
        const attrName = el.tagName === 'link' ? 'href' : 'src';
        const value = $(el).attr(attrName);
        requestSet.add(url.resolve(base, value));
      });

      $('body').append(snippet);

      // eslint-disable-next-line no-param-reassign
      files[key].contents = Buffer.from($.html());
    });

    const contents = buildWorker(cacheName, Array.from(requestSet));

    // eslint-disable-next-line no-param-reassign
    files[fileName] = { contents };
  };
}

module.exports = plugin;
