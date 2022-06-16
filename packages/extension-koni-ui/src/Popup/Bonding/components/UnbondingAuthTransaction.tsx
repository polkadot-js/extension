// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InputWithLabel } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import useGetFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/bonding/useGetFreeBalance';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  amount: number,
  className?: string,
  setShowConfirm: (val: boolean) => void,
  selectedNetwork: string,
  fee: string,
  balanceError: boolean,
  setShowResult: (val: boolean) => void,
  setExtrinsicHash: (val: string) => void,
  setIsTxSuccess: (val: boolean) => void,
  setTxError: (val: string) => void
}

function BondingAuthTransaction ({ amount, balanceError, className, fee, selectedNetwork, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const networkJson = useGetNetworkJson(selectedNetwork);
  const { currentAccount: { account } } = useSelector((state: RootState) => state);

  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>('');
  const { show } = useToast();

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(null);
  }, []);

  const hideConfirm = useCallback(() => {
    if (!loading) {
      setShowConfirm(false);
    }
  }, [loading, setShowConfirm]);

  const handleOnSubmit = useCallback(async () => {
    console.log('submit');
  }, []);

  const handleConfirm = useCallback(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await handleOnSubmit();
    }, 10);
  }, [handleOnSubmit]);

  return (
    <div className={className}>
      <Modal>
        <div className={'header-confirm'}>
          <div /> {/* for alignment */}
          <div
            className={'header-title-confirm'}
          >
            Authorize transaction
          </div>
          <div
            className={'close-button-confirm'}
            onClick={hideConfirm}
          >
            x
          </div>
        </div>

        <div className={'bonding-auth-container'}>
          <InputAddress
            autoPrefill={false}
            className={'receive-input-address'}
            defaultValue={account?.address}
            help={t<string>('The account which you will unstake')}
            isDisabled={true}
            isSetDefaultValue={true}
            label={t<string>('Unstake from account')}
            networkPrefix={networkJson.ss58Format}
            type='allPlus'
            withEllipsis
          />

          <div className={'transaction-info-container'}>
            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Unstaking amount</div>
              <div className={'transaction-info-value'}>{amount} {networkJson.nativeToken}</div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Unstaking fee</div>
              <div className={'transaction-info-value'}>{fee}</div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Total</div>
              <div className={'transaction-info-value'}>{amount} {networkJson.nativeToken} + {fee}</div>
            </div>
          </div>

          <div className='bonding-auth__separator' />

          <InputWithLabel
            isError={passwordError !== null}
            label={t<string>('Unlock account with password')}
            onChange={_onChangePass}
            type='password'
            value={password}
          />

          <div className={'bonding-auth-btn-container'}>
            <Button
              className={'bonding-auth-cancel-button'}
              isDisabled={loading}
              onClick={hideConfirm}
            >
              Reject
            </Button>
            <Button
              isDisabled={password === ''}
              onClick={handleConfirm}
            >
              {
                loading
                  ? <Spinner />
                  : <span>Confirm</span>
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(BondingAuthTransaction)(({ theme }: Props) => `
  .bonding-auth-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .bonding-auth-btn-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .bonding-auth__separator {
    margin-top: 30px;
    margin-bottom: 18px;
  }

  .bonding-auth__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .transaction-info-container {
    margin-top: 20px;
    width: 100%;
  }

  .transaction-info-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .transaction-info-title {
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
  }

  .transaction-info-value {
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
  }

  .selected-validator {
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    margin-top: 5px;
  }

  .bonding-auth-container {
    padding-left: 15px;
    padding-right: 15px;
  }

  .validator-expected-return {
    font-size: 14px;
    color: ${theme.textColor3};
  }

  .validator-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .validator-header {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .identityIcon {
    border: 2px solid ${theme.checkDotColor};
  }
  .validator-item-container {
    margin-top: 10px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }

  .close-button-confirm {
    font-size: 20px;
    cursor: pointer;
  }

  .header-title-confirm {
    width: 85%;
    text-align: center;
  }

  .header-confirm {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 24px;
    font-weight: 500;
    line-height: 36px;
    font-style: normal;
    box-shadow: ${theme.headerBoxShadow};
    padding-top: 20px;
    padding-bottom: 20px;
    padding-left: 15px;
    padding-right: 15px;
  }

  .close-button-confirm {
    font-size: 20px;
    cursor: pointer;
  }

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
    border: 1px solid ${theme.extensionBorder};
  }
`));
