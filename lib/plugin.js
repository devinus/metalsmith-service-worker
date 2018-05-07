const fs = require('fs');
const url = require('url');
const path = require('path');
const mime = require('mime-types');
const cheerio = require('cheerio');
const template = require('lodash.template');
const { Minimatch } = require('minimatch');

const { name: packageName } = require('../package');

const { URL } = url;

const workerTemplate = path.join(__dirname, 'templates', 'service-worker.js');
const buildWorker = template(fs.readFileSync(workerTemplate), {
  sourceURL: workerTemplate,
});

const registrationTemplate = path.join(__dirname, 'templates', 'service-worker-registration.js');
const buildRegistration = template(fs.readFileSync(registrationTemplate), {
  sourceURL: registrationTemplate,
});

const htmlExts = mime.extensions['text/html'].join(',');
const htmlMatcher = new Minimatch(`*.{${htmlExts}}`, { matchBase: true });
const htmlFilterer = htmlMatcher.match.bind(htmlMatcher);

function uriPath(value) {
  const { pathname } = new URL(path.normalize(value), 'file:');
  return String(pathname).split(/[/\\]/g).map(encodeURIComponent).join('/');
}

function plugin(options = {}) {
  const cacheName = options.cacheName || packageName;
  const workerFile = options.workerFile || 'service-worker.js';
  const registrationFile = options.registrationFile || 'service-worker-registration.js';
  const registrationSrc = JSON.stringify(uriPath(registrationFile));
  const registrationScript = `<script async defer src=${registrationSrc}>`;

  return function serviceWorker(files, metalsmith, done) {
    const fileKeys = Object.keys(files);
    const requestSet = new Set(fileKeys.map(uriPath));

    fileKeys.filter(htmlFilterer).forEach((key) => {
      const { dir, name } = path.parse(key);
      if (name === 'index') {
        requestSet.add(uriPath(dir));
      }

      const $ = cheerio.load(files[key].contents);
      const base = $('base').attr('href') || '/';

      $('body').append(registrationScript);
      $('link[rel="stylesheet"], script[src]').each((i, el) => {
        const attrName = el.tagName === 'link' ? 'href' : 'src';
        const value = $(el).attr(attrName);
        requestSet.add(url.resolve(base, value));
      });

      // eslint-disable-next-line no-param-reassign
      files[key].contents = $.html();
    });

    const worker = buildWorker({
      cacheName: JSON.stringify(cacheName),
      requests: JSON.stringify(Array.from(requestSet)),
    });

    const registration = buildRegistration({
      workerSrc: JSON.stringify(uriPath(workerFile)),
    });

    Object.assign(files, {
      [workerFile]: { contents: worker },
      [registrationFile]: { contents: registration },
    });

    return done();
  };
}

module.exports = plugin;
