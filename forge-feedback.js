/*! Forge Feedback Widget — drop-in bug reporter. Writes to Firestore `bug-reports` via REST.
 * Usage: <script src="/forge-feedback.js" data-member="optional-member-id"></script>
 * No SDK, no build. Captures URL, userAgent, recent console errors automatically.
 */
(function () {
  'use strict';
  var PROJECT = 'up-level-guild';
  var API_KEY = 'AIzaSyAKxWv3FI7HrdrRlnJhsQbJ-97Pb_sdiOQ';
  var EP = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/bug-reports?key=' + API_KEY;

  // ---- capture recent console errors (ring buffer) ----
  var errBuf = [];
  function pushErr(s) { errBuf.push(String(s).slice(0, 500)); if (errBuf.length > 10) errBuf.shift(); }
  var _ce = console.error;
  console.error = function () { try { pushErr([].slice.call(arguments).join(' ')); } catch (e) {} return _ce.apply(console, arguments); };
  window.addEventListener('error', function (e) { pushErr((e.message || 'error') + ' @ ' + (e.filename || '') + ':' + (e.lineno || '')); });
  window.addEventListener('unhandledrejection', function (e) { pushErr('unhandledrejection: ' + (e.reason && (e.reason.message || e.reason))); });

  // ---- Firestore typed-value encoder ----
  function fv(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(fv) } };
    if (typeof v === 'object') { var f = {}; for (var k in v) f[k] = fv(v[k]); return { mapValue: { fields: f } }; }
    return { stringValue: String(v) };
  }
  function send(obj) {
    var fields = {}; for (var k in obj) fields[k] = fv(obj[k]);
    return fetch(EP, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: fields }) });
  }

  function memberId() {
    var s = document.currentScript || document.querySelector('script[src*="forge-feedback"]');
    if (s && s.getAttribute('data-member')) return s.getAttribute('data-member');
    try { return localStorage.getItem('ul_member_id') || localStorage.getItem('memberId') || null; } catch (e) { return null; }
  }

  // ---- UI ----
  var css = '.forge-fab{position:fixed;right:16px;bottom:16px;z-index:99999;background:#f97316;color:#fff;border:none;border-radius:999px;padding:10px 16px;font:600 14px system-ui,"Mitr",sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}.forge-ov{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center}.forge-card{background:#fff;color:#1f2937;width:min(92vw,420px);border-radius:16px;padding:20px;font-family:system-ui,"Mitr",sans-serif}.forge-card h3{margin:0 0 4px;font-size:17px}.forge-card p{margin:0 0 12px;font-size:13px;color:#6b7280}.forge-card textarea{width:100%;box-sizing:border-box;min-height:90px;border:1px solid #d1d5db;border-radius:10px;padding:10px;font:inherit;font-size:14px;resize:vertical}.forge-row{display:flex;gap:8px;margin-top:12px}.forge-row button{flex:1;border:none;border-radius:10px;padding:10px;font:600 14px system-ui;cursor:pointer}.forge-send{background:#f97316;color:#fff}.forge-cancel{background:#e5e7eb;color:#374151}.forge-ok{text-align:center;padding:8px 0;color:#059669;font-weight:600}';

  function mount() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var fab = document.createElement('button'); fab.className = 'forge-fab'; fab.textContent = '🐛 แจ้งปัญหา';
    var ov = document.createElement('div'); ov.className = 'forge-ov';
    ov.innerHTML = '<div class="forge-card"><h3>แจ้งปัญหา / บัค</h3><p>บอกเราว่าเจออะไร เดี๋ยวทีมแก้ให้</p><textarea placeholder="เช่น กดปุ่มสมัครแล้วไม่มีอะไรเกิดขึ้น..."></textarea><div class="forge-row"><button class="forge-cancel">ยกเลิก</button><button class="forge-send">ส่ง</button></div></div>';
    document.body.appendChild(fab); document.body.appendChild(ov);
    var ta = ov.querySelector('textarea');
    function open() { ov.style.display = 'flex'; ta.focus(); }
    function close() { ov.style.display = 'none'; }
    fab.onclick = open;
    ov.querySelector('.forge-cancel').onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };
    ov.querySelector('.forge-send').onclick = function () {
      var desc = ta.value.trim(); if (!desc) { ta.focus(); return; }
      var btn = this; btn.disabled = true; btn.textContent = 'กำลังส่ง...';
      send({
        description: desc, url: location.href, source: 'widget', status: 'new',
        userAgent: navigator.userAgent, consoleErrors: errBuf.slice(),
        memberId: memberId(), createdAt: new Date().toISOString(),
      }).then(function () {
        ov.querySelector('.forge-card').innerHTML = '<div class="forge-ok">✅ ส่งแล้ว ขอบคุณมาก!<br>ทีมจะรีบดูให้</div>';
        setTimeout(close, 1600);
      }).catch(function () { btn.disabled = false; btn.textContent = 'ลองอีกครั้ง'; });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
