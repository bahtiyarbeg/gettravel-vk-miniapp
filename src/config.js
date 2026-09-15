export const WEBSITE_URL = 'https://gettravel.asia/';

export function isVkLaunch(search, webView = false) {
  const params = new URLSearchParams(search);
  return webView || (params.has('vk_app_id') && params.has('vk_platform'));
}

export function getTheme(scheme, appearance) {
  if (appearance === 'dark' || appearance === 'light') return appearance;
  return scheme === 'space_gray' || scheme === 'vkcom_dark' ? 'dark' : 'light';
}

export function getNotice(online, bridgeProblem, siteProblem) {
  return online ? (siteProblem || bridgeProblem) : 'Нет подключения к интернету.';
}

export function safeInset(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(value, 200) : 0;
}
