// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BaseTxError, ResponseStakeExternal, ResponseStakeLedger, ResponseStakeQr, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { LedgerState } from '@subwallet/extension-base/signers/types';
import { InputWithLabel } from '@subwallet/extension-koni-ui/components';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { QrContext, QrContextState, QrStep } from '@subwallet/extension-koni-ui/contexts/QrContext';
import useGetFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/bonding/useGetFreeBalance';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import { useSignMode } from '@subwallet/extension-koni-ui/hooks/useSignMode';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { makeBondingLedger, makeBondingQr, submitBonding } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

const Spinner = React.lazy(() => import('@subwallet/extension-koni-ui/components/Spinner'));
const Identicon = React.lazy(() => import('@subwallet/extension-koni-ui/components/Identicon'));
const Button = React.lazy(() => import('@subwallet/extension-koni-ui/components/Button'));
const Modal = React.lazy(() => import('@subwallet/extension-koni-ui/components/Modal'));
const ReceiverInputAddress = React.lazy(() => import('@subwallet/extension-koni-ui/components/ReceiverInputAddress'));
const Tooltip = React.lazy(() => import('@subwallet/extension-koni-ui/components/Tooltip'));
const QrRequest = React.lazy(() => import('@subwallet/extension-koni-ui/components/Qr/QrRequest'));
const LedgerRequest = React.lazy(() => import('@subwallet/extension-koni-ui/components/Ledger/LedgerRequest'));

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
  bondedValidators: string[]
}

