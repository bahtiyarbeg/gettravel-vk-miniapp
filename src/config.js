export const WEBSITE_URL = 'https://gettravel.asia/';

// Launch parameters are UI hints, never proof of identity or booking ownership.
export function isVkLaunch(search, webView = false) {
  const params = new URLSearchParams(search);
  return webView || (params.has('vk_app_id') && params.has('vk_platform'));
}

export function getTheme(scheme) {
  return scheme === 'space_gray' || scheme === 'vkcom_dark' ? 'dark' : 'light';
}
