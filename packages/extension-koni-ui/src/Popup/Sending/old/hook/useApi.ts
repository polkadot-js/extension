// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiInitStatus, ApiProps, BackgroundWindow } from '@subwallet/extension-base/background/KoniTypes';
import { initApi } from '@subwallet/extension-koni-ui/messaging';
import { useEffect, useState } from 'react';

import { formatBalance } from '@polkadot/util';

import { TokenUnit } from '../component/InputNumber';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { apisMap } = bWindow.pdotApi;

function setupDefaultFormatBalance (apiProps: ApiProps, networkKey: string) {
  const { defaultFormatBalance } = apiProps;
  const { decimals, unit } = defaultFormatBalance;

  formatBalance.setDefaults({
    decimals,
    unit
  });

  TokenUnit.setAbbr(unit as string);
}

// TODO: deprecated, delete this
export default function useApi (networkKey: string): ApiProps {
  const [value, setValue] = useState({ isApiReady: false } as ApiProps);

  useEffect(() => {
    let isSync = true;

    (async () => {
      let apiInfo = apisMap[networkKey];

      if (apiInfo) {
        if (apiInfo.isApiReady) {
          if (isSync) {
            setupDefaultFormatBalance(apiInfo, networkKey);
            setValue(apiInfo);
          }
        } else {
          await apiInfo.isReady;

          if (isSync) {
            setupDefaultFormatBalance(apiInfo, networkKey);
            setValue(apiInfo);
          }
        }

        return;
      }

      const apiInitiationStatus = await initApi(networkKey);

      if ([
        ApiInitStatus.NOT_SUPPORT.valueOf()
        // , ApiInitStatus.ALREADY_EXIST.valueOf()
      ].includes(apiInitiationStatus.valueOf())) {
        if (isSync) {
          setValue({ isApiReady: false, isNotSupport: true } as ApiProps);
        }

        return;
      }

      if (isSync) {
        setValue({ isApiReady: false } as ApiProps);
      }

      apiInfo = apisMap[networkKey];

      if (isSync && apiInfo && apiInfo.isApiReady) {
        setupDefaultFormatBalance(apiInfo, networkKey);
        setValue(apiInfo);

        return;
      }

      await apiInfo.isReady;

      if (isSync) {
        setupDefaultFormatBalance(apiInfo, networkKey);
        setValue(apiInfo);
      }
    })().catch((e) => {
      console.log('Error in useAPI: ', e);
    });

    return () => {
      isSync = false;
      setValue({ isApiReady: false } as ApiProps);
    };
  }, [networkKey]);

  return value;
}
