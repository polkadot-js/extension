// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CURRENT_PAGE } from '@subwallet/extension-web-ui/constants/localStorage';
import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const useSetCurrentPage = (value: string) => {
  const [, setStorage] = useLocalStorage<string>(CURRENT_PAGE, '/');

  useEffect(() => {
    setStorage(value);
  }, [setStorage, value]);
};

export default useSetCurrentPage;
