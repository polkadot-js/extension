// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

const focusInput = (id: string, timeOut: number) => {
  setTimeout(() => {
    const element = document.getElementById(id);

    if (element) {
      element.focus();
    }
  }, timeOut);
};

const useFocusById = (id: string, active = true, timeOut = 33) => {
  useEffect(() => {
    if (active) {
      focusInput(id, timeOut);
    }
  }, [active, id, timeOut]);
};

export default useFocusById;
