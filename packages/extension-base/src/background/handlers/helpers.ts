// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function withErrorLog (fn: () => unknown): void {
  try {
    const p = fn();

    if (p && typeof p === 'object' && typeof (p as Promise<unknown>).catch === 'function') {
      (p as Promise<unknown>).catch(console.error);
    }
  } catch (e) {
    console.error(e);
  }
}

export const openCenteredWindow = async (createData: chrome.windows.CreateData & {width: number; height: number}): Promise<void> => {
  const focusedWindow = await chrome.windows.getCurrent();

  const centeredCreateData = {
    ...createData,
    ...getCenteredPosition(focusedWindow, createData)
  };

  try {
    const newWindow = await chrome.windows.create(centeredCreateData);

    if (newWindow) {
      // We're adding chrome.windows.update to make sure that the extension popup is not fullscreened
      // There is a bug in Chrome that causes the extension popup to be fullscreened when user has any fullscreened browser window opened on the main screen
      await chrome.windows.update(newWindow.id || 0, { state: 'normal' });
    }
  } catch (e) {
    console.error(e);
  }
};

const getCenteredPosition = (
  { height: relativeWindowHeight, left: relativeWindowLeft, top: relativeWindowTop, width: relativeWindowWidth }: chrome.windows.Window,
  { height: newWindowHeight, width: newWindowWidth }: {width: number, height: number}
): {left?: number, top?: number} => {
  if (relativeWindowWidth === undefined || relativeWindowHeight === undefined || relativeWindowLeft === undefined || relativeWindowTop === undefined) {
    return {};
  }

  return {
    left: Math.round((relativeWindowWidth - newWindowWidth) / 2 + relativeWindowLeft),
    top: Math.round((relativeWindowHeight - newWindowHeight) / 2 + relativeWindowTop)
  };
};
