import bridge from '@vkontakte/vk-bridge';
import { createIcons, House, RotateCw, ExternalLink } from 'lucide';
import { WEBSITE_URL, isVkLaunch, getTheme, getNotice, safeInset } from './config.js';
import './style.css';

createIcons({ icons: { House, RotateCw, ExternalLink } });

let frame = document.querySelector('#website');
const loading = document.querySelector('#loading');
const notice = document.querySelector('#notice');
let loadTimer;
let initTimeout;
let bridgeProblem = '';
let siteProblem = '';
let unsubscribe = () => {};

function renderNotice() {
  const message = getNotice(navigator.onLine, bridgeProblem, siteProblem);
  notice.textContent = message;
  notice.hidden = !message;
}

function loadWebsite() {
  clearTimeout(loadTimer);
  siteProblem = '';
  renderNotice();
  loading.hidden = false;
  // Replace the browsing context so stale loads and child history cannot survive a reset.
  const nextFrame = frame.cloneNode(false);
  nextFrame.addEventListener('load', () => {
    if (frame !== nextFrame) return;
    clearTimeout(loadTimer);
    loading.hidden = true;
    siteProblem = '';
    renderNotice();
    // A cross-origin load event cannot prove that login or booking is working.
  });
  nextFrame.addEventListener('error', () => {
    if (frame !== nextFrame) return;
    clearTimeout(loadTimer);
    loading.hidden = true;
    siteProblem = 'Не удалось загрузить сайт. Откройте GetTravel в браузере.';
    renderNotice();
  });
  loadTimer = setTimeout(() => {
    loading.hidden = true;
    siteProblem = 'Сайт загружается дольше обычного. Можно обновить страницу или открыть его в браузере.';
    renderNotice();
  }, 15000);
  nextFrame.src = WEBSITE_URL;
  const previousFrame = frame;
  frame = nextFrame;
  previousFrame.replaceWith(nextFrame);
}

const home = document.querySelector('#home');
const reload = document.querySelector('#reload');
home.addEventListener('click', loadWebsite);
reload.addEventListener('click', loadWebsite);
window.addEventListener('offline', renderNotice);
window.addEventListener('online', renderNotice);

if (isVkLaunch(location.search, bridge.isWebView())) {
  const applyConfig = (data = {}) => {
    if (data.scheme || data.appearance) {
      const theme = getTheme(data.scheme, data.appearance);
      document.documentElement.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#202124' : '#ffffff';
    }
    if (data.insets) {
      for (const edge of ['top', 'right', 'bottom', 'left']) {
        document.documentElement.style.setProperty('--vk-inset-' + edge, safeInset(data.insets[edge]) + 'px');
      }
    }
  };
  applyConfig({ scheme: new URLSearchParams(location.search).get('vk_scheme') });
  const onConfig = ({ detail } = {}) => {
    if (detail?.type === 'VKWebAppUpdateConfig' || detail?.type === 'VKWebAppUpdateInsets') {
      applyConfig(detail.data);
    }
  };
  bridge.subscribe(onConfig);
  unsubscribe = () => bridge.unsubscribe(onConfig);
  initTimeout = setTimeout(() => {
    bridgeProblem = 'Нет ответа от ВКонтакте. Сайт можно открыть в браузере.';
    renderNotice();
  }, 10000);
  bridge.send('VKWebAppInit').then(() => {
    clearTimeout(initTimeout);
    bridgeProblem = '';
    renderNotice();
  }).catch(() => {
    clearTimeout(initTimeout);
    bridgeProblem = 'Не удалось подключиться к ВКонтакте. Сайт можно открыть в браузере.';
    renderNotice();
  });
}

loadWebsite();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearTimeout(loadTimer);
    clearTimeout(initTimeout);
    unsubscribe();
    home.removeEventListener('click', loadWebsite);
    reload.removeEventListener('click', loadWebsite);
    window.removeEventListener('offline', renderNotice);
    window.removeEventListener('online', renderNotice);
  });
}
