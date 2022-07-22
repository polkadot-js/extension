// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

export const useGetCurrentTabUrl = () => {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0]?.url;

      setUrl(url);
    });
  }, []);

  return url;
};
