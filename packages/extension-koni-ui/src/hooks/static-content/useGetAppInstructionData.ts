// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APP_INSTRUCTION_DATA } from '@subwallet/extension-koni-ui/constants';
import { useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';

// const dataByDevModeStatus = getStaticContentByDevMode(); add this when data is ready

export const useGetAppInstructionData = (language: string) => {
  const [, setAppInstructionData] = useLocalStorage(APP_INSTRUCTION_DATA, '[]');
  const getAppInstructionData = useCallback(() => {
    fetch(`https://static-data.subwallet.app/instructions/preview-${language}.json`)
      .then((rs) => {
        return rs.json();
      })
      .then((data) => {
        setAppInstructionData(JSON.stringify(data));
      })
      .catch((e) => console.error(e));
  }, [language, setAppInstructionData]);

  return { getAppInstructionData };
};
