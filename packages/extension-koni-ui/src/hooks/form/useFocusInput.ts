// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';

const focusInput = (formName: string, fieldName: string, timeOut: number) => {
  setTimeout(() => {
    const element = document.getElementById(`${formName}_${fieldName}`);

    if (element) {
      element.focus();
    }
  }, timeOut);
};

const useFocusInput = (formName: string, fieldName: string, active = true, timeOut = 10) => {
  useEffect(() => {
    if (active) {
      focusInput(formName, fieldName, timeOut);
    }
  }, [formName, fieldName, active, timeOut]);
};

export default useFocusInput;
