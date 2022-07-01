// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCircleCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import NeutralQuestion from '@subwallet/extension-koni-ui/assets/NeutralQuestion.svg';
import { ActionContext } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import ReceiverInputAddress from '@subwallet/extension-koni-ui/components/ReceiverInputAddress';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import { BalanceFormatType } from '@subwallet/extension-koni-ui/components/types';
import useGetFreeBalance from '@subwallet/extension-koni-ui/hooks/screen/bonding/useGetFreeBalance';
import useIsSufficientBalance from '@subwallet/extension-koni-ui/hooks/screen/bonding/useIsSufficientBalance';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getBondingTxInfo } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import BondDurationDropdown from '@subwallet/extension-koni-ui/Popup/Bonding/components/BondDurationDropdown';
import BondingAuthTransaction from '@subwallet/extension-koni-ui/Popup/Bonding/components/BondingAuthTransaction';
import BondingResult from '@subwallet/extension-koni-ui/Popup/Bonding/components/BondingResult';
import { BOND_DURATION_OPTIONS, getStakeUnit, parseBalanceString } from '@subwallet/extension-koni-ui/Popup/Bonding/utils';
import { RootState, store } from '@subwallet/extension-koni-ui/stores';
import { BondingParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  className?: string;
}

function BondingSubmitTransaction ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { bondingParams, currentAccount: { account }, networkMap } = useSelector((state: RootState) => state);
  const selectedNetwork = bondingParams.selectedNetwork as string;
  const validatorInfo = bondingParams.selectedValidator as ValidatorInfo;
  const isBondedBefore = bondingParams.isBondedBefore as boolean;
  const bondedValidators = bondingParams.bondedValidators as string[];
  const maxNominatorPerValidator = bondingParams.maxNominatorPerValidator as number;

  const networkJson = useGetNetworkJson(selectedNetwork);
  const [showDetail, setShowDetail] = useState(false);
  const [amount, setAmount] = useState(-1);
  const freeBalance = useGetFreeBalance(selectedNetwork);
  const balanceFormat: BalanceFormatType = [networkJson.decimals as number, networkJson.nativeToken as string, undefined];
  const [isReadySubmit, setIsReadySubmit] = useState(false);
  const { show } = useToast();

  const [showAuth, setShowAuth] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isClickNext, setIsClickNext] = useState(false);
  const unit = getStakeUnit(selectedNetwork, networkJson);

  const [fee, setFee] = useState('');
  const [balanceError, setBalanceError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extrinsicHash, setExtrinsicHash] = useState('');
  const [isTxSuccess, setIsTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');
  const [lockPeriod, setLockPeriod] = useState(0);

  const isOversubscribed = validatorInfo.nominatorCount >= maxNominatorPerValidator;
  const isSufficientFund = useIsSufficientBalance(selectedNetwork, validatorInfo.minBond);
  const hasOwnStake = validatorInfo.ownStake > 0;
  const isMaxCommission = validatorInfo.commission === 100;
  const isMinBondZero = validatorInfo.minBond === 0;

  const navigate = useContext(ActionContext);
  const _height = window.innerHeight > 600 ? 650 : 450;

  useEffect(() => {
    if (!isClickNext) {
      const parsedFreeBalance = parseFloat(freeBalance) / (10 ** (networkJson.decimals as number));

      if (amount >= validatorInfo.minBond && amount <= parsedFreeBalance) {
        setIsReadySubmit(true);
      } else {
        setIsReadySubmit(false);

        if (amount > parsedFreeBalance) {
          show('You do not have enough balance');
        } else if (amount >= 0) {
          show(`You must stake at least ${validatorInfo.minBond} ${networkJson.nativeToken as string}`);
        }
      }
    }
  }, [amount, freeBalance, isClickNext, networkJson.decimals, networkJson.nativeToken, show, showAuth, showResult, validatorInfo.minBond]);

  const handleOnClick = useCallback(() => {
    setShowDetail(!showDetail);
  }, [showDetail]);

  const handleResend = useCallback(() => {
    setExtrinsicHash('');
    setIsTxSuccess(false);
    setTxError('');
    setShowResult(false);
    setShowAuth(true);
    setIsClickNext(false);
  }, []);

  const goHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleClickCancel = useCallback(() => {
    store.dispatch({ type: 'bondingParams/update', payload: { selectedNetwork, selectedValidator: validatorInfo, maxNominatorPerValidator: null } as BondingParams });
    navigate('/account/select-bonding-validator');
  }, [navigate, selectedNetwork, validatorInfo]);

  const handleChangeAmount = useCallback((value: BN | string) => {
    let parsedValue;

    if (value instanceof BN) {
      parsedValue = parseFloat(value.toString()) / (10 ** (networkJson.decimals as number));
    } else {
      parsedValue = parseFloat(value) / (10 ** (networkJson.decimals as number));
    }

    if (isNaN(parsedValue)) {
      setAmount(-1);
    } else {
      setAmount(parsedValue);
    }
  }, [networkJson.decimals]);

  const handleConfirm = useCallback(() => {
    setLoading(true);
    getBondingTxInfo({
      networkKey: selectedNetwork,
      nominatorAddress: account?.address as string,
      amount,
      validatorInfo,
      isBondedBefore,
      bondedValidators,
      lockPeriod
    })
      .then((resp) => {
        setLoading(false);
        setIsClickNext(true);
        setFee(resp.fee);
        setBalanceError(resp.balanceError);
        setShowAuth(true);
        setShowResult(false);
      })
      .catch(console.error);
  }, [account?.address, amount, bondedValidators, isBondedBefore, lockPeriod, selectedNetwork, validatorInfo]);

  const getMinBondTooltipText = useCallback(() => {
    if (isMinBondZero) {
      return 'Invalid minimum stake';
    }

    return `Your free balance needs to be at least ${parseBalanceString(validatorInfo.minBond, networkJson.nativeToken as string)}.`;
  }, [isMinBondZero, networkJson.nativeToken, validatorInfo.minBond]);

  const handleChangeLockingPeriod = useCallback((value: string) => {
    setLockPeriod(parseInt(value));
  }, []);

  const handleGetValidatorDetail = useCallback(() => {
    if (['astar', 'shiden', 'shibuya'].includes(selectedNetwork)) {
      return (
        <div className={'validator-detail-container'}>
          <div className={'validator-att-container'}>
            <div className={'validator-att'}>
              <div className={'validator-att-title'}>Total stake</div>
              <div className={'validator-att-value'}>{parseBalanceString(validatorInfo.totalStake, unit)}</div>
            </div>

            <div className={'validator-att'}>
              <div className={'validator-att-title'}>
                Stakers count
                {
                  isOversubscribed && <FontAwesomeIcon
                    className={'error-tooltip'}
                    data-for={`validator-oversubscribed-tooltip-${selectedNetwork}`}
                    data-tip={true}
                    icon={faCircleExclamation}
                  />
                }
                <Tooltip
                  place={'top'}
                  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                  text={'Oversubscribed. You will not be able to receive reward.'}
                  trigger={`validator-oversubscribed-tooltip-${selectedNetwork}`}
                />
              </div>
              <div className={`${!isOversubscribed ? 'validator-att-value' : 'validator-att-value-error'}`}>{validatorInfo.nominatorCount}</div>
            </div>
          </div>

          <div className={'validator-att-container'}>
            <div className={'validator-att'}>
              <div className={'validator-att-title'}>
                Minimum stake
                {
                  !isSufficientFund && <FontAwesomeIcon
                    className={'error-tooltip'}
                    data-for={`insufficient-fund-tooltip-${selectedNetwork}`}
                    data-tip={true}
                    icon={faCircleExclamation}
                  />
                }
                <Tooltip
                  place={'top'}
                  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                  text={getMinBondTooltipText()}
                  trigger={`insufficient-fund-tooltip-${selectedNetwork}`}
                />
              </div>
              <div className={`${isSufficientFund ? 'validator-att-value' : 'validator-att-value-error'}`}>{parseBalanceString(validatorInfo.minBond, networkJson.nativeToken as string)}</div>
            </div>
          </div>

          {
            validatorInfo.commission !== undefined && <div className={'validator-att-container'}>
              <div className={'validator-att'}>
                <div className={'validator-att-title'}>
                  Commission
                  {
                    isMaxCommission && <FontAwesomeIcon
                      className={'error-tooltip'}
                      data-for={`commission-max-tooltip-${selectedNetwork}`}
                      data-tip={true}
                      icon={faCircleExclamation}
                    />
                  }
                  <Tooltip
                    place={'top'}
                    text={'You will not be able to receive reward.'}
                    trigger={`commission-max-tooltip-${selectedNetwork}`}
                  />
                </div>
                <div className={`${!isMaxCommission ? 'validator-att-value' : 'validator-att-value-error'}`}>{validatorInfo.commission}%</div>
              </div>
            </div>
          }
        </div>
      );
    } else {
      return (
        <div className={'validator-detail-container'}>
          <div className={'validator-att-container'}>
            <div className={'validator-att'}>
              <div className={'validator-att-title'}>Total stake</div>
              <div className={'validator-att-value'}>{parseBalanceString(validatorInfo.totalStake, unit)}</div>
            </div>

            <div className={'validator-att'}>
              <div className={'validator-att-title'}>
                Own stake
                {
                  !hasOwnStake && <img
                    data-for={`validator-has-no-stake-tooltip-${selectedNetwork}`}
                    data-tip={true}
                    height={15}
                    src={NeutralQuestion}
                    width={15}
                  />
                }
                <Tooltip
                  place={'top'}
                  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                  text={'Validators should have their own stake.'}
                  trigger={`validator-has-no-stake-tooltip-${selectedNetwork}`}
                />
              </div>
              <div className={`${hasOwnStake ? 'validator-att-value' : 'validator-att-value-warning'}`}>{parseBalanceString(validatorInfo.ownStake, unit)}</div>
            </div>
          </div>

          <div className={'validator-att-container'}>
            <div className={'validator-att'}>
              <div className={'validator-att-title'}>
                Nominators count
                {
                  isOversubscribed && <img
                    data-for={`validator-oversubscribed-tooltip-${selectedNetwork}`}
                    data-tip={true}
                    height={15}
                    src={NeutralQuestion}
                    width={15}
                  />
                }
                <Tooltip
                  place={'top'}
                  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                  text={'Oversubscribed. You will not be able to receive reward.'}
                  trigger={`validator-oversubscribed-tooltip-${selectedNetwork}`}
                />
              </div>
              <div className={`${!isOversubscribed ? 'validator-att-value' : 'validator-att-value-error'}`}>{validatorInfo.nominatorCount}</div>
            </div>

            <div className={'validator-att'}>
              <div className={'validator-att-title'}>
                Minimum stake
                {
                  !isSufficientFund && <img
                    data-for={`insufficient-fund-tooltip-${selectedNetwork}`}
                    data-tip={true}
                    height={15}
                    src={NeutralQuestion}
                    width={15}
                  />
                }
                <Tooltip
                  place={'top'}
                  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                  text={getMinBondTooltipText()}
                  trigger={`insufficient-fund-tooltip-${selectedNetwork}`}
                />
              </div>
              <div className={`${isSufficientFund ? 'validator-att-value' : 'validator-att-value-error'}`}>{parseBalanceString(validatorInfo.minBond, networkJson.nativeToken as string)}</div>
            </div>
          </div>

          {
            validatorInfo.commission !== undefined && <div className={'validator-att-container'}>
              <div className={'validator-att'}>
                <div className={'validator-att-title'}>
                  Commission
                  {
                    isMaxCommission && <FontAwesomeIcon
                      className={'error-tooltip'}
                      data-for={`commission-max-tooltip-${selectedNetwork}`}
                      data-tip={true}
                      icon={faCircleExclamation}
                    />
                  }
                  <Tooltip
                    place={'top'}
                    text={'You will not be able to receive reward.'}
                    trigger={`commission-max-tooltip-${selectedNetwork}`}
                  />
                </div>
                <div className={`${!isMaxCommission ? 'validator-att-value' : 'validator-att-value-error'}`}>{validatorInfo.commission}%</div>
              </div>
            </div>
          }
        </div>
      );
    }
  }, [getMinBondTooltipText, hasOwnStake, isMaxCommission, isOversubscribed, isSufficientFund, networkJson.nativeToken, selectedNetwork, unit, validatorInfo.commission, validatorInfo.minBond, validatorInfo.nominatorCount, validatorInfo.ownStake, validatorInfo.totalStake]);

  return (
    <div className={className}>
      <Header
        cancelButtonText={'Cancel'}
        isShowNetworkSelect={false}
        showCancelButton={!loading}
        showSubHeader
        subHeaderName={t<string>('Staking action')}
      />

      {!showResult && <div
        className={'bonding-submit-container'}
        style={{ height: `${_height}px` }}
      >
        <div className={'selected-validator'}>Selected Validator</div>

        <div className={'selected-validator-view'}>
          <div
            className={'validator-item-container'}
            onClick={handleOnClick}
          >
            <div className={'validator-header'}>
              <Identicon
                className='identityIcon'
                genesisHash={networkJson.genesisHash}
                iconTheme={isEthereumAddress(validatorInfo.address) ? 'ethereum' : 'substrate'}
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
              {
                validatorInfo.expectedReturn && <div
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

              <div className={'validator-item-toggle-container'}>
                <div
                  className={'validator-item-toggle'}
                  style={{ transform: showDetail ? 'rotate(45deg)' : 'rotate(-45deg)' }}
                />
              </div>
            </div>
          </div>

          {
            showDetail && handleGetValidatorDetail()
          }
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

        <InputBalance
          autoFocus
          className={'submit-bond-amount-input'}
          decimals={networkJson.decimals}
          help={`Type the amount you want to stake. The minimum amount is ${validatorInfo.minBond} ${networkJson.nativeToken as string}`}
          inputAddressHelp={''}
          isError={false}
          isZeroable={false}
          label={t<string>('Amount')}
          onChange={handleChangeAmount}
          placeholder={'0'}
          siSymbol={networkJson.nativeToken}
        />

        {
          Object.keys(BOND_DURATION_OPTIONS).includes(selectedNetwork) && <BondDurationDropdown
            handleSelectValidator={handleChangeLockingPeriod}
            networkKey={selectedNetwork}
          />
        }

        <div className='bonding-submit__separator' />

        <div className={'bonding-btn-container'}>
          <Button
            className={'bonding-cancel-button'}
            isDisabled={loading}
            onClick={handleClickCancel}
          >
            Cancel
          </Button>
          <Button
            isDisabled={!isReadySubmit}
            onClick={handleConfirm}
          >
            {
              loading
                ? <Spinner />
                : <span>Next</span>
            }
          </Button>
        </div>
      </div>}

      {showAuth && !showResult &&
        <BondingAuthTransaction
          amount={amount}
          balanceError={balanceError}
          bondedValidators={bondedValidators}
          fee={fee}
          isBondedBefore={isBondedBefore}
          lockPeriod={lockPeriod}
          selectedNetwork={selectedNetwork}
          setExtrinsicHash={setExtrinsicHash}
          setIsTxSuccess={setIsTxSuccess}
          setShowConfirm={setShowAuth}
          setShowResult={setShowResult}
          setTxError={setTxError}
          validatorInfo={validatorInfo}
        />
      }

      {!showAuth && showResult &&
        <BondingResult
          backToHome={goHome}
          extrinsicHash={extrinsicHash}
          handleResend={handleResend}
          isTxSuccess={isTxSuccess}
          networkKey={selectedNetwork}
          txError={txError}
        />
      }
    </div>
  );
}

export default React.memo(styled(BondingSubmitTransaction)(({ theme }: Props) => `
  .validator-att-title {
    color: ${theme.textColor2};
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .validator-verified {
    color: ${theme.textColor3};
    font-size: 12px;
  }

  .bonding-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .bonding-btn-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .bonding-submit__separator {
    margin-top: 30px;
    margin-bottom: 30px;
  }

  .bonding-submit__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .submit-bond-amount-input {
    margin-top: 15px;
  }

  .auth-bonding__input-address {
    margin-top: 25px;
  }

  .selected-validator-view {
    margin-top: 10px;
    background: ${theme.accountAuthorizeRequest};
    border-radius: 8px;
  }

  .validator-att-value {
    color: ${theme.textColor3};
    font-size: 14px;
  }

  .validator-att-value-error {
    color: ${theme.errorColor};
    font-size: 14px;
  }

  .validator-att-value-warning {
    color: ${theme.iconWarningColor};
    font-size: 14px;
  }

  .validator-att {
    width: 50%;
  }

  .validator-att-container {
    width: 100%;
    margin-bottom: 15px;
    display: flex;
    gap: 20px;
  }

  .validator-detail-container {
    background: ${theme.accountAuthorizeRequest};
    padding: 10px 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 0 0 8px 8px;
  }

  .validator-item-toggle {
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 2.5px;
  }

  .validator-item-toggle-container {
    display: flex;
    align-items: center;
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

  .identityIcon {
    border: 2px solid ${theme.checkDotColor};
  }

  .validator-header {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .validator-item-container {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }

  .selected-validator {
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
  }

  .bonding-input-filter-container {
    padding: 0 15px 12px;
  }

  .bonding-submit-container {
    overflow-y: scroll;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 10px;
  }
`));
