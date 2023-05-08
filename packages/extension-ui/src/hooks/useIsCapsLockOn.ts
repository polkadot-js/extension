// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

export const useIsCapsLockOn = () => {
  const [isCapsLockOn, setIsCapsLockOn] = useState<boolean>();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "CapsLock") {
      setIsCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  return {
    isCapsLockOn,
    handleKeyDown,
  };
};