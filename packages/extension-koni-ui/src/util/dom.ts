// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const waitForElement = (selector: string, callback: (element: Element) => any) => {
  let count = 0;
  const interval = setInterval(function () {
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
  }, 100);
};
