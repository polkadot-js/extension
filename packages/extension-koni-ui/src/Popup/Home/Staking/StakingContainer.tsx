// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LogosMap from '@subwallet/extension-koni-ui/assets/logo';
import { StakingDataType } from '@subwallet/extension-koni-ui/hooks/screen/home/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

const StakingRow = React.lazy(() => import('./StakingRow'));
const Spinner = React.lazy(() => import('@subwallet/extension-koni-ui/components/Spinner'));
const EmptyList = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/EmptyList'));

interface Props extends ThemeProps {
  className?: string;
  data: StakingDataType[];
  loading: boolean;
  priceMap: Record<string, number>;
}

function StakingContainer ({ className, data, loading, priceMap }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div className={'staking-container'}>

        {loading && <Spinner />}

        {/* @ts-ignore */}
        {data.length === 0 && !loading &&
          <EmptyList />
        }

        {data.length > 0 && !loading &&
          // @ts-ignore
          data.map((stakingDataType: StakingDataType, index: number) => {
            const item = stakingDataType.staking;
            const reward = stakingDataType?.reward;

            const name = item?.chainId;
            const icon = LogosMap[name] || LogosMap.default;
            const price = priceMap[name];

            return <StakingRow
              amount={item.balance}
              chainName={name}
              index={index}
              key={index}
              logo={icon}
              price={price}
              reward={reward}
              unit={item.unit}
            />;
          })
        }
      </div>
    </div>
  );
}

export default React.memo(styled(StakingContainer)(({ theme }: Props) => `
  width: 100%;
  padding: 0 25px;

  .staking-container {
    display: flex;
    flex-direction: column;
  }
`));
