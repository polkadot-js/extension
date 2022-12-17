// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { IconMaps } from '@subwallet/extension-koni-ui/assets/icon';
import { InputFilter } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import NetworkSelectionItem from '@subwallet/extension-koni-ui/components/NetworkSelection/NetworkSelectionItem';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { disableNetworks, enableNetworks } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import LogosMap from '../../assets/logo';

interface Props extends ThemeProps {
  className?: string;
  handleShow: (val: boolean) => void;
}

function NetworkSelection ({ className, handleShow }: Props): React.ReactElement {
  const { t } = useTranslation();
  const networkMap = useSelector((state: RootState) => state.networkMap);
  const [searchString, setSearchString] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [filteredNetworkList, setFilteredNetworkList] = useState<NetworkJson[]>([]);
  const show = useToast().show;

  useEffect(() => {
    const selectedNetwork = Object.keys(networkMap).filter((k) => networkMap[k].active);

    setSelected(selectedNetwork);
  }, [networkMap]);

  const handleSelect = useCallback((networkKey: string, active: boolean) => {
    let _selected: string[] = [];

    if (active) {
      if (!selected.includes(networkKey)) {
        _selected = [
          ...selected,
          networkKey
        ];
      }
    } else {
      if (selected.includes(networkKey)) {
        selected.forEach((_networkKey) => {
          if (_networkKey !== networkKey) {
            _selected.push(_networkKey);
          }
        });
      }
    }

    setSelected(_selected);
  }, [selected]);

  useEffect(() => {
    const _filteredNetworkList = Object.values(networkMap)
      .filter((network) => ((Object.keys(network.providers).length > 0 || Object.keys(network.customProviders || []).length > 0) && network.chain.toLowerCase().includes(searchString.toLowerCase())));
    const _sortedNetworkList = _filteredNetworkList.filter(({ active }) => active).concat(_filteredNetworkList.filter(({ active }) => !active));

    setFilteredNetworkList(_sortedNetworkList);
  }, [networkMap, searchString, selected]);

  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  const handleSubmit = useCallback(() => {
    const enabledList = Object.values(networkMap).filter((v) => (v.active)).map((v) => v.key);
    const enableList = selected.filter((k) => !enabledList.includes(k));
    const disableList = enabledList.filter((k) => !selected.includes(k));

    console.log('Check list', enableList, disableList);

    const promList = [];

    enableList.length > 0 && promList.push(enableNetworks(enableList));
    disableList.length > 0 && promList.push(disableNetworks(disableList));

    Promise.all(promList)
      .then((rs) => {
        if (rs.filter((r) => r).length === rs.length) {
          show('Your setting has been saved');
        } else {
          show('Encountered an error. Please try again later');
        }
      })
      .catch(console.error);

    window.localStorage.setItem('isSetNetwork', 'ok');
    handleShow(false);
  }, [handleShow, networkMap, selected, show]);

  return (
    <div className={className}>
      <Modal className={'network-selection-container'}>
        <div className={'network-selection-title'}>
          <div>Network Selection</div>
          <div
            className={'question-icon'}
            data-for={'network-selection-question-icon'}
            data-tip={true}
          >
            {IconMaps.question}
          </div>
          <Tooltip
            place={'bottom'}
            text={t<string>('Please only select networks that you need to optimize resource consumption. You can always turn them on later if needed')}
            trigger={'network-selection-question-icon'}
          />
        </div>

        <div className='networks__input-filter'>
          <InputFilter
            onChange={_onChangeFilter}
            placeholder={t<string>('Search network...')}
            value={searchString}
            withReset
          />
        </div>

        <div className={'network-selection-content-container'}>
          {
            filteredNetworkList.map((network) => {
              const networkKey = network.key;
              const logo = LogosMap[networkKey] || LogosMap.default;
              const isSelected = selected.includes(networkKey);

              console.log(networkKey, isSelected);

              return (<NetworkSelectionItem
                handleSelect={handleSelect}
                isSelected={isSelected}
                key={networkKey}
                logo={logo}
                networkJson={network}
                networkKey={networkKey}
              />);
            })
          }
        </div>

        <div className={'network-selection-footer'}>
          <div className={'network-selection-span'}>
            You have selected <span className={'network-selection-highlight'}>{selected.length} network{selected.length > 1 ? 's' : ''}</span>
          </div>
          <div className='network-selection-separator' />
          <div className={'network-selection-btn-container'}>
            <Button
              className={'network-selection-confirm-btn'}
              onClick={handleSubmit}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default styled(NetworkSelection)(({ theme }: Props) => `
  .network-selection-suggestion {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 15px;
  }

  .network-selection-btn-container {
    margin-top: 15px;
    display: flex;
    justify-content: center;
  }

  .network-selection-confirm-btn {
    width: 50%
  }

  .network-selection-span {
    font-weight: 400;
    font-size: 15px;
    line-height: 26px;
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
  }

  .network-selection-highlight {
    color: ${theme.primaryColor};
  }

  .network-selection-separator {
    &:before {
      content: '';
      height: 2px;
      display: block;
      background: ${theme.boxBorderColor};
    }
  }

  .network-selection-footer {
    margin-top: 10px;
  }

  .network-selection-content-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
    height: 200px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .networks__input-filter {
    margin-top: 20px;
  }

  .question-icon {
    height: 20px;
    width: 20px;
    margin-left: 10px;
    cursor: pointer;
    color: ${theme.primaryColor}
  }

  .network-selection-container .subwallet-modal {
    padding-top: 20px;
    padding-bottom: 20px;
    width: 400px;
    top: 5%;
    background-color: ${theme.popupBackground};
  }

  .network-selection-title {
    font-size: 20px;
    font-weight: 500;
    text-align: center;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`);
