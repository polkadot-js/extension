// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { InputFilter, Link } from '@subwallet/extension-koni-ui/components';
import useFetchNetworkMap from '@subwallet/extension-koni-ui/hooks/screen/setting/useFetchNetworkMap';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { disableAllNetwork, enableAllNetwork, resetDefaultNetwork } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import NetworkItem from '@subwallet/extension-koni-ui/Popup/Settings/NetworkSettings/NetworkItem';
import { store } from '@subwallet/extension-koni-ui/stores';
import { NetworkConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function Networks ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { show } = useToast();

  const { isEthereum, parsedNetworkMap: networkMap } = useFetchNetworkMap();
  const [searchString, setSearchString] = useState('');

  const filterNetwork = useCallback(() => {
    const _filteredNetworkMap: Record<string, NetworkJson> = {};

    Object.entries(networkMap).forEach(([key, network]) => {
      if (network.chain.toLowerCase().includes(searchString.toLowerCase())) {
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

  const handleDisableAll = useCallback(() => {
    disableAllNetwork()
      .then((resp) => {
        if (resp) {
          show('All networks are disabled');
        } else {
          show('An error has occurred. Please try again later');
        }
      })
      .catch(console.error);
  }, [show]);

  const handleEnableAll = useCallback(() => {
    enableAllNetwork()
      .then((resp) => {
        if (resp) {
          show('All networks are enabled');
        } else {
          show('An error has occurred. Please try again later');
        }
      })
      .catch(console.error);
  }, [show]);

  const handleResetDefault = useCallback(() => {
    resetDefaultNetwork()
      .then((resp) => {
        if (resp) {
          show('Networks have been reset to default setting');
        } else {
          show('An error has occurred. Please try again later');
        }
      })
      .catch(console.error);
  }, [show]);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Network Settings')}
        to='/account/settings'
      >
        <div className={'networks-input-filter-container'}>
          <InputFilter
            className='networks__input-filter'
            onChange={_onChangeFilter}
            placeholder={t<string>('Search network...')}
            value={searchString}
            withReset
          />
        </div>
      </Header>

      <div className='networks__button-area'>
        <div
          className='networks__btn networks__disconnect-btn'
          onClick={handleDisableAll}
        >
          {t<string>('Disconnect All')}
        </div>
        <div
          className='networks__btn networks__connect-btn'
          onClick={handleEnableAll}
        >
          {t<string>('Connect All')}
        </div>
        <div
          className='networks__btn networks__connect-btn'
          onClick={handleResetDefault}
        >
          {t<string>('Reset to default')}
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
          className={'add-network-link'}
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

  .add-network-link {
    opacity: 1;
  }

  .networks-input-filter-container {
    padding: 0 15px 12px;
  }

  .add-network-button {
    width: 100%;
    cursor: pointer;
    text-align: center;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    background-color: ${theme.buttonBackground};
    opacity: 1;
  }

  .add-network-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 30px;
    margin-bottom: 15px;
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
