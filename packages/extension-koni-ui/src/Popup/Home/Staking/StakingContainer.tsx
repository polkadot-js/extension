// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LogosMap from '@subwallet/extension-koni-ui/assets/logo';
import { ActionContext } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import { StakingDataType } from '@subwallet/extension-koni-ui/hooks/screen/home/types';
import useIsAccountAll from '@subwallet/extension-koni-ui/hooks/screen/home/useIsAccountAll';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
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
  const navigate = useContext(ActionContext);
  const { currentAccount: { account } } = useSelector((state: RootState) => state);

  const handleNavigateBonding = useCallback(() => {
    navigate('/account/select-bonding-network');
    window.localStorage.setItem('popupNavigation', '/account/select-bonding-network');
  }, [navigate]);

  const isAccountAll = useIsAccountAll();
  const isExternalAccount = account?.isExternal;
  const isHardwareAccount = account?.isHardware;

  return (
    <div className={className}>
      <div className={'staking-container'}>

        {loading && <Spinner />}

        {/* @ts-ignore */}
        {data.length === 0 && !loading &&
          <EmptyList
            isAccountAll={isAccountAll}
            isExternalAccount={isExternalAccount}
            isHardwareAccount={isHardwareAccount}
          />
        }

        {data.length > 0 && !loading && <div className={'staking-item-container'}>
          {
            // @ts-ignore
            data.map((stakingDataType: StakingDataType, index: number) => {
              const item = stakingDataType.staking;
              const reward = stakingDataType?.reward;
              const name = item.name || item.chainId;
              const icon = LogosMap[item.chainId] || LogosMap.default;
              const price = priceMap[item.chainId];
              const address = account?.address as string;

              return <StakingRow
                activeStake={item.activeBalance}
                address={address}
                chainName={name}
                index={index}
                isAccountAll={isAccountAll}
                key={index}
                logo={icon}
                networkKey={item.chainId}
                price={price}
                reward={reward}
                totalStake={item.balance}
                unbondingStake={item.unlockingBalance}
                unit={item.unit}
              />;
            })
          }
        </div>
        }

        {
          !loading && !isAccountAll && !isHardwareAccount && !isExternalAccount && <div className={'staking-button-container'}>
            <Button
              className={'staking-button'}
              onClick={handleNavigateBonding}
            >
              Start staking
            </Button>
          </div>
        }
      </div>
    </div>
  );
}

export default React.memo(styled(StakingContainer)(({ theme }: Props) => `
  width: 100%;
  padding: 0 25px;

  .staking-item-container {
    margin-bottom: 20px;
  }

  .staking-container {
    display: flex;
    flex-direction: column;
  }

  .staking-button-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 10px;
    align-items: center;
    margin-bottom: 20px;
  }

  .staking-button {
    width: 60%;
  }
`));
