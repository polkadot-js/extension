// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import QuestionIcon from '@subwallet/extension-koni-ui/assets/Question.svg';
import { InputFilter } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import NetworkSelectionItem from '@subwallet/extension-koni-ui/components/NetworkSelection/NetworkSelectionItem';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { enableNetworks } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import LogosMap from '../../assets/logo';

interface Props extends ThemeProps {
  className?: string;
  handleShow: (val: boolean) => void;
}

function NetworkSelection ({ className, handleShow }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { networkMap } = useSelector((state: RootState) => state);
  const [searchString, setSearchString] = useState('');
  // const [isCheck, setIsChecked] = useState(false);
  const [selected, setSelected] = useState<string[]>(['polkadot', 'kusama']);
  const { show } = useToast();

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

  const filterNetwork = useCallback(() => {
    const _filteredNetworkMap: Record<string, NetworkJson> = {};

    Object.entries(networkMap).forEach(([key, network]) => {
      if (network.chain.toLowerCase().includes(searchString.toLowerCase())) {
        _filteredNetworkMap[key] = network;
      }
    });

    return _filteredNetworkMap;
  }, [networkMap, searchString]);

  // const handleCheckRecommended = useCallback((checked: boolean) => {
  //   setIsChecked(checked);
  //
  //   if (checked) {
  //     console.log('selected');
  //   } else {
  //     console.log('unselected');
  //   }
  // }, []);

  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  const handleSubmit = useCallback(() => {
    enableNetworks(selected)
      .then((result) => {
        if (result) {
          show('Your setting has been saved');
        } else {
          show('Encountered an error. Please try again later');
        }
      })
      .catch(console.error);

    window.localStorage.setItem('isSetNetwork', 'ok');
    handleShow(false);
  }, [handleShow, selected, show]);

  const filteredNetworkMap = filterNetwork();

  const isSelected = useCallback((networkKey: string) => {
    return selected.includes(networkKey);
  }, [selected]);

  return (
    <div className={className}>
      <Modal className={'network-selection-container'}>
        <div className={'network-selection-title'}>
          <div>Network Selection</div>
          <img
            className={'question-icon'}
            data-for={'network-selection-question-icon'}
            data-tip={true}
            src={QuestionIcon}
          />
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
          {/* <div className={'network-selection-suggestion'}> */}
          {/*  <Checkbox */}
          {/*    checked={isCheck} */}
          {/*    className={'network-selection-checkbox'} */}
          {/*    label={''} */}
          {/*    onChange={handleCheckRecommended} */}
          {/*  /> */}
          {/*  <div className={'network-selection-recommendation'}>Use suggested setting</div> */}
          {/* </div> */}
        </div>

        <div className={'network-selection-content-container'}>
          {
            Object.entries(filteredNetworkMap).map(([networkKey, networkJson]) => {
              const logo = LogosMap[networkKey] || LogosMap.default;

              return <NetworkSelectionItem
                handleSelect={handleSelect}
                isSelected={isSelected(networkKey)}
                key={networkKey}
                logo={logo}
                networkJson={networkJson}
                networkKey={networkKey}
              />;
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
