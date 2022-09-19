// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DelegationItem } from '@subwallet/extension-base/background/KoniTypes';
import cloneLogo from '@subwallet/extension-koni-ui/assets/clone.svg';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import { ActionContext } from '@subwallet/extension-koni-ui/contexts';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useIsNetworkActive from '@subwallet/extension-koni-ui/hooks/screen/home/useIsNetworkActive';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { checkTuringStakeCompounding, getStakeDelegationInfo, getTuringCancelStakeCompoundTxInfo, getTuringStakeCompoundTxInfo } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { formatLocaleNumber } from '@subwallet/extension-koni-ui/util/formatNumber';
import moment from 'moment';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

const StakeAuthCompoundRequest = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/components/StakeAuthCompoundRequest'));
const StakeCompoundResult = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/components/StakeCompoundResult'));
const StakeAuthCancelCompoundRequest = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/components/StakeAuthCancelCompoundRequest'));
const ValidatorsDropdown = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Bonding/components/ValidatorsDropdown'));
const CancelStakeCompoundResult = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/components/CancelStakeCompoundResult'));

interface Props extends ThemeProps {
  className?: string;
}

function filterValidDelegations (delegations: DelegationItem[]) {
  const filteredDelegations: DelegationItem[] = [];

  delegations.forEach((item) => {
    if (parseFloat(item.amount) > 0) {
      filteredDelegations.push(item);
    }
  });

  return filteredDelegations;
}

const TURING_ED = 0.01; // TODO: can be done better, fix this upon new architecture

