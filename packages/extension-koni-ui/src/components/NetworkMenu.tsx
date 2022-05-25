// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { NETWORK_STATUS, NetWorkGroup } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import check from '@subwallet/extension-koni-ui/assets/check.svg';
import signalSlashIcon from '@subwallet/extension-koni-ui/assets/signal-stream-slash-solid.svg';
import signalIcon from '@subwallet/extension-koni-ui/assets/signal-stream-solid.svg';
import { ActionContext } from '@subwallet/extension-koni-ui/components/contexts';
import InputFilter from '@subwallet/extension-koni-ui/components/InputFilter';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useGenesisHashOptions, { NetworkSelectOption } from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { triggerAccountsSubscription } from '@subwallet/extension-koni-ui/messaging';
import { getLogoByGenesisHash } from '@subwallet/extension-koni-ui/util/logoByGenesisHashMap';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
  onFilter?: (filter: string) => void;
  closeSetting?: () => void;
  currentNetwork?: string;
  genesisOptions: NetworkSelectOption[];
  selectNetwork: (genesisHash: string, networkPrefix: number, icon: string, networkKey: string) => void;
  isNotHaveAccount?: boolean;
}

function NetworkMenu ({ className, currentNetwork, genesisOptions, isNotHaveAccount, onFilter, reference, selectNetwork }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [filteredGenesisOptions, setFilteredGenesisOption] = useState<NetworkSelectOption[]>(genesisOptions);
  const [filteredNetwork, setFilteredNetwork] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const navigate = useContext(ActionContext);
  const filterCategories: {text: string, type: NetWorkGroup | string}[] = [
    {
      text: 'All',
      type: ''
    },
    // {
    //   text: 'Relaychains',
    //   type: 'RELAY_CHAIN'
    // },
    {
      text: 'Polkadot',
      type: 'POLKADOT_PARACHAIN'
    },
    {
      text: 'Kusama',
      type: 'KUSAMA_PARACHAIN'
    },
    {
      text: 'Mainnets',
      type: 'MAIN_NET'
    },
    {
      text: 'Testnets',
      type: 'TEST_NET'
    }
  ];

  if (isNotHaveAccount) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    genesisOptions = useGenesisHashOptions().slice(0, 1);
  }

  useEffect(() => {
    if (filteredNetwork) {
      const lowerCaseFilteredNetwork = filteredNetwork.toLowerCase();

      if (selectedGroup && selectedGroup.length) {
        setFilteredGenesisOption(genesisOptions.filter(
          (network) => network.text.toLowerCase()
            .includes(lowerCaseFilteredNetwork) &&
              network.groups.includes(selectedGroup as NetWorkGroup)));
      } else {
        setFilteredGenesisOption(genesisOptions.filter(
          (network) => network.text.toLowerCase()
            .includes(lowerCaseFilteredNetwork)));
      }
    } else {
      if (selectedGroup && selectedGroup.length) {
        setFilteredGenesisOption(genesisOptions
          .filter((network) => network.groups.includes(selectedGroup as NetWorkGroup)));
      } else {
        setFilteredGenesisOption(genesisOptions);
      }
    }
  }, [filteredNetwork, genesisOptions, selectedGroup]);

  const _onChangeFilter = useCallback((filter: string) => {
    setFilteredNetwork(filter);
    onFilter && onFilter(filter);
  }, [onFilter]);

  const _selectGroup = useCallback(
    (type: NetWorkGroup) => {
      return () => {
        setSelectedGroup(type);

        if (type && type.length) {
          setFilteredGenesisOption(genesisOptions
            .filter((f) => f.groups.includes(type) && f.text.toLowerCase().includes(filteredNetwork)));
        } else {
          setFilteredGenesisOption(genesisOptions.filter((f) => f.text.toLowerCase().includes(filteredNetwork)));
        }
      };
    },
    [filteredNetwork, genesisOptions]
  );

  const _selectNetwork = useCallback((value: string, networkPrefix: number, icon: string, networkKey: string) => {
    return () => {
      selectNetwork(value, networkPrefix, icon, networkKey);
      triggerAccountsSubscription().catch((e) => {
        console.error('There is a problem when trigger Accounts Subscription', e);
      });
    };
  }, [selectNetwork]);

  const handleClickCustomNetworks = useCallback(() => {
    navigate('/account/config-network');
  }, [navigate]);

  const handleStatusText = useCallback((apiStatus: NETWORK_STATUS) => {
    if (apiStatus === NETWORK_STATUS.CONNECTED) {
      return 'Connected';
    } else {
      return 'Unable to connect';
    }
  }, []);

  const handleStatusIcon = useCallback((apiStatus: NETWORK_STATUS, index: number) => {
    if (apiStatus === NETWORK_STATUS.CONNECTED) {
      return <img
        alt='network-status'
        className={'network-status network-status-icon'}
        data-for={`network-status-icon-${index}`}
        data-tip={true}
        src={signalIcon}
      />;
    } else {
      return <img
        alt='network-status'
        className={'network-status network-status-icon'}
        data-for={`network-status-icon-${index}`}
        data-tip={true}
        src={signalSlashIcon}
      />;
    }
  }, []);

  return (
    <Menu
      className={className}
      reference={reference}
    >
      <div className='network-item-list-header'>
        <span>{t<string>('Network')}</span>
        <InputFilter
          className='network-item-list__input-filter'
          onChange={_onChangeFilter}
          placeholder={t<string>('Search network...')}
          value={filteredNetwork}
          withReset
        />
      </div>
      <div className='network-filter-list'>

        {filterCategories.map(({ text, type }): React.ReactNode => (
          <div
            className={type === selectedGroup ? 'network-filter-item__selected-text' : 'network-filter-item__text'}
            key={text}
            onClick={_selectGroup(type as NetWorkGroup)}
          >
            {text}
          </div>
        ))}
      </div>
      <div className='network-item-list'>
        {
          filteredGenesisOptions && filteredGenesisOptions.length
            ? filteredGenesisOptions.map(({ apiStatus, icon, networkKey, networkPrefix, text, value }, index): React.ReactNode => (
              <div
                className='network-item-container'
                key={value}
                onClick={_selectNetwork(value, networkPrefix, icon, networkKey)}
              >
                <div className={'network-item'}>
                  <img
                    alt='logo'
                    className={'network-logo'}
                    src={getLogoByGenesisHash(value)}
                  />

                  <span className={value === currentNetwork ? 'network-text__selected' : 'network-text'}>{text}</span>
                </div>

                <div className={'icon-container'}>
                  {value === currentNetwork
                    ? (
                      <img
                        alt='check'
                        className='checkIcon'
                        src={check}
                      />
                    )
                    : (
                      <div className='uncheckedItem' />
                    )
                  }
                  {
                    networkKey.toLowerCase() !== ALL_ACCOUNT_KEY.toLowerCase() && handleStatusIcon(apiStatus, index)
                  }

                  <Tooltip
                    text={handleStatusText(apiStatus)}
                    trigger={`network-status-icon-${index}`}
                  />
                </div>
              </div>
            ))
            : <div className='kn-no-result'>No results</div>
        }
      </div>
      <div className={'custom-network-container'}>
        <div
          className={'custom-network-btn'}
          onClick={handleClickCustomNetworks}
        >
          Custom Networks
        </div>
      </div>
    </Menu>
  );
}

