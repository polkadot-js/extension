// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DelegationItem } from '@subwallet/extension-base/background/KoniTypes';
import { InputWithLabel } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getStakeClaimRewardTxInfo, submitStakeClaimReward } from '@subwallet/extension-koni-ui/messaging';
import ValidatorsDropdown from '@subwallet/extension-koni-ui/Popup/Bonding/components/ValidatorsDropdown';
import StakeClaimRewardResult from '@subwallet/extension-koni-ui/Popup/Home/Staking/StakeClaimRewardResult';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  hideModal: () => void;
  address: string;
  networkKey: string;
  delegation?: DelegationItem[];
}

function StakeAuthClaimReward ({ address, className, delegation, hideModal, networkKey }: Props): React.ReactElement<Props> {
  const networkJson = useGetNetworkJson(networkKey);
  const { t } = useTranslation();
  const { show } = useToast();

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>('');
  const [isTxReady, setIsTxReady] = useState(false);
  const [targetValidator, setTargetValidator] = useState(delegation ? delegation[0].owner : '');

  const [balanceError, setBalanceError] = useState(false);
  const [fee, setFee] = useState('');

  const [extrinsicHash, setExtrinsicHash] = useState('');
  const [isTxSuccess, setIsTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleSelectValidator = useCallback((val: string) => {
    setTargetValidator(val);
  }, []);

  useEffect(() => {
    getStakeClaimRewardTxInfo({
      address,
      networkKey,
      validatorAddress: targetValidator
    })
      .then((resp) => {
        setIsTxReady(true);
        setBalanceError(resp.balanceError);
        setFee(resp.fee);
      })
      .catch(console.error);
  }, [address, networkKey, targetValidator]);

  const _onChangePass = useCallback((value: string) => {
    setPassword(value);
    setPasswordError(null);
  }, []);

  const handleOnSubmit = useCallback(async () => {
    setLoading(true);
    await submitStakeClaimReward({
      address,
      networkKey,
      password,
      validatorAddress: targetValidator
    }, (cbData) => {
      if (cbData.passwordError) {
        show(cbData.passwordError);
        setPasswordError(cbData.passwordError);
        setLoading(false);
      }

      if (balanceError && !cbData.passwordError) {
        setLoading(false);
        show('Your balance is too low to cover fees');

        return;
      }

      if (cbData.txError && cbData.txError) {
        show('Encountered an error, please try again.');
        setLoading(false);

        return;
      }

      if (cbData.status) {
        setLoading(false);

        if (cbData.status) {
          setIsTxSuccess(true);
          setShowResult(true);
          setExtrinsicHash(cbData.transactionHash as string);
        } else {
          setIsTxSuccess(false);
          setTxError('Error submitting transaction');
          setShowResult(true);
          setExtrinsicHash(cbData.transactionHash as string);
        }
      }
    });
  }, [address, balanceError, networkKey, password, show, targetValidator]);

  const handleConfirm = useCallback(() => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await handleOnSubmit();
    }, 10);
  }, [handleOnSubmit]);

  const handleResend = useCallback(() => {
    setExtrinsicHash('');
    setIsTxSuccess(false);
    setTxError('');
    setShowResult(false);
  }, []);

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
            onClick={hideModal}
          >
            Cancel
          </div>
        </div>
        {
          !showResult
            ? <div>
              {
                isTxReady
                  ? <div className={'claim-auth-container'}>
                    <InputAddress
                      autoPrefill={false}
                      className={'receive-input-address'}
                      defaultValue={address}
                      help={t<string>('The account which you will claim reward')}
                      isDisabled={true}
                      isSetDefaultValue={true}
                      label={t<string>('Claim staking reward from account')}
                      networkPrefix={networkJson.ss58Format}
                      type='allPlus'
                      withEllipsis
                    />

                    {
                      delegation && <ValidatorsDropdown
                        className={'stake-claim-dropdown'}
                        delegations={delegation}
                        handleSelectValidator={handleSelectValidator}
                        label={'Select a dApp'}
                      />
                    }

                    <div className={'transaction-info-container'}>
                      {/* <div className={'transaction-info-row'}> */}
                      {/*  <div className={'transaction-info-title'}>claim amount</div> */}
                      {/*  <div className={'transaction-info-value'}>{amount} {networkJson.nativeToken}</div> */}
                      {/* </div> */}
                      <div className={'transaction-info-row'}>
                        <div className={'transaction-info-title'}>Reward claiming fee</div>
                        <div className={'transaction-info-value'}>{fee}</div>
                      </div>

                      <div className={'transaction-info-row'}>
                        <div className={'transaction-info-title'}>Total</div>
                        <div className={'transaction-info-value'}>{fee}</div>
                      </div>
                    </div>

                    <div className='claim-auth__separator' />

                    <InputWithLabel
                      isError={passwordError !== null}
                      label={t<string>('Unlock account with password')}
                      onChange={_onChangePass}
                      type='password'
                      value={password}
                    />

                    <div className={'claim-auth-btn-container'}>
                      <Button
                        className={'claim-auth-cancel-button'}
                        isDisabled={loading}
                        onClick={hideModal}
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
                  : <Spinner className={'container-spinner'} />
              }
            </div>
            : <StakeClaimRewardResult
              backToHome={hideModal}
              extrinsicHash={extrinsicHash}
              handleResend={handleResend}
              isTxSuccess={isTxSuccess}
              networkKey={networkKey}
              txError={txError}
            />
        }
      </Modal>
    </div>
  );
}

export default React.memo(styled(StakeAuthClaimReward)(({ theme }: Props) => `
  .container-spinner {
    height: 65px;
    width: 65px;
  }

  .claim-auth-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .claim-auth-btn-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .claim-auth__separator {
    margin-top: 30px;
    margin-bottom: 18px;
  }

  .claim-auth__separator:before {
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

  .claim-auth-container {
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