function BondingAuthTransaction ({ amount, balanceError, bondedValidators, className, fee, isBondedBefore, selectedNetwork, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, validatorInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const { handlerReject } = useRejectExternalRequest();

  const { clearExternalState, externalState: { externalId }, updateExternalState } = useContext(ExternalRequestContext);
  const { cleanQrState, updateQrState } = useContext(QrContext);

  const networkJson = useGetNetworkJson(selectedNetwork);
  const freeBalance = useGetFreeBalance(selectedNetwork);

  const balanceFormat = useMemo((): BalanceFormatType => {
    return [networkJson.decimals as number, networkJson.nativeToken as string, undefined];
  }, [networkJson]);
  const { currentAccount: { account }, networkMap } = useSelector((state: RootState) => state);

  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>('');
  const [errorArr, setErrorArr] = useState<string[]>([]);

  const signMode = useSignMode(account);

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(null);
  }, []);

  const hideConfirm = useCallback(async () => {
    if (!loading) {
      await handlerReject(externalId);

      setShowConfirm(false);
    }
  }, [handlerReject, loading, setShowConfirm, externalId]);

  const handleOnSubmit = useCallback(async () => {
    await submitBonding({
      networkKey: selectedNetwork,
      nominatorAddress: account?.address as string,
      amount,
      validatorInfo,
      password,
      isBondedBefore,
      bondedValidators
    }, (data) => {
      if (data.passwordError) {
        show(data.passwordError);
        setPasswordError(data.passwordError);
        setLoading(false);
      }

      if (balanceError && !data.passwordError) {
        setLoading(false);
        show('Your balance is too low to cover fees');

        return;
      }

      if (data.txError && data.txError) {
        show('Encountered an error, please try again.');
        setLoading(false);

        return;
      }

      if (data.status) {
        setLoading(false);

        if (data.status) {
          setIsTxSuccess(true);
          setShowConfirm(false);
          setShowResult(true);
          setExtrinsicHash(data.transactionHash as string);
        } else {
          setIsTxSuccess(false);
          setTxError('Error submitting transaction');
          setShowConfirm(false);
          setShowResult(true);
          setExtrinsicHash(data.transactionHash as string);
        }
      }
    });
  }, [account?.address, amount, balanceError, bondedValidators, isBondedBefore, password, selectedNetwork, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError, show, validatorInfo]);

  const handleConfirm = useCallback(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await handleOnSubmit();
    }, 10);
  }, [handleOnSubmit]);

  // External

  const handlerResponseError = useCallback((errors: BaseTxError[]) => {
    const errorMessage = errors.map((err) => err.message);

    setErrorArr(errorMessage);

    if (errorMessage && errorMessage.length) {
      setLoading(false);
    }
  }, []);

  const handlerCallbackResponseResult = useCallback((data: ResponseStakeExternal) => {
    if (balanceError && !data.passwordError) {
      setLoading(false);
      setErrorArr(['Your balance is too low to cover fees']);
      setIsTxSuccess(false);
      setTxError('Your balance is too low to cover fees');
      setShowConfirm(false);
      setShowResult(true);
      cleanQrState();

      return;
    }

    if (data.txError && data.status === undefined) {
      setErrorArr(['Encountered an error, please try again.']);
      setLoading(false);
      setIsTxSuccess(false);
      setTxError('Encountered an error, please try again.');
      setShowConfirm(false);
      setShowResult(false);
      cleanQrState();
      clearExternalState();

      return;
    }

    if (data.status !== undefined) {
      setLoading(false);

      if (data.status) {
        setIsTxSuccess(true);
        setShowConfirm(false);
        setShowResult(true);
        setExtrinsicHash(data.transactionHash as string);
      } else {
        setIsTxSuccess(false);
        setTxError('Error submitting transaction');
        setShowConfirm(false);
        setShowResult(true);
        setExtrinsicHash(data.transactionHash as string);
      }

      cleanQrState();
      clearExternalState();
    }
  }, [balanceError, cleanQrState, clearExternalState, setExtrinsicHash, setIsTxSuccess, setShowConfirm, setShowResult, setTxError]);

  // Qr

  const handlerCallbackResponseResultQr = useCallback((data: ResponseStakeQr) => {
    if (data.qrState) {
      const state: QrContextState = {
        ...data.qrState,
        step: QrStep.DISPLAY_PAYLOAD
      };

      setLoading(false);
      updateQrState(state);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    if (data.isBusy) {
      updateQrState({ step: QrStep.SENDING_TX });
      setLoading(true);
    }

    handlerCallbackResponseResult(data);
  }, [handlerCallbackResponseResult, updateExternalState, updateQrState]);

  const handlerOnSubmitQr = useCallback(() => {
    makeBondingQr({
      networkKey: selectedNetwork,
      nominatorAddress: account?.address as string,
      amount,
      validatorInfo,
      isBondedBefore,
      bondedValidators
    }, handlerCallbackResponseResultQr)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when makeBondingQr', e));
  }, [account?.address, amount, bondedValidators, handlerCallbackResponseResultQr, handlerResponseError, isBondedBefore, selectedNetwork, validatorInfo]);

  const handlerErrorQr = useCallback((error: Error) => {
    setErrorArr([error.message]);
  }, []);

  const handlerSubmitQr = useCallback(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      handlerOnSubmitQr();
    }, 10);
  }, [handlerOnSubmitQr]);

  // Ledger

  const handlerCallbackResponseResultLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void, data: ResponseStakeLedger) => {
    if (data.ledgerState) {
      handlerSignLedger(data.ledgerState);
    }

    if (data.externalState) {
      updateExternalState(data.externalState);
    }

    handlerCallbackResponseResult(data);
  }, [handlerCallbackResponseResult, updateExternalState]);

  const handlerSendLedgerSubstrate = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    const callback = (data: ResponseStakeExternal) => {
      handlerCallbackResponseResultLedger(handlerSignLedger, data);
    };

    makeBondingLedger({
      networkKey: selectedNetwork,
      nominatorAddress: account?.address as string,
      amount,
      validatorInfo,
      isBondedBefore,
      bondedValidators
    }, callback)
      .then(handlerResponseError)
      .catch((e) => console.log('There is problem when makeTransferNftQrSubstrate', e));
  }, [account?.address, amount, bondedValidators, handlerCallbackResponseResultLedger, handlerResponseError, isBondedBefore, selectedNetwork, validatorInfo]);

  const handlerSendLedger = useCallback((handlerSignLedger: (ledgerState: LedgerState) => void) => {
    if (loading) {
      return;
    }

    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(() => {
      const sendSubstrate = () => {
        handlerSendLedgerSubstrate(handlerSignLedger);
      };

      sendSubstrate();
    }, 10);
  }, [handlerSendLedgerSubstrate, loading]);

  const renderInfo = useCallback(() => {
    return (
      <>
        <div className={'selected-validator'}>Selected Validator</div>

        <div className={'validator-item-container'}>
          <div className={'validator-header'}>
            <Identicon
              className='identityIcon'
              genesisHash={networkJson.genesisHash}
              prefix={networkJson.ss58Format}
              size={20}
              value={validatorInfo.address}
            />

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
            <div
              className={'validator-expected-return'}
              data-for={`validator-return-tooltip-${validatorInfo.address}`}
              data-tip={true}
            >
              {validatorInfo.expectedReturn.toFixed(1)}%
            </div>
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
            <div className={'transaction-info-value'}>{amount} {networkJson.nativeToken}</div>
          </div>

          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Staking fee</div>
            <div className={'transaction-info-value'}>{fee}</div>
          </div>

          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Total</div>
            <div className={'transaction-info-value'}>{amount} {networkJson.nativeToken} + {fee}</div>
          </div>
        </div>
      </>
    );
  }, [account?.address, amount, balanceFormat, fee, freeBalance, networkJson, networkMap, selectedNetwork, validatorInfo]);

  const renderContent = useCallback(() => {
    switch (signMode) {
      case SIGN_MODE.QR:
        return (
          <div className='external-wrapper'>
            <QrRequest
              errorArr={errorArr}
              genesisHash={networkJson.genesisHash}
              handlerStart={handlerSubmitQr}
              isBusy={loading}
              onError={handlerErrorQr}
            >
              { renderInfo() }
            </QrRequest>
          </div>
        );
      case SIGN_MODE.LEDGER:
        return (
          <div className='external-wrapper'>
            <LedgerRequest
              accountMeta={account}
              errorArr={errorArr}
              genesisHash={networkJson.genesisHash}
              handlerSignLedger={handlerSendLedger}
              isBusy={loading}
              setBusy={setLoading}
              setErrorArr={setErrorArr}
            >
              { renderInfo() }
            </LedgerRequest>
          </div>
        );
      case SIGN_MODE.PASSWORD:
      default:
        return (
          <>
            { renderInfo() }

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
          </>
        );
    }
  }, [_onChangePass, account, errorArr, handleConfirm, handlerErrorQr, handlerSendLedger, handlerSubmitQr, hideConfirm, loading, networkJson.genesisHash, password, passwordError, renderInfo, signMode, t]);

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

        <div className={'bonding-auth-container'}>
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
              <div className={'transaction-info-value'}>{amount} {networkJson.nativeToken}</div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Staking fee</div>
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

  .external-wrapper {
    display: flex;
    flex: 1;
    flex-direction: column;
    margin: -15px -15px 0;
  }
`));
