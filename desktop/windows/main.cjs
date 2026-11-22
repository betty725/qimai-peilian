'use strict';

const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, screen, session, shell, Tray } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const origin = 'https://kanshan.invalid';
const petPage = origin + '/pet.html';
const practicePage = 'https://betty725.github.io/qimai-peilian/';
const views = {pet:[196,252], card:[326,550], orb:[104,118], portal:[326,398]};
const external = {
  home:'https://www.zhihu.com/', collections:'https://www.zhihu.com/collections', news:'https://www.zhihu.com/hot'
};
const mime = {
  '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript',
  '.png':'image/png', '.gif':'image/gif', '.webp':'image/webp', '.wasm':'application/wasm', '.task':'application/octet-stream'
};
const site = app.isPackaged ? path.join(process.resourcesPath,'site') : path.resolve(__dirname,'../..');
const schemeArgument = args => args.find(value => /^qimai-kanshan-v48:/i.test(value));
const acceptsLaunch = args => !schemeArgument(args) || /^qimai-kanshan-v48:\/\/show\/?$/i.test(schemeArgument(args));
const reportArg = !schemeArgument(process.argv) && process.argv.find(value => value.startsWith('--smoke-test='));
const report = reportArg && reportArg.slice('--smoke-test='.length);
let pet, tray, view = 'pet', ready = false, cameraGranted = false;
let smokeLink = '';

if (report) {
  if (!path.isAbsolute(report)) app.exit(2);
  app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'kanshan-smoke-')));
}
app.setName('看山桌面伙伴');
app.setAppUserModelId('org.qimai.kanshan');

function place(next, {reset = false, dx = 0, dy = 0} = {}) {
  if (!pet || pet.isDestroyed() || !Object.hasOwn(views,next)) return;
  const old = pet.getBounds();
  const area = (reset ? screen.getPrimaryDisplay() : screen.getDisplayMatching(old)).workArea;
  const width = Math.min(views[next][0],area.width), height = Math.min(views[next][1],area.height);
  const left = reset ? area.x + 20 : old.x + dx;
  const top = reset ? area.y + area.height - height - 20 : old.y + old.height - height + dy;
  pet.setBounds({x:Math.round(Math.max(area.x,Math.min(left,area.x+area.width-width))),
    y:Math.round(Math.max(area.y,Math.min(top,area.y+area.height-height))), width,height});
  view = next;
}

function runUI(expression) {
  if (ready && !pet.isDestroyed()) {
    void pet.webContents.executeJavaScript(expression).catch(() => {});
  }
}
function summon() {
  if (!ready) return;
  if (pet.isMinimized()) pet.restore();
  place('pet',{reset:true});
  runUI('window.QimaiPetUI.setExpanded(false)');
  pet.showInactive();
}
function openURL(url) {
  if (!url) return;
  if (report) { smokeLink = url; return; }
  shell.openExternal(url).catch(() => dialog.showErrorBox('打开浏览器失败','请检查 Windows 的默认浏览器设置。'));
}
function likesURL(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const u = new URL(value);
    if (u.protocol === 'https:' && ['zhihu.com','www.zhihu.com'].includes(u.hostname) &&
        !u.port && !u.username && !u.password) return u.href;
  } catch {}
  return null;
}

function serveLocalFiles(ses) {
  // This HTTPS origin lives entirely inside this Electron session. No server,
  // loopback listener, certificate override or remote page receives pet IPC.
  ses.protocol.handle('https', async request => {
    const url = new URL(request.url);
    if (url.origin !== origin || !['GET','HEAD'].includes(request.method)) return new Response(null,{status:403});
    let parts;
    try { parts = decodeURIComponent(url.pathname).slice(1).split('/'); } catch { return new Response(null,{status:400}); }
    if (!parts.every(p => p && p !== '.' && p !== '..' && !/[\\:\x00-\x1f]/.test(p))) return new Response(null,{status:404});
    const file = path.join(site,...parts);
    const type = mime[path.extname(file)];
    if (!type) return new Response(null,{status:404});
    try {
      const bytes = await fs.promises.readFile(file);
      return new Response(request.method === 'HEAD' ? null : bytes,{headers:{
        'Content-Type':type, 'X-Content-Type-Options':'nosniff',
        'Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'"
      }});
    } catch { return new Response(null,{status:404}); }
  });
}

function permissions(ses) {
  const own = contents => !!pet && !pet.isDestroyed() && contents === pet.webContents && contents.getURL() === petPage;
  ses.setPermissionCheckHandler((contents,permission,requestOrigin,details) =>
    own(contents) && permission === 'media' && requestOrigin.replace(/\/$/,'') === origin &&
      details.mediaType === 'video' && cameraGranted);
  ses.setPermissionRequestHandler(async (contents,permission,reply,details) => {
    if (!own(contents) || !details.isMainFrame || permission !== 'media' ||
        details.requestingUrl !== petPage || details.mediaTypes?.length !== 1 || details.mediaTypes[0] !== 'video') {
      reply(false); return;
    }
    if (!cameraGranted && !report) {
      try {
        const result = await dialog.showMessageBox(pet,{type:'question',title:'摄像头观察',
          message:'允许看山使用摄像头观察桌前状态吗？', detail:'本次陪伴仅在本机分析画面，可以随时在陪伴卡片里关闭。',buttons:['允许本次使用','暂不开启'],defaultId:1,cancelId:1});
        cameraGranted = result.response === 0 && own(contents);
      } catch {}
    }
    reply(cameraGranted);
  });
}

