(function () {
  'use strict';
  const mascot = document.getElementById('summonPet');
  const compactEntry = document.getElementById('compactPetEntry');
  const help = document.getElementById('desktopPetHelp');
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
  const desktopMac = /Mac/i.test(platform) && !(navigator.maxTouchPoints > 1);

  if (desktopMac) {
    // Keep the OS handoff inside the original click (also works with the Enter key).
    compactEntry.href = mascot.href;
    compactEntry.textContent = '唤回桌面看山';
    for (const button of document.querySelectorAll('[data-install-pet]')) {
      button.hidden = false;
      button.addEventListener('click', () => help.showModal());
    }
    return;
  }

  mascot.href = '#desktopPetHelp';
  mascot.setAttribute('aria-label', '查看桌面看山的使用方式');
  mascot.title = '查看桌面伙伴的使用方式';
  document.getElementById('summonPetHint').textContent = '了解桌面看山';
  mascot.addEventListener('click', (event) => {
    event.preventDefault();
    help.showModal();
  });
})();
