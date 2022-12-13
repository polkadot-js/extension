// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { UnbondingSubmitParams } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceVal } from '@subwallet/extension-koni-ui/components/Balance';
import FeeValue from '@subwallet/extension-koni-ui/components/Balance/FeeValue';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import SigningRequest from '@subwallet/extension-koni-ui/components/Signing/SigningRequest';
import { InternalRequestContext } from '@subwallet/extension-koni-ui/contexts/InternalRequestContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { makeUnBondingLedger, makeUnBondingQr, submitUnbonding } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useMemo } from 'react';
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
  setTxError: (val: string) => void,
  unbondAll: boolean,
  selectedValidator: string,
  handleRevertClickNext: () => void
}

function UnbondingAuthTransaction ({ amount, balanceError, className, fee, handleRevertClickNext, selectedNetwork, selectedValidator, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, theme, unbondAll }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const { handlerReject } = useRejectExternalRequest();

  const { externalState: { externalId } } = useContext(InternalRequestContext);
  const { signingState: { isBusy } } = useContext(SigningContext);

  const networkJson = useGetNetworkJson(selectedNetwork);
  const { currentAccount: { account } } = useSelector((state: RootState) => state);

  const params = useMemo((): UnbondingSubmitParams => ({
    networkKey: selectedNetwork,
    address: account?.address as string,
    amount: amount,
    unstakeAll: unbondAll,
    validatorAddress: selectedValidator
  }), [account?.address, amount, selectedNetwork, selectedValidator, unbondAll]);

  const hideConfirm = useCallback(async () => {
    if (!isBusy) {
      await handlerReject(externalId);

      handleRevertClickNext();
      setShowConfirm(false);
    }
  }, [externalId, handleRevertClickNext, handlerReject, isBusy, setShowConfirm]);

  const onFail = useCallback((errors: string[], extrinsicHash?: string) => {
    setIsTxSuccess(false);
    setTxError(errors[0]);
    setShowConfirm(false);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash || '');
  }, [setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError]);

  const onSuccess = useCallback((extrinsicHash: string) => {
    setIsTxSuccess(true);
    setShowConfirm(false);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash);
  }, [setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult]);

  return (
    <div className={className}>
      <Modal>
        <div className={'header-confirm'}>
          <div className={'header-alignment'} /> {/* for alignment */}
          <div
            className={'header-title-confirm'}
          >
            Authorize transaction
          </div>
          <div
            className={'close-button-confirm header-alignment'}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={hideConfirm}
          >
            Cancel
          </div>
        </div>

        <SigningRequest
          account={account}
          balanceError={balanceError}
          className='signing-request-wrapper'
          handleSignLedger={makeUnBondingLedger}
          handleSignPassword={submitUnbonding}
          handleSignQr={makeUnBondingQr}
          hideConfirm={hideConfirm}
          message={'There is problem when unbonding'}
          network={networkJson}
          onFail={onFail}
          onSuccess={onSuccess}
          params={params}
        >
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
              <div className={'transaction-info-value'}>
                <BalanceVal
                  newRule={false}
                  symbol={networkJson.nativeToken}
                  value={amount}
                  withSymbol={true}
                />
              </div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Unstaking fee</div>
              <div className={'transaction-info-value'}>
                <FeeValue feeString={fee} />
              </div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Total</div>
              <div className={'transaction-info-value'}>
                <BalanceVal
                  newRule={false}
                  symbol={networkJson.nativeToken}
                  value={amount}
                  withSymbol={true}
                />
                &nbsp;+&nbsp;
                <FeeValue feeString={fee} />
              </div>
            </div>
          </div>
        </SigningRequest>
      </Modal>
    </div>
  );
}

export default React.memo(styled(UnbondingAuthTransaction)(({ theme }: Props) => `
  .bonding-auth-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .signing-request-wrapper {
    overflow: auto;
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
    display: flex;
    flex-direction: column;
    flex: 1;
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
    text-align: right;
    font-size: 14px;
    cursor: pointer;
    color: ${theme.textColor3}
  }

  .header-alignment {
    width: 20%;
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
