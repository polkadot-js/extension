// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/types';
import { fetchStaticCache } from '@subwallet/extension-base/utils/fetchStaticCache';
import { PageWrapper } from '@subwallet/extension-web-ui/components';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
//
};

function Component ({ className }: Props) {
  const dataContext = useContext(DataContext);
  const [poolInfoMap, setPoolInfoMap] = useState<Record<string, YieldPoolInfo>>({});

  useEffect(() => {
    let isSync = true;

    fetchStaticCache<{data: Record<string, YieldPoolInfo>}>('earning/yield-pools.json', { data: {} }).then((rs) => {
      if (isSync) {
        setPoolInfoMap(rs.data);
      }
    }).catch((e) => {
      console.log('Error when fetching yield-pools.json', e);
    });

    return () => {
      isSync = false;
    };
  }, []);

  return (
    <PageWrapper
      resolve={dataContext.awaitStores(['price'])}
    >
      <Outlet
        context={{
          poolInfoMap
        }}
      />
    </PageWrapper>
  );
}

const EarningDemoOutlet = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));

export default EarningDemoOutlet;
