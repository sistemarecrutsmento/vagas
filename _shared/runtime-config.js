/* VagasIO runtime configuration. Set VAGASIO_ENV='staging' on the staging deployment. */
(function () {
  var env = window.VAGASIO_ENV || (window.location.hostname.indexOf('staging') >= 0 ? 'staging' : 'production');
  var apis = {
    staging: 'https://vagasio-api-staging.onrender.com',
    production: 'https://recrutamento-api-novo.onrender.com'
  };
  window.VAGASIO_API_BASE = apis[env] || apis.production;
  window.VAGASIO_RUNTIME_ENV = env;

  // Defesa central para os templates legados: mantém a marcação visual e os
  // onclicks internos existentes, mas remove vetores de XSS vindos da API.
  var proto = window.Element && Element.prototype;
  if (proto && !proto.__vagasioSafeHtml) {
    var descriptor = Object.getOwnPropertyDescriptor(proto, 'innerHTML');
    var originalInsert = proto.insertAdjacentHTML;
    function clean(value) {
      var t = document.createElement('template');
      descriptor.set.call(t, String(value == null ? '' : value));
      t.content.querySelectorAll('script,iframe,object,embed,link,meta,base').forEach(function (n) { n.remove(); });
      t.content.querySelectorAll('*').forEach(function (n) {
        Array.from(n.attributes).forEach(function (a) {
          if (/^on(?!click$)/i.test(a.name) || /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
        });
      });
      return descriptor.get.call(t);
    }
    Object.defineProperty(proto, 'innerHTML', {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set: function (value) { descriptor.set.call(this, clean(value)); }
    });
    proto.insertAdjacentHTML = function (position, value) {
      return originalInsert.call(this, position, clean(value));
    };
    proto.__vagasioSafeHtml = true;
  }
}());
