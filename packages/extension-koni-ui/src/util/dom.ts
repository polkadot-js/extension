// [object Object]
// SPDX-License-Identifier: Apache-2.0

export const waitForElement = (selector: string, callback: (element: Element) => any) => {
  let count = 0;
  const poops = setInterval(function () {
    const element = document.querySelector(selector);

    if (element) {
      clearInterval(poops);
      callback(element);
    } else {
      count++;

      if (count >= 10) {
        clearInterval(poops);
      }
    }
  }, 100);
};
