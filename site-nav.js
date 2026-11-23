(() => {
  'use strict';
  const atlasHost = document.getElementById('atlasSiteNav');
  const shell = atlasHost || document.getElementById('siteNavShell');
  if (!shell) return;
  shell.id = 'siteNavShell';
  if (atlasHost) {
    const destinations = [
      ['./', '今日练习', 'Practice'], ['./?page=journey', '山间旅程', 'Journey'],
      ['./?page=wardrobe', '伙伴装扮', 'Wardrobe'], ['./?page=circle', '好友小圈', 'Friends'],
      ['meridians.html', '看山节律手记', 'Kanshan’s Rhythm Journal']
    ];
    const icons = ['i-home','i-journey','i-wardrobe','i-friends','i-book'];
    const links = destinations.map(([href, zh, en], index) =>
      '<a class="nav" href="' + href + '" data-zh="' + zh + '" data-en="' + en + '"><svg class="icon" aria-hidden="true"><use href="site-nav-icons.svg#' + icons[index] + '"/></svg><span>' + zh + '</span></a>'
    ).join('');
    shell.innerHTML = '<aside id="siteDrawer" class="sidebar"><a class="brand" href="./">气脉陪练</a><nav aria-label="主导航">' + links + '</nav></aside>';
    if (location.pathname.endsWith('/meridians.html')) {
      const current = shell.querySelector('[href="meridians.html"]');
      current.setAttribute('aria-current','page');
      current.classList.add('active');
    }
  }

  const drawer = shell.querySelector('#siteDrawer');
  const trigger = document.createElement('button');
  trigger.id = 'navEdge';
  trigger.type = 'button';
  trigger.setAttribute('aria-controls','siteDrawer');
  shell.prepend(trigger);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-dismiss';
  close.textContent = '×';
  drawer.prepend(close);

  function labelControls() {
    const english = document.documentElement.lang.startsWith('en');
    trigger.setAttribute('aria-label',english ? 'Open navigation' : '展开主导航');
    close.setAttribute('aria-label',english ? 'Close navigation' : '收起主导航');
    if (atlasHost) {
      for (const item of drawer.querySelectorAll('[data-en]')) item.querySelector('span').textContent = english ? item.dataset.en : item.dataset.zh;
    }
  }
  labelControls();
  if (atlasHost) new MutationObserver(labelControls).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  const active = drawer.querySelector('.nav.active');
  active?.setAttribute('aria-current','page');
  let open = false;
  let closeTimer;
  let keyboardInside = false;
  let mouseAtEdge = false;
  let waitForMouseExit = false;
  function setOpen(value) {
    clearTimeout(closeTimer);
    open = value && !shell.inert;
    if (!open) keyboardInside = false;
    shell.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    drawer.inert = !open;
  }
  function dismiss(restoreFocus) {
    waitForMouseExit = mouseAtEdge;
    if (restoreFocus && drawer.contains(document.activeElement)) trigger.focus({preventScroll:true});
    setOpen(false);
  }
  setOpen(false);
  // Listen across the page so the larger approach zone doesn't cover buttons or links.
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const edge = Math.min(52, Math.max(24, window.innerWidth * .045));
    mouseAtEdge = event.clientX <= edge;
    if (!mouseAtEdge) {
      waitForMouseExit = false;
    } else if (!open && !waitForMouseExit && !event.buttons && !shell.inert && !document.querySelector('dialog[open]')) {
      setOpen(true);
    }
  }, {passive:true});
  shell.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || event.buttons) return;
    clearTimeout(closeTimer);
    if (!waitForMouseExit && !document.querySelector('dialog[open]')) setOpen(true);
  });
  shell.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && open && !keyboardInside) {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => setOpen(false), 420);
    }
  });
  shell.addEventListener('keydown', () => {
    clearTimeout(closeTimer);
    keyboardInside = true;
  });
  shell.addEventListener('pointerdown', () => { keyboardInside = false; });
  trigger.addEventListener('click', event => {
    keyboardInside = event.detail === 0;
    setOpen(true);
    (drawer.querySelector('[aria-current="page"]') || drawer.querySelector('.nav')).focus({preventScroll:true});
  });
  close.addEventListener('click', () => dismiss(true));
  drawer.addEventListener('click', event => {
    if (event.target.closest('.nav, .brand')) {
      const wasKeyboard = event.detail === 0;
      dismiss(wasKeyboard);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (open && !shell.contains(event.target)) dismiss(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      dismiss(true);
    }
  });
  shell.addEventListener('focusout', event => {
    if (event.relatedTarget && !shell.contains(event.relatedTarget)) dismiss(false);
  });
  new MutationObserver(() => { if (shell.inert) setOpen(false); }).observe(shell,{attributes:true,attributeFilter:['inert']});
  window.addEventListener('pageshow', () => { waitForMouseExit = false; setOpen(false); });
})();
