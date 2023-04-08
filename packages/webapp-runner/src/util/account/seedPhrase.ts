// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WordItem } from "@subwallet-webapp/types/account";

export const convertToWords = (seedPhrase: string): Array<Array<WordItem>> => {
  const raw = seedPhrase.split(" ");
  const result: Array<Array<WordItem>> = [];
  let count = 0;
  let temp: Array<WordItem> = [];

  raw.forEach((item, index) => {
    temp.push({ index: index + 1, label: item });
    count++;

    if (count === 3 || index === raw.length - 1) {
      result.push(temp);
      count = 0;
      temp = [];
    }
  });

  return result;
};
