(function () {
  'use strict';

  const mascot = document.getElementById('summonPet');
  const compactEntry = document.getElementById('compactPetEntry');
  const help = document.getElementById('desktopPetHelp');
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
  const ua = navigator.userAgent;
  const desktopMac = /Mac/i.test(platform) && !(navigator.maxTouchPoints > 1);
  const desktopWindows = /Win/i.test(platform) && !/Windows Phone|IEMobile/i.test(ua);
  const system = desktopMac ? 'mac' : desktopWindows ? 'windows' : '';

  function openInstall() {
    if (!help.open) help.showModal();
  }

  for (const button of document.querySelectorAll('[data-install-pet]')) {
    button.hidden = false;
    button.addEventListener('click', openInstall);
  }

  if (system) {
    // Keep OS protocol navigation in the original click or keyboard event.
    compactEntry.href = mascot.href;
    compactEntry.textContent = '唤回桌面看山';
    const preferred = help.querySelector('[data-system="' + system + '"]');
    preferred.parentElement.prepend(preferred);
    preferred.classList.add('pet-download-preferred');
    preferred.querySelector('a').classList.add('primary');
    help.querySelector('[data-wake-pet]').hidden = false;
  }

  if (!desktopMac) {
    mascot.href = '#desktopPetHelp';
    mascot.setAttribute('aria-label', '查看看山桌宠下载与使用方式');
    mascot.setAttribute('aria-haspopup', 'dialog');
    mascot.title = '下载看山桌宠';
    document.getElementById('summonPetHint').textContent = desktopWindows ? '点我，下载 Windows 桌宠' : '了解桌面看山';
    mascot.addEventListener('click', (event) => {
      event.preventDefault();
      openInstall();
    });
  }

  const entry = new URL(location.href);
  if (entry.searchParams.get('desktop') === '1' && !entry.searchParams.has('practice')) {
    openInstall();
    help.addEventListener('close', () => {
      const current = new URL(location.href);
      current.searchParams.delete('desktop');
      history.replaceState(history.state, '', current);
    }, {once: true});
  }
})();
