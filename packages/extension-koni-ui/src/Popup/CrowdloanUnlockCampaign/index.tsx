// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import { CROWDLOAN_UNLOCK_TIME } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_CROWDLOAN_UNLOCK_TIME } from '@subwallet/extension-koni-ui/constants/event';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { updateLogoMaps } from '@subwallet/extension-koni-ui/stores/utils';
import { CrowdloanFundInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import fetch from 'cross-fetch';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

type UnlockTimeInfo = {
  time: number;
}

function crowdloanFundsToMap (crowdloanFunds: CrowdloanFundInfo[]): Record<string, CrowdloanFundInfo> {
  const result: Record<string, CrowdloanFundInfo> = {};

  crowdloanFunds.forEach((cf) => {
    if (cf.fundId) {
      result[cf.fundId] = cf;
    }
  });

  return result;
}

function chainInfoItemsToMap (chainInfoItems: _ChainInfo[]): Record<string, _ChainInfo> {
  const result: Record<string, _ChainInfo> = {};

  chainInfoItems.forEach((ci) => {
    if (ci.slug) {
      result[ci.slug] = ci;
    }
  });

  return result;
}

function getLogoMap (chainInfoItems: _ChainInfo[]): Record<string, string> {
  const result: Record<string, string> = {};

  chainInfoItems.forEach((ci) => {
    if (ci.slug && ci.icon) {
      result[ci.slug] = ci.icon;
    }
  });

  return result;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const dataContext = useContext(DataContext);
  const [crowdloanUnlockTime, setCrowdloanUnlockTime] = useLocalStorage<number>(CROWDLOAN_UNLOCK_TIME, DEFAULT_CROWDLOAN_UNLOCK_TIME);
  const [crowdloanFundInfoMap, setCrowdloanFundInfoMap] = useState<Record<string, CrowdloanFundInfo>>({});
  const [chainInfoMap, setChainInfoMap] = useState<Record<string, _ChainInfo>>({});

  useEffect(() => {
    Promise.all([
      (async () => {
        const res = await fetch('https://static-data.subwallet.app/crowdloan-funds/list.json');

        return await res.json() as CrowdloanFundInfo[];
      })(),
      (async () => {
        const res = await fetch('https://static-data.subwallet.app/chains/preview.json');

        return await res.json() as _ChainInfo[];
      })(),
      (async () => {
        const res = await fetch('https://static-data.subwallet.app/events/crowdloan-unlock.json');

        return await res.json() as UnlockTimeInfo;
      })()
    ]).then(([crowdloanFunds, chainInfoItems, unlockTimeInfo]) => {
      setCrowdloanFundInfoMap(crowdloanFundsToMap(crowdloanFunds));
      setChainInfoMap(chainInfoItemsToMap(chainInfoItems));
      setCrowdloanUnlockTime(unlockTimeInfo.time);

      updateLogoMaps({
        chainLogoMap: getLogoMap(chainInfoItems),
        assetLogoMap: {}
      });
    }).catch((e) => {
      console.log('fetch error', e);
    });
  }, [setCrowdloanUnlockTime]);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['price'])}
    >
      <Outlet
        context={{
          crowdloanUnlockTime,
          crowdloanFundInfoMap,
          chainInfoMap
        }}
      />
    </PageWrapper>
  );
};

const CrowdloanUnlockCampaign = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default CrowdloanUnlockCampaign;
