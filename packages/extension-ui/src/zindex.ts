// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const Z_INDEX = {
  ADDRESS: 1,
  ADD_ACCOUNT_BACKGROUND: -100,
  ADD_ACCOUNT_FOREGROUND: 100,
  BOTTOM_WRAPPER: 100,
  DROPDOWN: 100,
  // Header have to have higher z-index than HEADER_STEPS.
  // Otherwise help / settings tooltip hides under steps.
  HEADER: 101,
  HEADER_STEPS: 100,
  MENU: 2,
  SPLASH_HEADER: 105,
  TOAST: 102,
  TOOLTIP: 99,
  NEW_ACCOUNT_RIBBON: 99
};
