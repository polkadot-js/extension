export const BASE_CREATE_WINDOW_DATA = {
  focused: true,
  width: 376,
  height: 640,
  state: 'normal'
} satisfies chrome.windows.CreateData;

export const POPUP_CREATE_WINDOW_DATA = {
  ...BASE_CREATE_WINDOW_DATA,
  type: 'popup'
} satisfies chrome.windows.CreateData;

export const NORMAL_CREATE_WINDOW_DATA = {
  ...BASE_CREATE_WINDOW_DATA,
  type: 'normal'
} satisfies chrome.windows.CreateData;