function bindActions() {
  ipcMain.on('pet-action',(event,msg) => {
    if (!pet || pet.isDestroyed() || event.sender !== pet.webContents ||
        event.senderFrame !== pet.webContents.mainFrame || event.senderFrame.url !== petPage || !msg) return;
    switch (msg.action) {
      case 'layout': place(msg.view); break;
      case 'move':
        if ([msg.dx,msg.dy].every(n => Number.isFinite(n) && Math.abs(n) < 1000)) place(view,{dx:msg.dx,dy:msg.dy});
        break;
      case 'position': place(view,{reset:true}); break;
      case 'close': app.quit(); break;
      case 'practice': openURL(practicePage); break;
      case 'zhihu':
        if (msg.destination === 'likes') openURL(likesURL(msg.url));
        else if (Object.hasOwn(external,msg.destination)) openURL(external[msg.destination]);
        break;
    }
  });
}

async function start() {
  const ses = session.defaultSession;
  serveLocalFiles(ses);
  permissions(ses);
  pet = new BrowserWindow({width:196,height:252,frame:false,transparent:true,backgroundColor:'#00000000',
    alwaysOnTop:true,resizable:false,skipTaskbar:true,hasShadow:false,maximizable:false,fullscreenable:false,
    show:false, title:'看山桌面伙伴',
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,
      nodeIntegration:false,backgroundThrottling:false,devTools:false,session:ses}});
  pet.setMenu(null);
  pet.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  pet.webContents.on('will-navigate',(event,target) => { if (target !== petPage) event.preventDefault(); });
  pet.webContents.on('will-attach-webview',event => event.preventDefault());
  bindActions();
  const icon = nativeImage.createFromPath(path.join(site,'assets','pet-quiet','stand.png')).resize({width:32,height:32});
  tray = new Tray(icon);
  tray.setToolTip('看山桌面伙伴');
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:'显示刘看山',click:summon},
    {label:'展开陪伴卡片',click:() => {pet.show();runUI('window.QimaiPetUI.setExpanded(true)');}},
    {label:'知乎快捷球',click:() => {pet.show();runUI('window.QimaiPetUI.showOrb()');}},
    {label:'打开气脉陪练',click:() => runUI('window.QimaiPetUI.openMain()')},
    {type:'separator'},{label:'退出陪伴',click:() => app.quit()}
  ]));
  tray.on('click',summon);
  await pet.loadURL(petPage);
  await pet.webContents.insertCSS('header .brand,#drag,.zhihu-top>div{-webkit-app-region:drag} body{scrollbar-width:thin}');
  ready = true;
  summon();
  screen.on('display-metrics-changed',() => place(view));
  screen.on('display-removed',() => place(view,{reset:true}));
  if (report) await smoke();
}

async function smoke() {
  const checks = {};
  const page = expression => pet.webContents.executeJavaScript(expression);
  const delay = ms => new Promise(done => setTimeout(done,ms));
  async function waitView(target) {
    for (let i=0; i<60 && view!==target; i++) await delay(50);
    return view===target && pet.getBounds().width===views[target][0];
  }
  checks.visible = pet.isVisible() && pet.isAlwaysOnTop() && !pet.isResizable();
  checks.localPage = pet.webContents.getURL() === petPage && await page("isSecureContext && !!navigator.mediaDevices?.getUserMedia && !window.require && !!window.QimaiPetUI && document.querySelector('#mascot').naturalWidth>0");
  await page("document.querySelector('#scene').click()");
  checks.singleClickCard = await waitView('card');
  await page("document.querySelector('#scene').click(); document.querySelector('#scene').click()");
  for (let i=0; !smokeLink && i<40; i++) await delay(50);
  checks.doubleClickPractice = smokeLink === practicePage;
  await page("for(let i=0;i<3;i++) document.querySelector('#scene').click()");
  checks.tripleClickOrb = await waitView('orb');
  await page("document.querySelector('#zhihuBall').click()");
  checks.zhihuPortal = await waitView('portal');
  await page("document.querySelector('#zhihuReturn').click()");
  checks.collapse = await waitView('pet');
  checks.localEngine = await page(`(async()=>{
    const detector = await QimaiTracker.create();
    try { const frame=document.createElement('canvas'); frame.width=640;frame.height=480;
      const result=await detector.detectForVideo(frame, performance.now()); return Array.isArray(result.landmarks); }
    finally {detector.close();}
  })()`);
  checks.noCamera = !cameraGranted && await page("document.querySelector('video').srcObject===null");
  const ok = Object.values(checks).every(Boolean);
  fs.writeFileSync(report,JSON.stringify({ok,checks},null,2));
  app.exit(ok ? 0 : 1);
}

if (!acceptsLaunch(process.argv) || !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance',(_event,args) => { if (acceptsLaunch(args)) summon(); });
  app.on('window-all-closed',() => app.quit());
  app.whenReady().then(start).catch(error => {
    if (report) fs.writeFileSync(report,JSON.stringify({ok:false,error:String(error.stack || error)}));
    else dialog.showErrorBox('看山桌面伙伴未能启动',String(error.message || error));
    app.exit(1);
  });
}
