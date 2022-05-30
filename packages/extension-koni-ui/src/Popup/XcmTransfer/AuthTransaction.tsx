// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  DropdownTransformOptionType,
  NetworkJson,
  RequestCheckCrossChainTransfer
} from '@subwallet/extension-base/background/KoniTypes';
import arrowRight from '@subwallet/extension-koni-ui/assets/arrow-right.svg';
import { InputWithLabel, Warning } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import Dropdown from '@subwallet/extension-koni-ui/Popup/XcmTransfer/XcmDropdown/Dropdown';
import { ThemeProps, TransferResultType } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  onCancel: () => void;
  requestPayload: RequestCheckCrossChainTransfer;
  feeInfo: [string | null, number, string]; // fee, fee decimal, fee symbol
  balanceFormat: BalanceFormatType; // decimal, symbol
  networkMap: Record<string, NetworkJson>;
  onChangeResult: (txResult: TransferResultType) => void;
  originChainOptions: DropdownTransformOptionType[];
  destinationChainOptions: DropdownTransformOptionType[];
}

function AuthTransaction ({ className, networkMap, onCancel, onChangeResult, requestPayload, originChainOptions, destinationChainOptions }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [isBusy, setBusy] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [isKeyringErr, setKeyringErr] = useState<boolean>(false);
  const [errorArr, setErrorArr] = useState<string[]>([]);
  const originNetworkPrefix = networkMap[requestPayload.originalNetworkKey].ss58Format;
  const destinationNetworkPrefix = networkMap[requestPayload.destinationNetworkKey].ss58Format;

  const _onCancel = useCallback(() => {
    onCancel();
  },
  [onCancel]
  );

  const _doStart = useCallback(
    (): void => {
      console.log('123');
      setBusy(true);
    },
    []);

  const _onChangePass = useCallback(
    (value: string): void => {
      setPassword(value);
      setErrorArr([]);
      setKeyringErr(false);
    },
    []
  );

  const renderError = () => {
    return errorArr.map((err) =>
      (
        <Warning
          className='auth-transaction-error'
          isDanger
          key={err}
        >
          {t<string>(err)}
        </Warning>
      )
    );
  };

  return (
    <div className={className}>
      <Modal className={'signer-modal'}>
        <div className='auth-transaction-header'>
          <div className='auth-transaction-header__part-1' />
          <div className='auth-transaction-header__part-2'>
            {t<string>('Authorize Transaction')}
          </div>
          <div className='auth-transaction-header__part-3'>
            {isBusy
              ? (
                <span className={'auth-transaction-header__close-btn -disabled'}>{t('Cancel')}</span>
              )
              : (
                <span
                  className={'auth-transaction-header__close-btn'}
                  onClick={_onCancel}
                >{t('Cancel')}</span>
              )
            }
          </div>
        </div>

        <div className='auth-transaction-body'>
          <div className='bridge__chain-selector-area'>
            <Dropdown
              className='bridge__chain-selector'
              isDisabled={true}
              options={originChainOptions}
              label={'Original Chain'}
              value={requestPayload.originalNetworkKey}
            />

            <div className='bridge__chain-swap'>
              <img
                alt='Icon'
                src={arrowRight}
              />
            </div>

            <Dropdown
              className='bridge__chain-selector'
              isDisabled={true}
              options={destinationChainOptions}
              label={'Destination Chain'}
              value={requestPayload.destinationNetworkKey}
            />
          </div>

          <InputAddress
            className={'auth-transaction__input-address'}
            defaultValue={requestPayload.from}
            help={t<string>('The account you will send funds from.')}
            isDisabled={true}
            isSetDefaultValue={true}
            label={t<string>('Send from account')}
            networkPrefix={originNetworkPrefix}
            type='account'
            withEllipsis
          />

          <InputAddress
            className={'auth-transaction__input-address'}
            defaultValue={requestPayload.to}
            help={t<string>('The address you want to send funds to.')}
            isDisabled={true}
            isSetDefaultValue={true}
            label={t<string>('Send to address')}
            networkPrefix={destinationNetworkPrefix}
            type='allPlus'
            withEllipsis
          />

          <div className='auth-transaction__separator' />

          <div className='auth-transaction__info'>
            <div className='auth-transaction__info-text'>Amount</div>
            <div className='auth-transaction__info-value'>
              0.0000 DOT
            </div>
          </div>

          <div className='auth-transaction__info'>
            <div className='auth-transaction__info-text'>Origin Chain Fee</div>
            <div className='auth-transaction__info-value'>
              0.0000 DOT
            </div>
          </div>

          <div className='auth-transaction__info'>
            <div className='auth-transaction__info-text'>Destination Chain Fee</div>
            <div className='auth-transaction__info-value'>
              0.0000 DOT
            </div>
          </div>

          <div className='auth-transaction__separator' />

          <InputWithLabel
            isError={isKeyringErr}
            label={t<string>('Unlock account with password')}
            onChange={_onChangePass}
            type='password'
            value={password}
          />

          {!!(errorArr && errorArr.length) && renderError()}

          <div className='bridge-button-container'>
            <Button
              className='bridge-button'
              onClick={_onCancel}
            >
            <span>
              {t<string>('Reject')}
            </span>
            </Button>

            <Button
              className='bridge-button'
              isDisabled={false}
              onClick={_doStart}
            >
            <span>
              {t<string>('Confirm')}
            </span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(AuthTransaction)(({ theme }: ThemeProps) => `
  .subwallet-modal {
    max-width: 460px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .auth-transaction-error {
    margin-top: 10px
  }

  .auth-transaction-header {
    display: flex;
    align-items: center;
    height: 72px;
    box-shadow: ${theme.headerBoxShadow};
  }

  .auth-transaction-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

    .auth-transaction-header__part-1 {
    flex: 1;
  }

  .auth-transaction-header__part-2 {
    color: ${theme.textColor};
    font-size: 20px;
    font-weight: 500;
  }

  .auth-transaction-header__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .auth-transaction-header__close-btn {
    padding-left: 16px;
    padding-right: 16px;
    height: 40px;
    display: flex;
    align-items: center;
    color: ${theme.buttonTextColor2};
    cursor: pointer;
    opacity: 0.85;
  }

  .auth-transaction-header__close-btn:hover {
    opacity: 1;
  }

  .auth-transaction-header__close-btn.-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .auth-transaction__submit-wrapper {
    position: sticky;
    bottom: -15px;
    padding: 15px;
    margin-left: -15px;
    margin-bottom: -15px;
    margin-right: -15px;
    background-color: ${theme.background};
  }

  .auth-transaction__input-address {
    margin-bottom: 14px;
  }

  .auth-transaction__info {
    display: flex;
    width: 100%;
    padding: 4px 0;
    flex-wrap: wrap;
  }

  .auth-transaction__info-text, auth-transaction__info-value {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
  }

  .auth-transaction__info-text {
    color: ${theme.textColor2};
    flex: 1;
  }

  .auth-transaction__info-value {
    color: ${theme.textColor};
    flex: 1;
    text-align: right;
  }

  .auth-transaction__info-value .format-balance__front-part {
    overflow: hidden;
    white-space: nowrap;
    max-width: 160px;
    text-overflow: ellipsis;
    display: inline-block;
    vertical-align: top;
  }

  .auth-transaction__separator {
    padding-top: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid ${theme.menuItemsBorder};
  }

  .auth-transaction__info-value .value-separator {
    margin: 0 4px;
  }

  .auth-transaction__info-value .format-balance {
    display: inline-block;
  }

  .bridge__chain-selector-area {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    margin-bottom: 15px;
  }

  .bridge__chain-selector {
    flex: 1;
  }

  .bridge__chain-selector label {
    font-size: 15px;
    text-transform: none;
    color: ${theme.textColor};
    line-height: 26px;
    font-weight: 500;
  }

  .bridge__chain-swap {
    min-width: 40px;
    width: 40px;
    height: 40px;
    border-radius: 40%;
    border: 2px solid ${theme.buttonBorderColor};
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 24px 12px 0;
  }
`));
