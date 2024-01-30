// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { clickOutside } from '@subwallet/extension-web-ui/utils/common/dom';
import { useEffect, useRef } from 'react';

const useClickOutSide = (enable: boolean, selector: string, callback: () => void) => {
  const timeRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    clearTimeout(timeRef.current);
    const func = clickOutside(selector, callback, enable);

    const root = document.getElementById('root');

    if (enable && root) {
      setTimeout(() => {
        root.addEventListener('click', func);
      }, 500);
    }

    return () => {
      root && root.removeEventListener('click', func);
    };
  }, [callback, enable, selector]);
};

export default useClickOutSide;
