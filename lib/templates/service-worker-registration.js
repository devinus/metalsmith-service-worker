(function(window) {
  'use strict';

  if ('serviceWorker' in window.navigator) {
    window.addEventListener('load', function () {
      window.navigator.serviceWorker.register(${workerSrc});
    });
  }
})(window);
