// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { NetworkJson } from '@polkadot/extension-base/background/KoniTypes';
import { InputFilter, Link } from '@polkadot/extension-koni-ui/components';
import useFetchNetworkMap from '@polkadot/extension-koni-ui/hooks/screen/setting/useFetchNetworkMap';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import NetworkItem from '@polkadot/extension-koni-ui/Popup/Settings/networks/NetworkItem';
import { store } from '@polkadot/extension-koni-ui/stores';
import { NetworkConfigParams } from '@polkadot/extension-koni-ui/stores/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function Networks ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();

  const { isEthereum, parsedNetworkMap: networkMap } = useFetchNetworkMap();
  const [searchString, setSearchString] = useState('');

  const filterNetwork = useCallback(() => {
    const _filteredNetworkMap: Record<string, NetworkJson> = {};

    Object.entries(networkMap).forEach(([key, network]) => {
      if (network.chain.toLowerCase().includes(searchString)) {
        _filteredNetworkMap[key] = network;
      }
    });

    return _filteredNetworkMap;
  }, [networkMap, searchString]);

  const filteredNetworkMap = filterNetwork();

  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  const handleAddNetwork = useCallback(() => {
    const item: NetworkJson = {
      active: false,
      currentProvider: '',
      currentProviderMode: 'ws',
      genesisHash: '',
      groups: [],
      providers: {},
      ss58Format: 0,
      key: '',
      chain: '',
      isEthereum
    };

    store.dispatch({ type: 'networkConfigParams/update', payload: { data: item, mode: 'create' } as NetworkConfigParams });
  }, [isEthereum]);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Network Settings')}
        to='/account/settings'
      >
        <InputFilter
          className='networks__input-filter'
          onChange={_onChangeFilter}
          placeholder={t<string>('Search network...')}
          value={searchString}
          withReset
        />
      </Header>

      <div className='networks__button-area'>
        <div className='networks__btn networks__disconnect-btn'>
          {t<string>('Disconnect All')}
        </div>
        <div className='networks__btn networks__connect-btn'>
          {t<string>('Connect All')}
        </div>
      </div>

      <div className='networks-list'>
        {Object.values(filteredNetworkMap).map((item, index) => <NetworkItem
          item={item}
          key={index}
        />)}
      </div>

      <div className={'add-network-container'}>
        <Link
          onClick={handleAddNetwork}
          to='/account/config-network'
        >
          <div className={'add-network-button'}>
            Add Network
          </div>
        </Link>
      </div>
    </div>
  );
}

export default styled(Networks)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .add-network-button {
    width: 100%;
    cursor: pointer;
    text-align: center;
    padding: 12px 20px;
    border-radius: 8px;
    background-color: ${theme.buttonBackground}
  }

  .add-network-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 30px;
    margin-bottom: 15px;
  }

  .networks__input-filter {
    margin-bottom: 15px;
    margin-left: 15px;
    margin-right: 15px;
  }

  .networks__btn {
    position: relative;
    font-size: 14px;
    line-height: 24px;
    color: ${theme.textColor2};
  }

  .networks__btn:hover {
    cursor: pointer;
    color: ${theme.buttonTextColor2};
  }

  .networks__button-area {
    display: flex;
    justify-content: flex-end;
    padding: 10px 15px;
  }

  .networks__connect-btn {
    padding-left: 17px;
  }

  .networks__connect-btn:before {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: ${theme.textColor2};
    top: 0;
    bottom: 0;
    left: 7px;
    margin: auto 0;
  }

  .network-item__top-content {
    display: flex;
    align-items: center;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .network-item__text {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor2};
  }

  .network-item__toggle {
    position: absolute;
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3.5px;
    transform: rotate(-45deg);
    right: 18px;
    color: ${theme.textColor2};
  }

  .network-item__separator {
    padding-left: 84px;
    padding-right: 15px;
  }

  .network-item {
    position: relative;
  }

  .network-item__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .networks-list {
    overflow: auto;
  }
`);
