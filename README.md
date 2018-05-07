# metalsmith-service-worker

[![Build Status](https://travis-ci.org/devinus/metalsmith-service-worker.svg?branch=master)](https://travis-ci.org/devinus/metalsmith-service-worker)

A Metalsmith plugin to generate a service worker cache.

## Install

```sh-session
$ npm install metalsmith-service-worker --save
```

## Usage

```js
const serviceWorker = require('metalsmith-service-worker');
metalsmith.use(serviceWorker(options));
```

## Options

| Name               | Default                          |
|--------------------|----------------------------------|
| `cacheName`        | `metalsmith-service-worker`      |
| `workerFile`       | `service-worker.js`              |
| `registrationFile` | `service-worker-registration.js` |
