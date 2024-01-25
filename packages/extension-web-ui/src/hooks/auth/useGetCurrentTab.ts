// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

export const useGetCurrentTab = () => {
  const [tab, setTab] = useState<chrome.tabs.Tab | undefined>(undefined);

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      setTab(tabs[0]);
    });
  }, []);

  return tab;
};
