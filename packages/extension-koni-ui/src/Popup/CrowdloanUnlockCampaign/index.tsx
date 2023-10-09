// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import { CROWDLOAN_UNLOCK_TIME } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_CROWDLOAN_UNLOCK_TIME } from '@subwallet/extension-koni-ui/constants/event';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import fetch from 'cross-fetch';
import React, { useContext, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

type FetchResponse = {
  time: number;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const dataContext = useContext(DataContext);
  const [crowdloanUnlockTime, setCrowdloanUnlockTime] = useLocalStorage<number>(CROWDLOAN_UNLOCK_TIME, DEFAULT_CROWDLOAN_UNLOCK_TIME);

  useEffect(() => {
    (async () => {
      const res = await fetch('https://static-data.subwallet.app/events/crowdloan-unlock.json');

      return await res.json() as FetchResponse;
    })().then((rs) => {
      setCrowdloanUnlockTime(rs.time);
    }).catch((e) => {
      console.log('Get crowdloan unlock time error', e);
    });
  }, [setCrowdloanUnlockTime]);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['price', 'chainStore', 'assetRegistry'])}
    >
      <Outlet
        context={{
          crowdloanUnlockTime
        }}
      />
    </PageWrapper>
  );
};

const CrowdloanUnlockCampaign = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default CrowdloanUnlockCampaign;