export default React.memo(styled(NetworkMenu)(({ theme }: Props) => `
  margin-top: 60px;
  right: 15px;
  user-select: none;
  border-radius: 8px;

  .icon-container {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
  }

  .custom-network-btn {
    color: ${theme.buttonTextColor2};
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px;
    width: 80%;
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
    text-align: center;
    border-radius: 8px;
    cursor: pointer;
  }

  .custom-network-container {
    margin-top: 15px;
    margin-bottom: 15px;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .confirm-button {
    cursor: pointer;
    background: #004BFF;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    color: #FFFFFF;
  }

  .cancel-button {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #181E42;
    border-radius: 8px;
    color: #42C59A;
    padding: 10px;
  }

  .confirm-modal-btn-container {
    display: flex;
    justify-content: flex-end;
    gap: 20px;
  }

  .confirm-modal-title {
    font-size: 20px;
    margin-bottom: 50px;
  }

  .network-item {
    display: flex;
    align-items: center;
  }

  .network-status {
    height: 16px;
    width: 16px;
  }

  .network-item-list-header {
    padding: 10px;
    width: 360px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 20px;
    line-height: 32px;
    font-weight: 500;
    border-bottom: 2px solid ${theme.inputBorderColor};
  }

  .network-filter-list {
    display: flex;
    padding: 10px;
    justify-content: space-between;
  }

  .network-item-list__input-filter {
    width: 218px;
  }

  .network-filter-item__text {
    color: ${theme.textColor2};
    cursor: pointer;
  }

  .network-filter-item__selected-text {
    color: ${theme.textColor};
    text-decoration: underline;
    cursor: pointer;
  }

  .kn-no-result {
    color: ${theme.textColor2};
    text-align: center;
  }

  .network-item-list {
    max-height: 200px;
    overflow-y: auto;
    padding: 10px 10px 10px;
  }

  .network-item-container {
    padding: 5px 0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
      .network-text {
        color: ${theme.textColor};
      }
    }
  }

  .network-logo {
    min-width: 30px;
    width: 30px;
    height: 30px;
    border-radius: 100%;
    overflow: hidden;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    border: 1px solid #fff;
    background: #fff;
    margin-right: 10px;
  }

  .network-text {
    font-size: 16px;
    line-height: 26px;
    color: ${theme.textColor2};

    &__selected {
      color: ${theme.textColor}
    }
  }

  .checkIcon {
    height: 16px;
    width: 16px;
  }

  .uncheckedItem {
    width: 14px;
    height: 100%;
  }

  .check-radio-wrapper {
    position: relative;
    height: 100%;
    width: 16px;
    display: flex;
    align-items: center;
    margin-right: 11px;
  }

  .check-radio {
    width: 100%;
    height: 16px;
  }

  .check-dot {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: ${theme.checkDotColor};
    border-radius: 50%;
    top: 3px;
    left: 3px;
  }

`));
