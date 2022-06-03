// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { InputFilter } from '@subwallet/extension-koni-ui/components';
import useGetStakingNetworks from '@subwallet/extension-koni-ui/hooks/screen/bonding/useGetStakingNetworks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import BondingNetworkItem from '@subwallet/extension-koni-ui/Popup/Bonding/components/BondingNetworkItem';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import LogosMap from '../../assets/logo';

interface Props extends ThemeProps {
  className?: string;
}

function BondingNetworkSelection ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [searchString, setSearchString] = useState('');
  const availableNetworks = useGetStakingNetworks();
  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  const filterNetwork = useCallback(() => {
    const _filteredNetworkMap: NetworkJson[] = [];

    availableNetworks.forEach((network) => {
      if (network.chain.toLowerCase().includes(searchString.toLowerCase())) {
        _filteredNetworkMap.push(network);
      }
    });

    return _filteredNetworkMap;
  }, [availableNetworks, searchString]);

  const filteredNetworks = filterNetwork();

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Select a network')}
        to='/'
      >
        <div className={'bonding-input-filter-container'}>
          <InputFilter
            onChange={_onChangeFilter}
            placeholder={t<string>('Search network...')}
            value={searchString}
            withReset
          />
        </div>
      </Header>

      <div className={'network-list'}>
        {
          filteredNetworks.map((network, index) => {
            const icon = LogosMap[network.key] || LogosMap.default;

            return <BondingNetworkItem
              icon={icon}
              key={index}
              network={network}
            />;
          })
        }
      </div>
    </div>
  );
}

export default React.memo(styled(BondingNetworkSelection)(({ theme }: Props) => `
  .bonding-input-filter-container {
    padding: 0 15px 12px;
  }

  .network-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-left: 15px;
    margin-right: 15px;
  }
`));
