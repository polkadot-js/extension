// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useNotification from "@subwallet-webapp/hooks/common/useNotification";
import { copyToClipboard } from "@subwallet-webapp/util/common/dom";
import { useCallback } from "react";

const useCopy = (value: string): (() => void) => {
  const notify = useNotification();

  return useCallback(() => {
    copyToClipboard(value);
    notify({
      message: "Copied",
    });
  }, [value, notify]);
};

export default useCopy;
