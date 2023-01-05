// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BondingSubmitParams, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceVal } from '@subwallet/extension-koni-ui/components/Balance';
import FeeValue from '@subwallet/extension-koni-ui/components/Balance/FeeValue';
import SigningRequest from '@subwallet/extension-koni-ui/components/Signing/SigningRequest';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import { InternalRequestContext } from '@subwallet/extension-koni-ui/contexts/InternalRequestContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useGetFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/bonding/useGetFreeBalance';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import { makeBondingLedger, makeBondingQr, submitBonding } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

const Identicon = React.lazy(() => import('@subwallet/extension-koni-ui/components/Identicon'));
const Modal = React.lazy(() => import('@subwallet/extension-koni-ui/components/Modal'));
const ReceiverInputAddress = React.lazy(() => import('@subwallet/extension-koni-ui/components/ReceiverInputAddress'));
const Tooltip = React.lazy(() => import('@subwallet/extension-koni-ui/components/Tooltip'));

interface Props extends ThemeProps {
  amount: number,
  className?: string,
  setShowConfirm: (val: boolean) => void,
  validatorInfo: ValidatorInfo,
  selectedNetwork: string,
  fee: string,
  balanceError: boolean,
  setShowResult: (val: boolean) => void,
  setExtrinsicHash: (val: string) => void,
  setIsTxSuccess: (val: boolean) => void,
  setTxError: (val: string) => void,
  isBondedBefore: boolean,
  bondedValidators: string[],
  handleRevertClickNext: () => void
}

function BondingAuthTransaction ({ amount, balanceError, bondedValidators, className, fee, handleRevertClickNext, isBondedBefore, selectedNetwork, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, validatorInfo }: Props): React.ReactElement<Props> {
  const { handlerReject } = useRejectExternalRequest();

  const { externalState: { externalId } } = useContext(InternalRequestContext);
  const { signingState: { isBusy } } = useContext(SigningContext);

  const networkJson = useGetNetworkJson(selectedNetwork);
  const freeBalance = useGetFreeBalance(selectedNetwork);

  const balanceFormat = useMemo((): BalanceFormatType => {
    return [networkJson.decimals as number, networkJson.nativeToken as string, undefined];
  }, [networkJson]);
  const { currentAccount: { account }, networkMap } = useSelector((state: RootState) => state);

  const params = useMemo((): BondingSubmitParams => ({
    networkKey: selectedNetwork,
    nominatorAddress: account?.address as string,
    amount: amount,
    validatorInfo: validatorInfo,
    isBondedBefore: isBondedBefore,
    bondedValidators: bondedValidators
  }), [account?.address, amount, bondedValidators, isBondedBefore, selectedNetwork, validatorInfo]);

  const hideConfirm = useCallback(async () => {
    if (!isBusy) {
      await handlerReject(externalId);

      handleRevertClickNext();
      setShowConfirm(false);
    }
  }, [isBusy, handlerReject, externalId, handleRevertClickNext, setShowConfirm]);

  const onFail = useCallback((errors: string[], extrinsicHash?: string) => {
    setIsTxSuccess(false);
    setShowConfirm(false);
    setShowResult(true);
    setTxError(errors[0]);
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
          handleSignLedger={makeBondingLedger}
          handleSignPassword={submitBonding}
          handleSignQr={makeBondingQr}
          hideConfirm={hideConfirm}
          message={'There is problem when bonding'}
          network={networkJson}
          onFail={onFail}
          onSuccess={onSuccess}
          params={params}
        >
          <div className={'selected-validator'}>Selected Validator</div>
          <div className={'validator-item-container'}>
            <div className={'validator-header'}>
              {
                validatorInfo.icon
                  ? <img
                    className='imgIcon'
                    height={28}
                    src={validatorInfo.icon}
                    width={28}
                  />
                  : <Identicon
                    className='identityIcon'
                    genesisHash={networkJson.genesisHash}
                    iconTheme={isEthereumAddress(validatorInfo.address) ? 'ethereum' : 'substrate'}
                    prefix={networkJson.ss58Format}
                    size={20}
                    value={validatorInfo.address}
                  />
              }

              <div
                data-for={`identity-tooltip-${validatorInfo.address}`}
                data-tip={true}
              >
                {validatorInfo.identity ? validatorInfo.identity : toShort(validatorInfo.address)}
              </div>
              {
                validatorInfo.identity && <Tooltip
                  place={'top'}
                  text={toShort(validatorInfo.address)}
                  trigger={`identity-tooltip-${validatorInfo.address}`}
                />
              }
              {
                validatorInfo.isVerified && <FontAwesomeIcon
                  className={'validator-verified'}
                  data-for={`verify-tooltip-${validatorInfo.address}`}
                  data-tip={true}
                  icon={faCircleCheck}
                />
              }
              {
                validatorInfo.isVerified && <Tooltip
                  place={'top'}
                  text={'Verified'}
                  trigger={`verify-tooltip-${validatorInfo.address}`}
                />
              }
            </div>
            <div className={'validator-footer'}>
              {
                validatorInfo.expectedReturn > 0 && <div
                  className={'validator-expected-return'}
                  data-for={`validator-return-tooltip-${validatorInfo.address}`}
                  data-tip={true}
                >
                  {validatorInfo.expectedReturn.toFixed(1)}%
                </div>
              }
              <Tooltip
                place={'top'}
                text={'Expected return'}
                trigger={`validator-return-tooltip-${validatorInfo.address}`}
              />
            </div>
          </div>

          <ReceiverInputAddress
            balance={freeBalance}
            balanceFormat={balanceFormat}
            className={'auth-bonding__input-address'}
            defaultAddress={account?.address}
            inputAddressHelp={'The account which you will stake with'}
            inputAddressLabel={'Stake with account'}
            isDisabled={true}
            isSetDefaultValue={true}
            networkKey={selectedNetwork}
            networkMap={networkMap}
          />

          <div className={'transaction-info-container'}>
            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Staking amount</div>
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
              <div className={'transaction-info-title'}>Staking fee</div>
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

export default React.memo(styled(BondingAuthTransaction)(({ theme }: Props) => `
  .signing-request-wrapper {
    overflow: auto;
  }

  .transaction-info-container {
    margin-top: 10px;
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
