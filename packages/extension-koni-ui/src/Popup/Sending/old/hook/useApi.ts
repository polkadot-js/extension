import { TokenUnit } from "../component/InputNumber";
import {formatBalance} from "@polkadot/util";
import {ApiProps, BackgroundWindow} from "@polkadot/extension-base/background/KoniTypes";
import {useEffect, useState} from "react";
import {ApiInitStatus} from "@polkadot/extension-koni-base/api/dotsama";
import { initApi } from "@polkadot/extension-koni-ui/messaging";

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const {apisMap} = bWindow.pdotApi;

function setupDefaultFormatBalance(apiProps: ApiProps, networkKey: string) {
  const {defaultFormatBalance} = apiProps;
  const {decimals, unit} = defaultFormatBalance;

  formatBalance.setDefaults({
    decimals,
    unit
  });

  TokenUnit.setAbbr(unit as string);
}

export default function useApi(networkKey: string): ApiProps {
  const [value, setValue] = useState({isApiReady: false} as ApiProps);

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
          setValue({isApiReady: false, isNotSupport: true} as ApiProps);
        }

        return;
      }

      if (isSync) {
        setValue({isApiReady: false} as ApiProps);
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
    })();

    return () => {
      isSync = false;
    };
  }, [networkKey]);

  return value;
}
