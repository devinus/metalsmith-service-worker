const cheerio = require('cheerio');

const serviceWorker = require('../');
const { name: packageName } = require('../package');

describe(packageName, () => {
  const plugin = serviceWorker();
  let files;

  beforeEach((done) => {
    files = {
      'robots.txt': { contents: Buffer.from('User-agent: *\nDisallow:') },
      'index.html': { contents: Buffer.from('<html><head><link rel="stylesheet" href="http://example.com/style.css"><script src="http://example.com/script.js"></script></head><body></body></html>') },
    };
    plugin(files, {}, done);
  });

  it('adds service worker file', () => {
    expect(files['service-worker.js']).toBeDefined();
  });

  it('adds service worker registration file', () => {
    expect(files['service-worker-registration.js']).toBeDefined();
  });

  it('adds local files to service worker cache', () => {
    const contents = String(files['service-worker.js'].contents);
    expect(contents).toContain('/robots.txt');
    expect(contents).toContain('/index.html');
  });

  it('adds external stylesheets and scripts to service worker cache', () => {
    const contents = String(files['service-worker.js'].contents);
    expect(contents).toContain('http://example.com/style.css');
    expect(contents).toContain('http://example.com/script.js');
  });

  it('injects service worker registration into *.html files', () => {
    const $ = cheerio.load(files['index.html'].contents);
    expect($('body > script').length).toEqual(1);
  });
});
