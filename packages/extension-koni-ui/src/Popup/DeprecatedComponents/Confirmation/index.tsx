// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationType, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { AccountContext, ActionContext, Button, ButtonArea, ConfirmationsQueueContext, Warning } from '@subwallet/extension-koni-ui/components';
import RequireMigratePasswordModal from '@subwallet/extension-koni-ui/components/Signing/RequireMigratePassword';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useNeedMigratePassword from '@subwallet/extension-koni-ui/hooks/useNeedMigratePassword';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import ConfirmationHeader from '@subwallet/extension-koni-ui/Popup/Confirmation/ConfirmationHeader';
import EvmSignConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/EvmSignConfirmationInfo';
import Qr from '@subwallet/extension-koni-ui/Popup/Confirmation/Qr';
import SendEvmTransactionConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/SendEvmTransactionConfirmationInfo';
import SwitchNetworkConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/SwitchNetworkConfirmationInfo';
import { RootState, store } from '@subwallet/extension-koni-ui/stores';
import { NetworkConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SigData } from '@subwallet/extension-koni-ui/types/accountExternalRequest';
import { findAccountByAddress, getSignMode } from '@subwallet/extension-koni-ui/util/account';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import styled from 'styled-components';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

const CAN_SIGN_MODE: SIGN_MODE[] = [SIGN_MODE.PASSWORD, SIGN_MODE.QR];

