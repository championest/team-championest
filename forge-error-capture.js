/*! Forge Auto Error Capture — silent. Reports uncaught errors to Firestore `error-events`.
 * Drop-in: <script src="/forge-error-capture.js"></script>. Throttles same error to 1×/session.
 * A server step (promote.mjs) groups by signature and promotes recurring errors to bug-reports.
 */
(function () {
  'use strict';
  var PROJECT = 'up-level-guild';
  var API_KEY = 'AIzaSyAKxWv3FI7HrdrRlnJhsQbJ-97Pb_sdiOQ';
  var EP = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/error-events?key=' + API_KEY;

  function fv(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(fv) } };
    if (typeof v === 'object') { var f = {}; for (var k in v) f[k] = fv(v[k]); return { mapValue: { fields: f } }; }
    return { stringValue: String(v) };
  }
  function sig(msg, src, ln) {
    var s = (msg || '') + '|' + (src || '').split('/').pop() + '|' + (ln || '');
    var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return 'e' + Math.abs(h).toString(36);
  }
  function seen(sg) {
    try { var k = 'forge_err_' + sg; if (sessionStorage.getItem(k)) return true; sessionStorage.setItem(k, '1'); return false; } catch (e) { return false; }
  }
  function report(message, source, line, stack) {
    var sg = sig(message, source, line);
    if (seen(sg)) return; // 1×/session/signature — server aggregates the rest
    var fields = {};
    var obj = { signature: sg, message: String(message).slice(0, 500), source: String(source || '').slice(0, 300),
      line: line || 0, stack: String(stack || '').slice(0, 1500), url: location.href,
      userAgent: navigator.userAgent, status: 'new', createdAt: new Date().toISOString() };
    for (var k in obj) fields[k] = fv(obj[k]);
    try { fetch(EP, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: fields }), keepalive: true }); } catch (e) {}
  }
  window.addEventListener('error', function (e) {
    if (e && e.error) report(e.message, e.filename, e.lineno, e.error.stack);
    else if (e) report(e.message, e.filename, e.lineno, '');
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason; report('unhandledrejection: ' + (r && (r.message || r)), location.pathname, 0, r && r.stack);
  });
})();
