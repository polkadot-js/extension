// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakeClaimRewardParams, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import FeeValue from '@subwallet/extension-koni-ui/components/Balance/FeeValue';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import SigningRequest from '@subwallet/extension-koni-ui/components/Signing/SigningRequest';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { claimRewardLedger, claimRewardQr, getStakeClaimRewardTxInfo, submitStakeClaimReward } from '@subwallet/extension-koni-ui/messaging';
import StakeClaimRewardResult from '@subwallet/extension-koni-ui/Popup/Home/Staking/components/StakeClaimRewardResult';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  hideModal: () => void;
  address: string;
  networkKey: string;
  stakingType: StakingType;
  claimable: string | undefined;
}

function StakeAuthClaimReward ({ address, claimable, className, hideModal, networkKey, stakingType }: Props): React.ReactElement<Props> {
  const networkJson = useGetNetworkJson(networkKey);
  const { t } = useTranslation();

  const { handlerReject } = useRejectExternalRequest();

  const { externalState: { externalId } } = useContext(ExternalRequestContext);
  const { signingState: { isBusy } } = useContext(SigningContext);

  const params = useMemo((): StakeClaimRewardParams => ({
    address: address,
    networkKey: networkKey,
    stakingType
  }), [stakingType, address, networkKey]);

  const [isTxReady, setIsTxReady] = useState(false);

  const [balanceError, setBalanceError] = useState(false);
  const [fee, setFee] = useState('');

  const [extrinsicHash, setExtrinsicHash] = useState('');
  const [isTxSuccess, setIsTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');
  const [showResult, setShowResult] = useState(false);

  const account = useGetAccountByAddress(address);

  const hideConfirm = useCallback(async () => {
    if (!isBusy) {
      await handlerReject(externalId);
      hideModal();
    }
  }, [isBusy, handlerReject, externalId, hideModal]);

  const onFail = useCallback((errors: string[], extrinsicHash?: string) => {
    setIsTxSuccess(false);
    setTxError(errors[0]);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash || '');
  }, [setExtrinsicHash, setIsTxSuccess, setShowResult, setTxError]);

  const onSuccess = useCallback((extrinsicHash: string) => {
    setIsTxSuccess(true);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash);
  }, [setExtrinsicHash, setIsTxSuccess, setShowResult]);

  const handleResend = useCallback(() => {
    setExtrinsicHash('');
    setIsTxSuccess(false);
    setTxError('');
    setShowResult(false);
  }, []);

  useEffect(() => {
    getStakeClaimRewardTxInfo({
      address,
      networkKey,
      stakingType
    })
      .then((resp) => {
        setIsTxReady(true);
        setBalanceError(resp.balanceError);
        setFee(resp.fee);
      })
      .catch(console.error);

    return () => {
      setIsTxReady(false);
      setBalanceError(false);
      setFee('');
    };
  }, [stakingType, address, networkKey]);

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
        {
          !showResult
            ? <>
              {
                isTxReady
                  ? (
                    <SigningRequest
                      account={account}
                      balanceError={balanceError}
                      className='signing-request-wrapper'
                      handleSignLedger={claimRewardLedger}
                      handleSignPassword={submitStakeClaimReward}
                      handleSignQr={claimRewardQr}
                      hideConfirm={hideConfirm}
                      message={'There is problem when claimReward'}
                      network={networkJson}
                      onFail={onFail}
                      onSuccess={onSuccess}
                      params={params}
                    >
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

                      <div className={'transaction-info-container'}>
                        {
                          claimable && <div className={'transaction-info-row'}>
                            <div className={'transaction-info-title'}>Claimable staking reward</div>
                            <div className={'transaction-info-value'}>
                              <FeeValue
                                _length={9}
                                feeString={`${claimable} ${networkJson.nativeToken as string}`}
                              />
                            </div>
                          </div>
                        }

                        <div className={'transaction-info-row'}>
                          <div className={'transaction-info-title'}>Reward claiming fee</div>
                          <div className={'transaction-info-value'}>
                            <FeeValue feeString={fee} />
                          </div>
                        </div>

                        <div className={'transaction-info-row'}>
                          <div className={'transaction-info-title'}>Total</div>
                          <div className={'transaction-info-value'}>
                            <FeeValue feeString={fee} />
                          </div>
                        </div>
                      </div>
                    </SigningRequest>
                  )
                  : <Spinner className={'container-spinner'} />
              }
            </>
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

  .signing-request-wrapper {
    overflow: auto;
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
