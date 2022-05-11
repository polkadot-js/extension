// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { CustomEvmToken, DeleteEvmTokenParams } from '@polkadot/extension-base/background/KoniTypes';
import { Button, ButtonArea, InputFilter } from '@polkadot/extension-koni-ui/components';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import useFetchEvmToken from '@polkadot/extension-koni-ui/hooks/screen/setting/useFetchEvmToken';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { deleteEvmTokens } from '@polkadot/extension-koni-ui/messaging';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import EvmTokenRow from '@polkadot/extension-koni-ui/Popup/Settings/TokenSetting/EvmTokenRow';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
}

function EvmTokenSetting ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { show } = useToast();

  const allEvmTokens = useFetchEvmToken();
  const [searchString, setSearchString] = useState('');
  const [selectedTokens, setSelectedTokens] = useState<DeleteEvmTokenParams[]>([]);
  const [showModal, setShowModal] = useState(false);

  const _onChangeFilter = useCallback((val: string) => {
    setSearchString(val);
  }, []);

  const filterToken = useCallback(() => {
    const _filteredTokens: CustomEvmToken[] = [];

    allEvmTokens.forEach((token) => {
      if ((token.symbol && token.symbol.toLowerCase().includes(searchString.toLowerCase())) || (token.name && token.name.toLowerCase().includes(searchString.toLowerCase()))) {
        _filteredTokens.push(token);
      }
    });

    return _filteredTokens;
  }, [allEvmTokens, searchString]);

  const handleSelected = useCallback((data: DeleteEvmTokenParams) => {
    setSelectedTokens([
      ...selectedTokens,
      data
    ]);
  }, [selectedTokens]);

  const handleUnselected = useCallback((data: DeleteEvmTokenParams) => {
    const _selectedTokens = [];

    for (const token of selectedTokens) {
      if (token.smartContract !== data.smartContract && token.type !== data.smartContract && token.chain !== data.chain) {
        _selectedTokens.push(token);
      }
    }

    setSelectedTokens(_selectedTokens);
  }, [selectedTokens]);

  const handleShowModal = useCallback(() => {
    if (selectedTokens.length === 0) {
      show(t<string>('At least 1 token must be selected'));
    } else {
      setShowModal(true);
    }
  }, [selectedTokens.length, show, t]);

  const handleDelete = useCallback(() => {
    deleteEvmTokens(selectedTokens)
      .then((resp) => {
        if (resp) {
          show('Your changes are saved successfully');
        } else {
          show('An error has occurred. Please try again later');
        }

        setShowModal(false);
        setSelectedTokens([]);
      })
      .catch(console.error);
  }, [selectedTokens, show]);

  const handleHideModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const filteredTokens = filterToken();

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Custom EVM tokens')}
        to='/account/settings'
      >
        <InputFilter
          className='networks__input-filter'
          onChange={_onChangeFilter}
          placeholder={t<string>('Search token...')}
          value={searchString}
          withReset
        />
      </Header>

      <div className='networks__button-area'>
        <div
          className='networks__btn networks__disconnect-btn'
          onClick={handleShowModal}
        >
          {t<string>('Delete Tokens')}
        </div>
      </div>

      <div className='networks-list'>
        {filteredTokens.map((item) => <EvmTokenRow
          handleSelected={handleSelected}
          handleUnselected={handleUnselected}
          item={item}
          key={item.smartContract.concat(item.chain)}
        />)}
      </div>

      {
        showModal &&
        <Modal
          className={'confirm-delete-modal'}
        >
          <div>
            <span className={'delete-title'}>Confirm deletion ?</span>
            <ButtonArea
              className={'delete-button-area'}
            >
              <Button
                className='network-edit-button'
                onClick={handleHideModal}
              >
                <span>{t<string>('Cancel')}</span>
              </Button>
              <Button
                className='network-edit-button'
                onClick={handleDelete}
              >
                {t<string>('Confirm')}
              </Button>
            </ButtonArea>
          </div>
        </Modal>
      }
    </div>
  );
}

export default styled(EvmTokenSetting)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .delete-button-area {
    margin-top: 20px;
  }

  .network-edit-button:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .delete-title {
    font-size: 20px;
    font-weight: 500;
  }

  .confirm-delete-modal .subwallet-modal {
    max-width: 460px;
    padding: 20px;
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
    padding-left: 60px;
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
    flex: 1;
    overflow: auto;
  }
`);