function Confirmation ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const confirmations = useContext(ConfirmationsQueueContext);
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const networkMap = useSelector((state: RootState) => state.networkMap);
  const [network, setNetwork] = useState<NetworkJson | undefined>(undefined);
  const [account, setAccount] = useState<AccountJson | undefined>(undefined);
  const [header, setHeader] = useState<string | undefined>(undefined);
  const [requestActionText, setRequestActionText] = useState<string | undefined>(undefined);
  const [requestActionText2] = useState<string | undefined>(undefined);
  const [cancelLabel] = useState<string>('Cancel');
  const [confirmLabel, setConfirmLabel] = useState<string>('Confirm');
  const [currentConfirmation, setCurrentConfirmation] = useState<ConfirmationDefinitions['addNetworkRequest' | 'addTokenRequest' | 'switchNetworkRequest' | 'evmSignatureRequest' | 'evmSignatureRequestExternal' | 'evmSendTransactionRequest' | 'evmSendTransactionRequestExternal'][0] | undefined>(undefined);
  const [currentConfirmationType, setCurrentConfirmationType] = useState<ConfirmationType | undefined>(undefined);
  const [informationBlock, setInformationBlock] = useState<React.ReactElement>(<></>);
  const [qrArea, setQrArea] = useState<React.ReactElement>(<></>);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [requiredSign, setRequiredSign] = useState(false);
  const [signMode, setSignMode] = useState<SIGN_MODE>(SIGN_MODE.PASSWORD);
  const needMigratePassword = useNeedMigratePassword(account?.address);

  const checkConfirmation = useCallback(
    (type?: ConfirmationType) => {
      if (type) {
        return confirmations[type] && Object.keys(confirmations[type]).length > 0;
      } else {
        return !!Object.values(confirmations).find((c) => (Object.keys(c).length > 0));
      }
    },
    [confirmations]
  );

  const setConfirmation = useCallback(
    (confirmation: ConfirmationDefinitions['addNetworkRequest' | 'addTokenRequest' | 'switchNetworkRequest' | 'evmSignatureRequest' | 'evmSendTransactionRequest' | 'evmSignatureRequestExternal' | 'evmSendTransactionRequestExternal'][0]) => {
      if (confirmation) {
        const account = findAccountByAddress(accounts, confirmation.address);

        setSignMode(getSignMode(account));
        setCurrentConfirmation(confirmation);
        setNetwork(networkMap[confirmation.networkKey || '']);
        setAccount(account || undefined);
      }
    },
    [accounts, networkMap]
  );

  const complete = useCallback(
    (result: boolean, payload?: any) => {
      if (currentConfirmation && currentConfirmationType) {
        setIsLoading(true);
        setError('');
        completeConfirmation(currentConfirmationType, {
          id: currentConfirmation?.id,
          isApproved: result,
          payload: result
        }).then(() => {
          setIsLoading(false);
        }).catch((e: Error) => {
          setIsLoading(false);
          setError(e.message);
        });
      }
    },
    [currentConfirmation, currentConfirmationType]
  );

  const onSignature = useCallback((sigData: SigData) => {
    if (currentConfirmation && currentConfirmationType) {
      setIsLoading(true);
      setError('');
      completeConfirmation(currentConfirmationType, {
        id: currentConfirmation?.id,
        isApproved: true,
        signature: sigData.signature
      }).then(() => {
        setIsLoading(false);
      }).catch((e: Error) => {
        setIsLoading(false);
        setError(e.message);
      });
    }
  }, [currentConfirmation, currentConfirmationType]);

  const _onCancel = useCallback(() => {
    complete(false);
  }, [complete]);

  const _onApprove = useCallback(() => {
    if (account?.isExternal) {
      setIsScanning((val) => !val);
    } else {
      complete(true);
    }
  }, [account?.isExternal, complete]);

  const disableConfirm = useMemo(() => isLoading || (requiredSign && (!CAN_SIGN_MODE.includes(signMode) || needMigratePassword)), [needMigratePassword, isLoading, requiredSign, signMode]);

  useEffect(() => {
    if (checkConfirmation('evmSignatureRequest')) {
      const confirmation = Object.values(confirmations.evmSignatureRequest)[0];

      setConfirmation(confirmation);
      setRequiredSign(true);
      setCurrentConfirmationType('evmSignatureRequest');
      setHeader(t<string>('Sign Message'));
      setRequestActionText('request to sign message with');
      setConfirmLabel(t<string>('Sign'));
      setInformationBlock(<EvmSignConfirmationInfo
        className='confirmation-info'
        confirmation={confirmation}
      />);
    } else if (checkConfirmation('evmSignatureRequestExternal')) {
      const confirmation = Object.values(confirmations.evmSignatureRequestExternal)[0];

      setConfirmation(confirmation);
      setRequiredSign(true);
      setCurrentConfirmationType('evmSignatureRequestExternal');
      setHeader(t<string>('Sign Message'));
      setRequestActionText('request to sign message with');
      setConfirmLabel(isScanning ? t<string>('Display Payload') : t('Scan Qr'));
      setInformationBlock(<EvmSignConfirmationInfo
        className='confirmation-info'
        confirmation={confirmation}
      />);
    } else if (checkConfirmation('evmSendTransactionRequest')) {
      const confirmation = Object.values(confirmations.evmSendTransactionRequest)[0];

      setConfirmation(confirmation);
      setRequiredSign(true);
      setCurrentConfirmationType('evmSendTransactionRequest');
      setHeader(t<string>('Send Transaction'));
      setRequestActionText(t<string>('request to send transaction from'));
      setHeader(t<string>('Send Transaction'));
      setConfirmLabel(t<string>('Send Transaction'));
      setInformationBlock(<SendEvmTransactionConfirmationInfo
        className='confirmation-info'
        confirmation={confirmation}
        network={network}
      />);
    } else if (checkConfirmation('evmSendTransactionRequestExternal')) {
      const confirmation = Object.values(confirmations.evmSendTransactionRequestExternal)[0];

      setConfirmation(confirmation);
      setRequiredSign(true);
      setCurrentConfirmationType('evmSendTransactionRequestExternal');
      setHeader(t<string>('Send Transaction'));
      setRequestActionText(t<string>('request to send transaction from'));
      setHeader(t<string>('Send Transaction'));
      setConfirmLabel(isScanning ? t<string>('Display Payload') : t('Scan Qr'));
      setInformationBlock(
        <SendEvmTransactionConfirmationInfo
          className='confirmation-info'
          confirmation={confirmation}
          network={network}
        />
      );
    } else if (checkConfirmation('addNetworkRequest')) {
      const confirmation = Object.values(confirmations.addNetworkRequest)[0];
      const { id, payload } = confirmation;

      setConfirmation(confirmation);
      setRequiredSign(false);
      setCurrentConfirmationType('addNetworkRequest');

      payload.requestId = id;
      store.dispatch({ type: 'networkConfigParams/update', payload: { externalData: payload, mode: 'create' } as NetworkConfigParams });
      onAction('/account/config-network');
    } else if (checkConfirmation('addTokenRequest')) {
      const confirmation = Object.values(confirmations.addTokenRequest)[0];
      const { payload } = confirmation;

      setConfirmation(confirmation);
      setRequiredSign(false);
      setCurrentConfirmationType('addTokenRequest');

      if (payload.type === 'erc20') {
        onAction('/account/import-token');
      } else if (payload.type === 'erc721') {
        onAction('/account/import-nft');
      }
    } else if (checkConfirmation('switchNetworkRequest')) {
      const confirmation = Object.values(confirmations.switchNetworkRequest)[0];

      setConfirmation(confirmation);
      setRequiredSign(false);
      setCurrentConfirmationType('switchNetworkRequest');
      setHeader(t<string>('Switch network'));
      setRequestActionText(t<string>('request to switch network of'));
      setConfirmLabel(t<string>('Switch'));
      setInformationBlock(<SwitchNetworkConfirmationInfo
        className='confirmation-info'
        confirmation={confirmation}
      />);
    }

    if (checkConfirmation('evmSendTransactionRequestExternal') || checkConfirmation('evmSignatureRequestExternal')) {
      const confirmation = checkConfirmation('evmSendTransactionRequestExternal') ? Object.values(confirmations.evmSendTransactionRequestExternal)[0] : Object.values(confirmations.evmSignatureRequestExternal)[0];
      const isMessage = !checkConfirmation('evmSendTransactionRequestExternal');

      if (signMode === SIGN_MODE.QR) {
        setQrArea(
          <Qr
            confirmation={confirmation}
            isLoading={isLoading}
            isMessage={isMessage}
            isScanning={isScanning}
            onError={setError}
            onScan={onSignature}
          />
        );
      }

      setIsWarning(!confirmation.payload.canSign);
    } else {
      setQrArea(
        <></>
      );
      setIsWarning(false);
    }
  }, [confirmations, checkConfirmation, onAction, t, networkMap, accounts, network, setConfirmation, isLoading, isScanning, onSignature, signMode]);

  return (<>
    <div className={className}>
      <Header
        showSubHeader={!!header}
        subHeaderName={header}
      />
      <div className='body-container'>
        <div className='confirmation-wrapper'>
          {currentConfirmation && <ConfirmationHeader
            account={account}
            className='confirmation-header'
            confirmation={currentConfirmation}
            network={network}
            requestActionText={requestActionText}
            requestActionText2={requestActionText2}
          />}
          {informationBlock}
          {qrArea}
        </div>
        {(isWarning || (requiredSign && ![...CAN_SIGN_MODE, SIGN_MODE.READ_ONLY].includes(signMode))) &&
          (
            <div className='warning-area'>
              <Warning>
                {t('This feature is not available for the chosen account.')}
              </Warning>
            </div>
          )
        }
        {(requiredSign && signMode === SIGN_MODE.READ_ONLY) &&
          (
            <div className='warning-area'>
              <Warning>
                {t('You are using readonly account.')}
              </Warning>
            </div>
          )
        }
        <div className='action-area'>
          <RequireMigratePasswordModal address={account?.address} />
          {error && (
            <Warning
              className='confirmation-error'
              isDanger={true}
            >
              {error}
            </Warning>
          )}
          <ButtonArea className='button-area'>
            <Button
              className='cancel-button'
              isDisabled={isLoading}
              onClick={_onCancel}
            >{cancelLabel}</Button>
            <Button
              className='confirm-button'
              isDisabled={disableConfirm}
              onClick={_onApprove}
            >{confirmLabel}</Button>
          </ButtonArea>
        </div>
      </div>
    </div>
  </>);
}

export default styled(Confirmation)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .body-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    position: relative;
  }

  .confirmation-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .confirmation-info {
    padding: 15px;
    flex: 1;
  }

  .cancel-button {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};
    color: ${theme.buttonTextColor2};
  }

  .confirm-button {
    margin-left: 8px;
  }

  .warning-area {
    padding: 15px 15px 0;
    position: sticky;
    bottom: 0;
  }

  .action-area {
    background: ${theme.background};
    z-index: 10;
    padding: 15px;
    position: sticky;
    bottom: 0;
    left: 0;

    .password{
      margin-top: 0;
      padding-top: 0;

      .label-wrapper {
        margin-top: 0;
        padding-top: 0;
        display: none;
      }
    }
  }

  .confirmation-error {
    margin-top: 10px;
    color: red;
  }
`);
