// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import copy from 'copy-to-clipboard';

export const waitForElement = (selector: string, callback: (element: Element) => any) => {
  let count = 0;
  const interval = setInterval(function () {
    try {
      const element = document.querySelector(selector);

      if (element) {
        clearInterval(interval);
        callback(element);
      } else {
        count++;

        if (count >= 10) {
          clearInterval(interval);
        }
      }
    } catch (e) {
      clearInterval(interval);
    }
  }, 100);
};

export const copyToClipboard = (text: string) => {
  copy(text);
};

export const clickOutside = (selector: string, callback: () => void, enable: boolean): ((event: MouseEvent) => void) => {
  return (event: MouseEvent) => {
    const elem = document.querySelector(selector);

    let outsideClick = false;

    if (elem) {
      outsideClick = typeof event.composedPath === 'function' && !event.composedPath().includes(elem);
    }

    if (outsideClick) {
      callback();
    }
  };
};

export const renderModalSelector = (className?: string): string => {
  return `.${(className || '').replace(' ', '.')}.ant-sw-modal`;
};
