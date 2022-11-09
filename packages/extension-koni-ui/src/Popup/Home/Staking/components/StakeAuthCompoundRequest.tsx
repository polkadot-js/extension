// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TuringStakeCompoundParams } from '@subwallet/extension-base/background/KoniTypes';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import SigningRequest from '@subwallet/extension-koni-ui/components/Signing/SigningRequest';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { createCompoundLedger, createCompoundQr, submitTuringStakeCompounding } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { formatLocaleNumber } from '@subwallet/extension-koni-ui/util/formatNumber';
import moment from 'moment/moment';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  handleRevertClickNext: () => void;
  selectedCollator: string;
  setShowAuth: (val: boolean) => void;
  setShowResult: (val: boolean) => void;

  accountMinimum: string;
  address: string;
  networkKey: string;
  setExtrinsicHash: (val: string) => void;
  setIsTxSuccess: (val: boolean) => void;
  setTxError: (val: string) => void;
  bondedAmount: string;
  initTime: number;

  balanceError: boolean;
  fee: string;
  optimalTime: string;
  compoundFee: string
}

function StakeAuthCompoundRequest ({ accountMinimum, address, balanceError, bondedAmount, className, compoundFee, fee, handleRevertClickNext, initTime, networkKey, optimalTime, selectedCollator, setExtrinsicHash, setIsTxSuccess, setShowAuth, setShowResult, setTxError }: Props): React.ReactElement<Props> {
  const { handlerReject } = useRejectExternalRequest();

  const { externalState: { externalId } } = useContext(ExternalRequestContext);
  const { signingState: { isBusy } } = useContext(SigningContext);

  const networkJson = useGetNetworkJson(networkKey);
  const { t } = useTranslation();

  const account = useGetAccountByAddress(address);

  const params = useMemo((): TuringStakeCompoundParams => ({
    address: address,
    accountMinimum: accountMinimum,
    collatorAddress: selectedCollator,
    networkKey: networkKey,
    bondedAmount: bondedAmount
  }), [accountMinimum, address, bondedAmount, networkKey, selectedCollator]);

  const handleClickCancel = useCallback(async () => {
    if (!isBusy) {
      await handlerReject(externalId);
      setShowAuth(false);
      handleRevertClickNext();
    }
  }, [isBusy, handlerReject, externalId, setShowAuth, handleRevertClickNext]);

  const onFail = useCallback((error: string, extrinsicHash?: string) => {
    setIsTxSuccess(false);
    setTxError(error);
    setShowAuth(false);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash || '');
  }, [setExtrinsicHash, setIsTxSuccess, setShowAuth, setShowResult, setTxError]);

  const onSuccess = useCallback((extrinsicHash: string) => {
    setIsTxSuccess(true);
    setShowAuth(false);
    setShowResult(true);
    setExtrinsicHash(extrinsicHash);
  }, [setExtrinsicHash, setIsTxSuccess, setShowAuth, setShowResult]);

  const renderInfo = useCallback(() => {
    return (
      <>
        <InputAddress
          autoPrefill={false}
          className={'receive-input-address'}
          defaultValue={address}
          help={t<string>('The account which you will compound the stake')}
          isDisabled={true}
          isSetDefaultValue={true}
          label={t<string>('Compound the stake from account')}
          networkPrefix={networkJson.ss58Format}
          type='allPlus'
          withEllipsis
        />

        <div className={'transaction-info-container'}>
          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Compounding threshold</div>
            <div className={'transaction-info-value'}>{formatLocaleNumber(parseFloat(accountMinimum), 4)} TUR</div>
          </div>
          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Compounding starts in</div>
            <div className={'transaction-info-value'}>About {moment.duration(initTime, 'days').humanize()}</div>
          </div>
          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Optimal compounding time</div>
            <div className={'transaction-info-value'}>{moment.duration(optimalTime, 'days').humanize()}</div>
          </div>
        </div>

        <div className={'transaction-info-container'}>
          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Transaction fee</div>
            <div className={'transaction-info-value'}>{fee}</div>
          </div>

          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Compounding fee</div>
            <div className={'transaction-info-value'}>{compoundFee}</div>
          </div>

          <div className={'transaction-info-row'}>
            <div className={'transaction-info-title'}>Total</div>
            <div className={'transaction-info-value'}>{fee} + {compoundFee}</div>
          </div>
        </div>
      </>
    );
  }, [accountMinimum, address, compoundFee, fee, initTime, networkJson.ss58Format, optimalTime, t]);

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
            onClick={handleClickCancel}
          >
            Cancel
          </div>
        </div>

        <SigningRequest
          account={account}
          balanceError={balanceError}
          handleSignLedger={createCompoundLedger}
          handleSignPassword={submitTuringStakeCompounding}
          handleSignQr={createCompoundQr}
          hideConfirm={handleClickCancel}
          message={'There is problem when createCompound'}
          network={networkJson}
          onFail={onFail}
          onSuccess={onSuccess}
          params={params}
        >
          { renderInfo() }
        </SigningRequest>
      </Modal>
    </div>
  );
}

export default React.memo(styled(StakeAuthCompoundRequest)(({ theme }: Props) => `
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
