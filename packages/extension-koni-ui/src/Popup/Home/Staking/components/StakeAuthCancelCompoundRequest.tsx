// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TuringCancelStakeCompoundParams } from '@subwallet/extension-base/background/KoniTypes';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import SigningRequest from '@subwallet/extension-koni-ui/components/Signing/SigningRequest';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import { useRejectExternalRequest } from '@subwallet/extension-koni-ui/hooks/useRejectExternalRequest';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { cancelCompoundLedger, cancelCompoundQr, submitTuringCancelStakeCompounding } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  setShowAuth: (val: boolean) => void;
  setShowResult: (val: boolean) => void;

  taskId: string;
  address: string;
  networkKey: string;
  setExtrinsicHash: (val: string) => void;
  setIsTxSuccess: (val: boolean) => void;
  setTxError: (val: string) => void;

  balanceError: boolean;
  fee: string;
}

function StakeAuthCancelCompoundRequest ({ address, balanceError, className, fee, networkKey, setExtrinsicHash, setIsTxSuccess, setShowAuth, setShowResult, setTxError, taskId }: Props): React.ReactElement<Props> {
  const { handlerReject } = useRejectExternalRequest();

  const { externalState: { externalId } } = useContext(ExternalRequestContext);
  const { signingState: { isBusy } } = useContext(SigningContext);

  const account = useGetAccountByAddress(address);

  const networkJson = useGetNetworkJson(networkKey);
  const { t } = useTranslation();

  const params = useMemo((): TuringCancelStakeCompoundParams => ({
    address: address,
    taskId: taskId,
    networkKey: networkKey
  }), [address, networkKey, taskId]);

  const handleClickCancel = useCallback(async () => {
    if (!isBusy) {
      await handlerReject(externalId);
      setShowAuth(false);
    }
  }, [externalId, handlerReject, isBusy, setShowAuth]);

  const onFail = useCallback((errors: string[], extrinsicHash?: string) => {
    setIsTxSuccess(false);
    setTxError(errors[0]);
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
          className='signing-request-wrapper'
          handleSignLedger={cancelCompoundLedger}
          handleSignPassword={submitTuringCancelStakeCompounding}
          handleSignQr={cancelCompoundQr}
          hideConfirm={handleClickCancel}
          message={'There is problem when cancelCompound'}
          network={networkJson}
          onFail={onFail}
          onSuccess={onSuccess}
          params={params}
        >
          <InputAddress
            autoPrefill={false}
            className={'receive-input-address'}
            defaultValue={address}
            help={t<string>('The account which you will cancel the compounding task')}
            isDisabled={true}
            isSetDefaultValue={true}
            label={t<string>('Cancel compounding task of account')}
            networkPrefix={networkJson.ss58Format}
            type='allPlus'
            withEllipsis
          />

          <div className={'transaction-info-container'}>
            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Task ID</div>
              <div className={'transaction-info-value'}>{toShort(taskId)}</div>
            </div>
            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Transaction fee</div>
              <div className={'transaction-info-value'}>{fee}</div>
            </div>

            <div className={'transaction-info-row'}>
              <div className={'transaction-info-title'}>Total</div>
              <div className={'transaction-info-value'}>{fee}</div>
            </div>
          </div>
        </SigningRequest>
      </Modal>
    </div>
  );
}

export default React.memo(styled(StakeAuthCancelCompoundRequest)(({ theme }: Props) => `
  .transaction-info-container {
    margin-top: 20px;
    width: 100%;
  }

  .signing-request-wrapper {
    overflow: auto;
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
