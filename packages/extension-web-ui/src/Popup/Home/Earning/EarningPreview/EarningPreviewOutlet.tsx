// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo } from '@subwallet/extension-base/types';
import { fetchStaticCache } from '@subwallet/extension-base/utils/fetchStaticCache';
import { LoadingScreen } from '@subwallet/extension-web-ui/components';
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
  const [poolInfoMap, setPoolInfoMap] = useState<Record<string, YieldPoolInfo> | null>(null);
  const [isReady, setIsReady] = useState(false);

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

  useEffect(() => {
    let isSync = true;

    if (!isReady) {
      dataContext.awaitStores(['price']).then((rs) => {
        if (rs && !!poolInfoMap && isSync) {
          setIsReady(true);
        }
      }).catch(console.log);
    }

    return () => {
      isSync = false;
    };
  }, [dataContext, isReady, poolInfoMap]);

  if (!isReady) {
    return <LoadingScreen className={className} />;
  }

  return (
    <div className={className}>
      <Outlet
        context={{
          poolInfoMap
        }}
      />
    </div>
  );
}

const EarningPreviewOutlet = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  height: '100%'
}));

export default EarningPreviewOutlet;
