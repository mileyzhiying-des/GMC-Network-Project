// Development only (injected by vite.config.js, never part of the build).
// The prototype keeps its current page in memory, so every auto-reload after an
// edit would jump back to the landing page. This remembers the current page and,
// after a reload, reopens the nearest sidebar section (e.g. case detail -> 案件管理).
(function () {
  var KEY = 'gmc-dev-current-page';
  var original = window.showPage;
  if (typeof original !== 'function') return;

  window.showPage = function (id) {
    original.apply(this, arguments);
    try {
      sessionStorage.setItem(KEY, id);
    } catch (e) {}
  };

  var saved = null;
  try {
    saved = sessionStorage.getItem(KEY);
  } catch (e) {}
  if (!saved || saved === 'main') return;

  var el = document.getElementById(saved);
  var section = el && el.dataset.page;
  var target = section && (window.IN_NAV || []).find(function (item) {
    return item.key === section && item.id;
  });
  if (target) window.nav(target.id);
})();
