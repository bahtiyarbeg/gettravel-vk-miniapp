import test from 'node:test';
import assert from 'node:assert/strict';
import { WEBSITE_URL, isVkLaunch, getTheme } from '../src/config.js';

test('website destination stays fixed even with untrusted launch parameters', () => {
  assert.equal(WEBSITE_URL, 'https://gettravel.asia/');
  assert.equal(isVkLaunch('?url=https://example.com&vk_app_id=123'), false);
});
test('VK desktop and native launches are recognized; ordinary browsers are not', () => {
  assert.equal(isVkLaunch(''), false);
  assert.equal(isVkLaunch('', true), true);
  assert.equal(isVkLaunch('?vk_app_id=123&vk_platform=desktop_web'), true);
});
test('both VK dark themes are handled with a light fallback', () => {
  assert.equal(getTheme('space_gray'), 'dark');
  assert.equal(getTheme('vkcom_dark'), 'dark');
  assert.equal(getTheme(null), 'light');
});
