// News page: year filter, "Read more" on long stories, photo lightbox, and
// highlighting the story a link points to (e.g. /news#story-title from the home page).
(function () {
  'use strict';

  var page = document.querySelector('.news-page');
  if (!page) return;

  // ---- Filters: year chips + topic (tag), combined ----
  var chips = page.querySelectorAll('.news-chip');
  var topic = page.querySelector('.news-topic-select');
  var featured = page.querySelector('.news-featured');
  var years = page.querySelectorAll('.news-year');
  var cards = page.querySelectorAll('.news-card');
  var empty = page.querySelector('.news-empty');
  var status = page.querySelector('.news-filter-status');
  var statusText = page.querySelector('.news-filter-status-text');
  var state = { year: 'all', tag: '' };

  function render() {
    var shown = 0;
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === state.year;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (topic) topic.value = state.tag;
    cards.forEach(function (card) {
      var tags = (card.getAttribute('data-tags') || '').split('|');
      var ok = (state.year === 'all' || card.getAttribute('data-year') === state.year) &&
               (!state.tag || tags.indexOf(state.tag) !== -1);
      card.hidden = !ok;
      card.querySelectorAll('.news-tag').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-tag') === state.tag);
      });
      if (ok) shown++;
    });
    // Hide a year section (or the Latest block) when none of its cards match.
    if (featured) featured.hidden = !featured.querySelector('.news-card:not([hidden])');
    years.forEach(function (s) { s.hidden = !s.querySelector('.news-card:not([hidden])'); });
    if (empty) empty.hidden = shown > 0;
    var filtered = state.year !== 'all' || state.tag;
    status.hidden = !filtered;
    if (filtered) {
      statusText.textContent = 'Showing ' + shown + (shown === 1 ? ' story' : ' stories') +
        (state.tag ? ' tagged “' + state.tag + '”' : '') +
        (state.year !== 'all' ? ' from ' + state.year : '');
    }
  }

  function setFilter(year, tag) {
    state.year = year;
    state.tag = tag;
    render();
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () { setFilter(c.getAttribute('data-filter'), state.tag); });
  });
  if (topic) topic.addEventListener('change', function () { setFilter(state.year, topic.value); });
  page.querySelector('.news-filter-clear').addEventListener('click', function () { setFilter('all', ''); });
  page.addEventListener('click', function (e) {
    var tagBtn = e.target.closest('.news-tag');
    if (!tagBtn) return;
    var t = tagBtn.getAttribute('data-tag');
    setFilter(state.year, state.tag === t ? '' : t);  // clicking the active tag again clears it
    page.querySelector('.news-filter').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ---- Read more: only on stories whose text is taller than the clamp ----
  page.querySelectorAll('.news-card').forEach(function (card) {
    var text = card.querySelector('.news-card-text');
    var btn = card.querySelector('.news-read-more');
    if (!text || !btn) return;
    if (text.scrollHeight > text.clientHeight + 4) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        var open = card.classList.toggle('is-expanded');
        btn.firstChild.nodeValue = open ? 'Show less ' : 'Read more ';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  });

  // ---- Lightbox ----
  var box = document.getElementById('newsLightbox');
  var boxImg = box.querySelector('.news-lightbox-img');
  var boxTitle = box.querySelector('.news-lightbox-title');
  var boxCount = box.querySelector('.news-lightbox-count');
  var prevBtn = box.querySelector('.news-lightbox-prev');
  var nextBtn = box.querySelector('.news-lightbox-next');
  var items = [];
  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + items.length) % items.length;
    var link = items[index];
    boxImg.src = link.href;
    boxImg.alt = link.querySelector('img') ? link.querySelector('img').alt : '';
    boxTitle.textContent = link.getAttribute('data-title') || '';
    boxCount.textContent = items.length > 1 ? (index + 1) + ' / ' + items.length : '';
    prevBtn.hidden = nextBtn.hidden = items.length < 2;
  }

  function open(link) {
    items = Array.prototype.slice.call(
      page.querySelectorAll('.news-photo[data-gallery="' + link.getAttribute('data-gallery') + '"]')
    );
    lastFocus = document.activeElement;
    show(items.indexOf(link));
    box.hidden = false;
    document.body.classList.add('news-lightbox-open');
    box.querySelector('.news-lightbox-close').focus();
  }

  function close() {
    box.hidden = true;
    boxImg.src = '';
    document.body.classList.remove('news-lightbox-open');
    if (lastFocus) lastFocus.focus();
  }

  page.addEventListener('click', function (e) {
    var link = e.target.closest('.news-photo');
    if (!link) return;
    e.preventDefault();
    open(link);
  });
  prevBtn.addEventListener('click', function () { show(index - 1); });
  nextBtn.addEventListener('click', function () { show(index + 1); });
  box.querySelector('.news-lightbox-close').addEventListener('click', close);
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // ---- Linked story: scroll to it and highlight it ----
  function highlightFromHash() {
    if (!location.hash) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target || !target.classList.contains('news-card')) return;
    setFilter('all', '');
    target.classList.add('is-expanded', 'is-highlighted');
    target.scrollIntoView({ block: 'start' });
    setTimeout(function () { target.classList.remove('is-highlighted'); }, 2500);
  }
  highlightFromHash();
  window.addEventListener('hashchange', highlightFromHash);
})();
