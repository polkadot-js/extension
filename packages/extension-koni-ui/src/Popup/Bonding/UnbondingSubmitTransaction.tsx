// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActionContext, HorizontalLabelToggle } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getUnbondingTxInfo } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import UnbondingAuthTransaction from '@subwallet/extension-koni-ui/Popup/Bonding/components/UnbondingAuthTransaction';
import UnbondingResult from '@subwallet/extension-koni-ui/Popup/Bonding/components/UnbondingResult';
// @ts-ignore
import ValidatorsDropdown from '@subwallet/extension-koni-ui/Popup/Bonding/components/ValidatorsDropdown';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
}

function UnbondingSubmitTransaction ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const navigate = useContext(ActionContext);
  const { currentAccount: { account }, unbondingParams } = useSelector((state: RootState) => state);
  const selectedNetwork = unbondingParams.selectedNetwork as string;
  const bondedAmount = unbondingParams.bondedAmount as number;
  const networkJson = useGetNetworkJson(selectedNetwork);

  const [amount, setAmount] = useState<number>(0);
  const [isReadySubmit, setIsReadySubmit] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isClickNext, setIsClickNext] = useState(false);
  const [unbondAll, setUnbondAll] = useState(false);

  const [fee, setFee] = useState('');
  const [balanceError, setBalanceError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extrinsicHash, setExtrinsicHash] = useState('');
  const [isTxSuccess, setIsTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');

  const [selectedValidator, setSelectedValidator] = useState<string>(unbondingParams.delegations ? unbondingParams.delegations[0].owner : '');
  const [nominatedAmount, setNominatedAmount] = useState<string>(unbondingParams.delegations ? unbondingParams.delegations[0].amount : '0');
  const [minBond, setMinBond] = useState<string>(unbondingParams.delegations ? unbondingParams.delegations[0].minBond : '0');

  const goHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (!isClickNext) {
      if (unbondingParams.delegations) {
        const _nominatedAmount = parseFloat(nominatedAmount) / (10 ** (networkJson.decimals as number));
        const _minBond = parseFloat(minBond) / (10 ** (networkJson.decimals as number));

        if ((amount > 0 && amount <= (_nominatedAmount - _minBond)) || amount === _nominatedAmount) {
          setIsReadySubmit(true);
        } else {
          setIsReadySubmit(false);

          if (amount > 0) {
            if ((_nominatedAmount - _minBond) <= 0) {
              show('You can only unstake everything');
            } else {
              show(`You can unstake everything or a maximum of ${_nominatedAmount - _minBond} ${networkJson.nativeToken as string}`);
            }
          }
        }
      } else {
        if (amount > 0 && amount <= bondedAmount) {
          setIsReadySubmit(true);
        } else {
          setIsReadySubmit(false);

          if (amount > bondedAmount) {
            show(`You can unstake a maximum of ${bondedAmount} ${networkJson.nativeToken as string}`);
          }
        }
      }
    }
  }, [amount, bondedAmount, isClickNext, minBond, networkJson.decimals, networkJson.nativeToken, nominatedAmount, show, showAuth, showResult, unbondingParams.delegations]);

  const convertToBN = useCallback(() => {
    if (unbondAll) {
      if (unbondingParams.delegations) {
        return new BN(nominatedAmount);
      } else {
        const binaryAmount = bondedAmount * (10 ** (networkJson.decimals as number));

        return new BN(binaryAmount.toString());
      }
    }

    return new BN('0');
  }, [bondedAmount, networkJson.decimals, nominatedAmount, unbondAll, unbondingParams.delegations]);

  const handleResend = useCallback(() => {
    setExtrinsicHash('');
    setIsTxSuccess(false);
    setTxError('');
    setShowResult(false);
    setShowAuth(true);
    setIsClickNext(false);
  }, []);

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

  const handleClickCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleConfirm = useCallback(() => {
    setLoading(true);
    getUnbondingTxInfo({
      address: account?.address as string,
      amount,
      networkKey: selectedNetwork,
      validatorAddress: selectedValidator,
      unstakeAll: unbondAll
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
  }, [account?.address, amount, selectedNetwork, selectedValidator, unbondAll]);

  const handleSelectValidator = useCallback((val: string) => {
    setSelectedValidator(val);

    if (unbondingParams.delegations) {
      for (const item of unbondingParams.delegations) {
        if (item.owner === val) {
          setNominatedAmount(item.amount);
          setMinBond(item.minBond);

          setAmount(0);
          setIsReadySubmit(false);
          break;
        }
      }
    }
  }, [unbondingParams.delegations]);

  const toggleUnbondAll = useCallback((value: boolean) => {
    setUnbondAll(value);

    if (value) {
      if (unbondingParams.delegations) {
        const _nominatedAmount = parseFloat(nominatedAmount) / (10 ** (networkJson.decimals as number));

        setAmount(_nominatedAmount);
      } else {
        setAmount(bondedAmount);
      }
    } else {
      setAmount(0);
    }
  }, [bondedAmount, networkJson.decimals, nominatedAmount, unbondingParams.delegations]);

  return (
    <div className={className}>
      <Header
        isShowNetworkSelect={false}
        showCancelButton={false}
        showSubHeader
        subHeaderName={t<string>('Unstaking action')}
      />

      {!showResult && <div
        className={'bonding-submit-container'}
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

        {
          unbondingParams.delegations && <ValidatorsDropdown
            delegations={unbondingParams.delegations}
            handleSelectValidator={handleSelectValidator}
          />
        }

        {
          unbondingParams.delegations && <div className={'unbonding-input'}>
            <InputBalance
              autoFocus
              className={'submit-bond-amount-input'}
              decimals={networkJson.decimals}
              defaultValue={convertToBN()}
              help={`Type the amount you want to unstake. Your total stake is ${parseFloat(nominatedAmount) / (10 ** (networkJson.decimals as number))} ${networkJson.nativeToken as string}`}
              inputAddressHelp={''}
              isError={false}
              isZeroable={false}
              label={t<string>('Amount')}
              onChange={handleChangeAmount}
              placeholder={'0'}
              siDecimals={networkJson.decimals}
              siSymbol={networkJson.nativeToken}
            />
          </div>
        }

        {
          !unbondingParams.delegations && <div className={'unbonding-input'}>
            <InputBalance
              autoFocus
              className={'submit-bond-amount-input'}
              decimals={networkJson.decimals}
              defaultValue={convertToBN()}
              help={`Type the amount you want to unstake. You can unstake ${bondedAmount} ${networkJson.nativeToken as string}`}
              inputAddressHelp={''}
              isError={false}
              isZeroable={false}
              label={t<string>('Amount')}
              onChange={handleChangeAmount}
              placeholder={'0'}
              siDecimals={networkJson.decimals}
              siSymbol={networkJson.nativeToken}
            />
          </div>
        }

        <div className={'unstake-all-container'}>
          <div className={'unstake-all-text'}>Unstake all</div>
          <HorizontalLabelToggle
            checkedLabel={''}
            className='info'
            toggleFunc={toggleUnbondAll}
            uncheckedLabel={''}
            value={unbondAll}
          />
        </div>

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
        <UnbondingAuthTransaction
          amount={amount}
          balanceError={balanceError}
          fee={fee}
          selectedNetwork={selectedNetwork}
          selectedValidator={selectedValidator}
          setExtrinsicHash={setExtrinsicHash}
          setIsTxSuccess={setIsTxSuccess}
          setShowConfirm={setShowAuth}
          setShowResult={setShowResult}
          setTxError={setTxError}
          unbondAll={unbondAll}
        />
      }

      {!showAuth && showResult &&
        <UnbondingResult
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

export default React.memo(styled(UnbondingSubmitTransaction)(({ theme }: Props) => `
  .unstake-all-container {
    .horizontal-label-toggle {
      margin-right: 0;
      margin-left: 14px;
    }
    margin-top: 15px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .unstake-all-text {
    color: ${theme.textColor2};
    font-weight: 400;
    font-size: 14px;
  }

  .unbonding-input {
    margin-top: 20px;
  }

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
