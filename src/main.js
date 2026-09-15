import bridge from '@vkontakte/vk-bridge';
import { createIcons, House, RotateCw, ExternalLink } from 'lucide';
import { WEBSITE_URL, isVkLaunch, getTheme } from './config.js';
import './style.css';

createIcons({ icons: { House, RotateCw, ExternalLink } });

const frame = document.querySelector('#website');
const loading = document.querySelector('#loading');
const notice = document.querySelector('#notice');
let loadTimer;
let bridgeProblem = '';

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = !message;
}

function loadWebsite() {
  clearTimeout(loadTimer);
  showNotice(navigator.onLine ? bridgeProblem : 'Нет подключения к интернету.');
  loading.hidden = false;
  // A new iframe context resets child navigation without accessing its cross-origin DOM.
  frame.removeAttribute('src');
  frame.src = WEBSITE_URL;
  loadTimer = setTimeout(() => {
    loading.hidden = true;
    showNotice('Сайт загружается дольше обычного. Можно обновить страницу или открыть его в браузере.');
  }, 15000);
}

frame.addEventListener('load', () => {
  clearTimeout(loadTimer);
  loading.hidden = true;
  // Cross-origin load does not prove that booking, login, or all content loaded.
});
frame.addEventListener('error', () => {
  clearTimeout(loadTimer);
  loading.hidden = true;
  showNotice('Не удалось загрузить сайт. Откройте GetTravel в браузере.');
});
document.querySelector('#home').addEventListener('click', loadWebsite);
document.querySelector('#reload').addEventListener('click', loadWebsite);
window.addEventListener('offline', () => showNotice('Нет подключения к интернету.'));
window.addEventListener('online', () => showNotice(bridgeProblem));

if (isVkLaunch(location.search, bridge.isWebView())) {
  const applyTheme = (scheme) => {
    const theme = getTheme(scheme);
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#202124' : '#ffffff';
  };
  applyTheme(new URLSearchParams(location.search).get('vk_scheme'));
  bridge.subscribe(({ detail }) => {
    if (detail?.type === 'VKWebAppUpdateConfig') applyTheme(detail.data.scheme);
  });
  const initTimeout = setTimeout(() => {
    bridgeProblem = 'Нет ответа от ВКонтакте. Сайт можно открыть в браузере.';
    showNotice(bridgeProblem);
  }, 10000);
  bridge.send('VKWebAppInit').then(() => {
    clearTimeout(initTimeout);
    bridgeProblem = '';
    showNotice(navigator.onLine ? '' : 'Нет подключения к интернету.');
  }).catch(() => {
    clearTimeout(initTimeout);
    bridgeProblem = 'Не удалось подключиться к ВКонтакте. Сайт можно открыть в браузере.';
    showNotice(bridgeProblem);
  });
}

loadWebsite();
