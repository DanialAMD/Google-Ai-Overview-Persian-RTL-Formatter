(() => {
  'use strict';

  const PERSIAN_ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const OVERVIEW_LABEL = /^(?:ai\s*overview|نمای\s*کلی(?:\s*هوش\s*مصنوعی)?|مرور\s*هوش\s*مصنوعی)$/i;
  const ROOT_MARK = 'data-gai-rtl-root';
  const TEXT_MARK = 'data-gai-rtl-text';
  const LIST_MARK = 'data-gai-rtl-list';
  const BLOCK_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, [role="heading"], blockquote, td, th, dd, dt, div';
  const SKIP_SELECTOR = 'script, style, noscript, svg, path, code, pre, textarea, input, button, [contenteditable="true"]';
  const TEXT_BLOCK_TAGS = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'DD', 'DT']);

  function visible(el) {
    if (!(el instanceof HTMLElement)) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
  }

  function directText(el) {
    let value = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) value += ` ${node.nodeValue || ''}`;
    }
    return value.trim();
  }

  function findOverviewRoots() {
    const candidates = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (!(node instanceof HTMLElement) || !visible(node)) return NodeFilter.FILTER_SKIP;
        if (node.children.length > 2 || node.textContent.trim().length > 100) return NodeFilter.FILTER_SKIP;
        const label = node.textContent.trim().replace(/\s+/g, ' ');
        return OVERVIEW_LABEL.test(label) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });

    while (walker.nextNode()) {
      const label = walker.currentNode.textContent.trim();
      if (OVERVIEW_LABEL.test(label)) candidates.push(walker.currentNode);
    }

    const roots = new Set();
    for (const label of candidates) {
      let node = label;
      let best = null;
      for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
        if (!(node instanceof HTMLElement)) break;
        const text = node.innerText || '';
        if (text.length > 180 && text.length < 18000 && node.querySelectorAll('p, li, h2, h3').length >= 1) {
          best = node;
          break;
        }
      }
      if (best) roots.add(best);
    }
    return [...roots];
  }

  function saveAndSetDir(el, dir) {
    if (!el.hasAttribute('data-gai-original-dir')) {
      el.setAttribute('data-gai-original-dir', el.getAttribute('dir') ?? '__none__');
    }
    el.setAttribute('dir', dir);
  }

  function markPersianBlocks(root) {
    if (!(root instanceof HTMLElement)) return;
    root.setAttribute(ROOT_MARK, '1');

    // Mark list wrappers too: otherwise bullets can remain on the left even when LI text is RTL.
    for (const list of root.querySelectorAll('ul, ol')) {
      if (list.querySelector('li') && PERSIAN_ARABIC.test(list.innerText || '')) {
        list.setAttribute(LIST_MARK, '1');
        saveAndSetDir(list, 'rtl');
      }
    }

    for (const el of root.querySelectorAll(BLOCK_SELECTOR)) {
      if (!(el instanceof HTMLElement) || el.closest(SKIP_SELECTOR)) continue;
      const text = TEXT_BLOCK_TAGS.has(el.tagName)
        ? (el.innerText || el.textContent || '')
        : (directText(el) || (el.children.length === 0 ? el.textContent : ''));
      if (!text || !PERSIAN_ARABIC.test(text)) continue;

      // Avoid marking wrapper DIVs that only contain other block elements.
      if (el.tagName === 'DIV' && !directText(el) && el.querySelector(BLOCK_SELECTOR)) continue;

      el.setAttribute(TEXT_MARK, '1');
      saveAndSetDir(el, 'rtl');
    }
  }

  function cleanOldMarks() {
    document.querySelectorAll(`[${ROOT_MARK}]`).forEach(el => el.removeAttribute(ROOT_MARK));
    document.querySelectorAll(`[${TEXT_MARK}], [${LIST_MARK}]`).forEach(el => {
      el.removeAttribute(TEXT_MARK);
      el.removeAttribute(LIST_MARK);
      const originalDir = el.getAttribute('data-gai-original-dir');
      if (originalDir !== null) {
        if (originalDir === '__none__') el.removeAttribute('dir');
        else el.setAttribute('dir', originalDir);
        el.removeAttribute('data-gai-original-dir');
      }
    });
  }

  let scheduled = false;
  function refresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      cleanOldMarks();
      for (const root of findOverviewRoots()) markPersianBlocks(root);
    });
  }

  const observer = new MutationObserver(() => refresh());
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  refresh();
})();
