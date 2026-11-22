'use strict';

const { contextBridge, ipcRenderer } = require('electron');

if (process.isMainFrame && location.href === 'https://kanshan.invalid/pet.html') {
  let likesURL = '';
  try { likesURL = localStorage.getItem('qimai_zhihu_likes') || ''; } catch {}
  contextBridge.exposeInMainWorld('QimaiZhihuLikesURL', likesURL);
  // Reuse the companion's existing host messaging protocol on both platforms.
  contextBridge.exposeInMainWorld('webkit', {
    messageHandlers: {
      pet: {
        postMessage(message) {
          if (!message || typeof message !== 'object') return;
          if (message.action === 'zhihu' && message.destination === 'likes') {
            let url = '';
            try { url = localStorage.getItem('qimai_zhihu_likes') || ''; } catch {}
            ipcRenderer.send('pet-action', {action: 'zhihu', destination: 'likes', url});
          } else if (['layout','position','move','close','practice','zhihu'].includes(message.action)) {
            ipcRenderer.send('pet-action', message);
          }
        }
      }
    }
  });
}