function StakeCompoundSubmitTransaction ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showResult, setShowResult] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [delegations, setDelegations] = useState<DelegationItem[] | undefined>(undefined);
  const [selectedCollator, setSelectedCollator] = useState<string>('');
  const [bondedAmount, setBondedAmount] = useState('');
  const [accountMinimum, setAccountMinimum] = useState('0');
  const [showCompoundingAuth, setShowCompoundingAuth] = useState(false);
  const [showCancelCompoundingAuth, setShowCancelCompoundingAuth] = useState(false);
  const { currentAccount: { account }, stakeCompoundParams: { selectedAccount, selectedNetwork } } = useSelector((state: RootState) => state);

  const [hasCompoundRequest, setHasCompoundRequest] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState('');
  const [currentFrequency, setCurrentFrequency] = useState(-1);
  const [currentAccountMinimum, setCurrentAccountMinimum] = useState(-1);

  const [balanceError, setBalanceError] = useState(false);
  const [fee, setFee] = useState('');
  const [optimalFrequency, setOptimalFrequency] = useState('');
  const [initTime, setInitTime] = useState(-1);

  const navigate = useContext(ActionContext);
  const [loading, setLoading] = useState(false);
  const [isReadySubmit, setIsReadySubmit] = useState(false);
  const [isClickNext, setIsClickNext] = useState(false);

  const [extrinsicHash, setExtrinsicHash] = useState('');
  const [isTxSuccess, setIsTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');
  const { show } = useToast();

  const isNetworkActive = useIsNetworkActive(selectedNetwork);

  useEffect(() => {
    if (!isNetworkActive) {
      navigate('/');
    }
  }, [isNetworkActive, navigate]);

  useEffect(() => {
    if (account?.address !== selectedAccount) {
      navigate('/');
    }
  }, [account?.address, navigate, selectedAccount]);

  const networkJson = useGetNetworkJson(selectedNetwork);

  useEffect(() => {
    getStakeDelegationInfo({
      address: selectedAccount,
      networkKey: selectedNetwork
    }).then((result) => {
      const filteredDelegations = filterValidDelegations(result);

      setDelegations(filteredDelegations);
      setSelectedCollator(filteredDelegations[0].owner);
      setBondedAmount(filteredDelegations[0].amount);
    }).catch(console.error);

    return () => {
      setDelegations(undefined);
      setSelectedCollator('');
      setBondedAmount('');
    };
  }, [selectedAccount, selectedNetwork]);

  useEffect(() => {
    if (selectedCollator !== '') {
      checkTuringStakeCompounding({
        address: selectedAccount,
        collatorAddress: selectedCollator,
        networkKey: selectedNetwork
      })
        .then((result) => {
          setCurrentAccountMinimum(result.accountMinimum);
          setCurrentFrequency(result.frequency);
          setHasCompoundRequest(result.exist);
          setCurrentTaskId(result.taskId);
          setIsDataReady(true);
        })
        .catch(console.error);
    }
  }, [selectedAccount, selectedCollator, selectedNetwork]);

  useEffect(() => {
    if (!isClickNext) {
      const _accountMinimum = parseFloat(accountMinimum);

      if (_accountMinimum > TURING_ED) {
        setIsReadySubmit(true);
      } else {
        setIsReadySubmit(false);

        if (_accountMinimum > 0) {
          show(`The threshold must be larger than ${TURING_ED}`);
        }
      }
    }
  }, [accountMinimum, isClickNext, show]);

  const handleSelectValidator = useCallback((val: string) => {
    if (delegations) {
      for (const item of delegations) {
        if (item.owner === val) {
          setSelectedCollator(val);
          setBondedAmount(item.amount);
          break;
        }
      }
    }
  }, [delegations]);

  const handleUpdateAccountMinimum = useCallback((value: BN | string) => {
    if (!value) {
      return;
    }

    let parsedValue;

    if (value instanceof BN) {
      parsedValue = parseFloat(value.toString()) / (10 ** (networkJson.decimals as number));
    } else {
      parsedValue = parseFloat(value) / (10 ** (networkJson.decimals as number));
    }

    setAccountMinimum(parsedValue.toString());
  }, [networkJson.decimals]);

  const handleClickCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleConfirm = useCallback(() => {
    setLoading(true);

    if (!hasCompoundRequest) {
      getTuringStakeCompoundTxInfo({
        networkKey: selectedNetwork,
        address: selectedAccount,
        accountMinimum,
        collatorAddress: selectedCollator,
        bondedAmount
      }).then((result) => {
        setFee(result.txInfo.fee);
        setBalanceError(result.txInfo.balanceError);
        setOptimalFrequency(result.optimalFrequency);
        setInitTime(result.initTime);

        setShowCompoundingAuth(true);
        setLoading(false);
        setIsClickNext(true);
      }).catch(console.error);
    } else {
      getTuringCancelStakeCompoundTxInfo({
        taskId: currentTaskId,
        networkKey: selectedNetwork,
        address: selectedAccount
      })
        .then((result) => {
          setLoading(false);
          setShowCancelCompoundingAuth(true);
          setFee(result.fee);
          setBalanceError(result.balanceError);
        })
        .catch(console.error);
    }
  }, [accountMinimum, bondedAmount, hasCompoundRequest, selectedAccount, selectedCollator, selectedNetwork, currentTaskId]);

  const handleRevertClickNext = useCallback(() => {
    setIsClickNext(false);
  }, []);

  const handleResend = useCallback(() => {
    setExtrinsicHash('');
    setIsTxSuccess(false);
    setTxError('');
    setShowResult(false);
    setShowCompoundingAuth(true);
    setIsClickNext(false);
  }, []);

  const isNextButtonDisabled = useCallback(() => {
    if (!hasCompoundRequest) {
      return !isReadySubmit;
    }

    return false;
  }, [hasCompoundRequest, isReadySubmit]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentTaskId).then().catch(console.error);
    show('Copied');
  }, [currentTaskId, show]);

  return (
    <div className={className}>
      <Header
        isShowNetworkSelect={false}
        showCancelButton={false}
        showSubHeader
        subHeaderName={t<string>('Stake compounding')}
      />

      {!showResult && <div>
        {
          isDataReady
            ? <div className={'stake-compound-submit-container'}>
              <InputAddress
                autoPrefill={false}
                className={'receive-input-address'}
                defaultValue={selectedAccount}
                help={t<string>('The account which you will compound the stake')}
                isDisabled={true}
                isSetDefaultValue={true}
                label={t<string>('Compound the stake from account')}
                networkPrefix={networkJson.ss58Format}
                type='allPlus'
                withEllipsis
              />

              {
                delegations && <ValidatorsDropdown
                  delegations={delegations}
                  handleSelectValidator={handleSelectValidator}
                  label={'Select a collator'}
                />
              }

              {
                !hasCompoundRequest
                  ? <div className={'stake-compound-input'}>
                    <InputBalance
                      autoFocus
                      className={'stake-compound-amount-input'}
                      decimals={networkJson.decimals}
                      help={'The minimum balance that will be kept in your account'}
                      isError={false}
                      label={t<string>('Compounding threshold')}
                      onChange={handleUpdateAccountMinimum}
                      placeholder={'0'}
                      siDecimals={networkJson.decimals}
                      siSymbol={networkJson.nativeToken}
                    />
                  </div>
                  : <div className={'transaction-info-container'}>
                    <div className={'transaction-info-row'}>
                      <div className={'transaction-info-title'}>Task Id</div>
                      <div
                        className={'transaction-info-value task-id-container'}
                        onClick={handleCopy}
                      >
                        {toShort(currentTaskId)}
                        <img
                          alt='copy'
                          className='stake_compound-copy-btn'
                          src={cloneLogo}
                        />
                      </div>
                    </div>
                    <div className={'transaction-info-row'}>
                      <div className={'transaction-info-title'}>Compounding threshold</div>
                      <div className={'transaction-info-value'}>{formatLocaleNumber(currentAccountMinimum, 4)} TUR</div>
                    </div>
                    <div className={'transaction-info-row'}>
                      <div className={'transaction-info-title'}>Optimal compounding time</div>
                      <div className={'transaction-info-value'}>{moment.duration(currentFrequency, 'seconds').humanize()}</div>
                    </div>
                  </div>
              }

              <div className='stake-compound__separator' />

              <div className={'stake-compound-btn-container'}>
                <Button
                  className={'stake-compound-cancel-button'}
                  isDisabled={loading}
                  onClick={handleClickCancel}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={isNextButtonDisabled()} // the latter is for parachains
                  onClick={handleConfirm}
                >
                  {
                    loading
                      ? <Spinner />
                      : <span>{hasCompoundRequest ? 'Cancel task' : 'Next'}</span>
                  }
                </Button>
              </div>
            </div>
            : <Spinner className={'container-spinner'} />
        }
      </div>}

      {
        !hasCompoundRequest
          ? <div>
            {showCompoundingAuth && !showResult &&
              <StakeAuthCompoundRequest
                accountMinimum={accountMinimum}
                address={selectedAccount}
                balanceError={balanceError}
                bondedAmount={bondedAmount}
                fee={fee}
                handleRevertClickNext={handleRevertClickNext}
                initTime={initTime}
                networkKey={selectedNetwork}
                optimalTime={optimalFrequency}
                selectedCollator={selectedCollator}
                setExtrinsicHash={setExtrinsicHash}
                setIsTxSuccess={setIsTxSuccess}
                setShowAuth={setShowCompoundingAuth}
                setShowResult={setShowResult}
                setTxError={setTxError}
              />
            }

            {!showCompoundingAuth && showResult &&
              <StakeCompoundResult
                backToHome={handleClickCancel}
                extrinsicHash={extrinsicHash}
                handleResend={handleResend}
                isTxSuccess={isTxSuccess}
                networkKey={selectedNetwork}
                txError={txError}
              />
            }
          </div>
          : <div>
            {showCancelCompoundingAuth && !showResult &&
              <StakeAuthCancelCompoundRequest
                address={selectedAccount}
                balanceError={balanceError}
                fee={fee}
                networkKey={selectedNetwork}
                setExtrinsicHash={setExtrinsicHash}
                setIsTxSuccess={setIsTxSuccess}
                setShowAuth={setShowCancelCompoundingAuth}
                setShowResult={setShowResult}
                setTxError={setTxError}
                taskId={currentTaskId}
              />
            }

            {!showCancelCompoundingAuth && showResult &&
              <CancelStakeCompoundResult
                backToHome={handleClickCancel}
                extrinsicHash={extrinsicHash}
                handleResend={handleResend}
                isTxSuccess={isTxSuccess}
                networkKey={selectedNetwork}
                txError={txError}
              />
            }
          </div>
      }
    </div>
  );
}

export default React.memo(styled(StakeCompoundSubmitTransaction)(({ theme }: Props) => `
  .stake_compound-copy-btn {
    margin-left: 5px;
  }

  .task-id-container {
    display: flex;
    align-items: center;
    cursor: pointer;
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

  .stake-compound-amount-input {
    margin-top: 15px;
  }

  .stake-compound-btn-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .stake-compound-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .stake-compound__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .stake-compound__separator {
    margin-top: 30px;
    margin-bottom: 30px;
  }

  .container-spinner {
    height: 65px;
    width: 65px;
  }

  .stake-compound-submit-container {
    overflow-y: scroll;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 10px;
  }

  .stake-compound-input {
    margin-top: 20px;
  }
`));
