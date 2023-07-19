// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

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
