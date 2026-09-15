import test from 'node:test';
import assert from 'node:assert/strict';
import { WEBSITE_URL, isVkLaunch, getTheme, getNotice, safeInset } from '../src/config.js';

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

test('offline warning takes priority over VK and site errors', () => {
  assert.equal(getNotice(false, 'VK error', 'Site error'), 'Нет подключения к интернету.');
  assert.equal(getNotice(true, 'VK error', 'Site error'), 'Site error');
  assert.equal(getNotice(true, 'VK error', ''), 'VK error');
  assert.equal(getNotice(true, '', ''), '');
});
test('appearance overrides legacy theme and invalid insets are rejected', () => {
  assert.equal(getTheme('bright_light', 'dark'), 'dark');
  assert.equal(getTheme('space_gray', 'light'), 'light');
  for (const value of [NaN, Infinity, -10, '50', undefined]) assert.equal(safeInset(value), 0);
  assert.equal(safeInset(34), 34);
  assert.equal(safeInset(1000), 200);
});
