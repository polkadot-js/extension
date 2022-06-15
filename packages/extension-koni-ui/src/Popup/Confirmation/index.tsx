// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationType, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { AccountContext, ActionContext, Button, ButtonArea, ConfirmationsQueueContext, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import ConfirmationHeader from '@subwallet/extension-koni-ui/Popup/Confirmation/ConfirmationHeader';
import EvmSignConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/EvmSignConfirmationInfo';
import SendEvmTransactionConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/SendEvmTransactionConfirmationInfo';
import SwitchNetworkConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/SwitchNetworkConfirmationInfo';
import { RootState, store } from '@subwallet/extension-koni-ui/stores';
import { NetworkConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function Confirmation ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const confirmations = useContext(ConfirmationsQueueContext);
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const { networkMap } = useSelector((state: RootState) => state);
  const [network, setNetwork] = useState<NetworkJson | undefined>(undefined);
  const [account, setAccount] = useState<AccountJson | undefined>(undefined);
  const [header, setHeader] = useState<string | undefined>(undefined);
  const [requestActionText, setRequestActionText] = useState<string | undefined>(undefined);
  const [requestActionText2] = useState<string | undefined>(undefined);
  const [cancelLabel] = useState<string>('Cancel');
  const [confirmLabel, setConfirmLabel] = useState<string>('Confirm');
  const [currentConfirmation, setCurrentConfirmation] = useState<ConfirmationDefinitions['addNetworkRequest' | 'switchNetworkRequest' | 'evmSignatureRequest' | 'evmSendTransactionRequest'][0] | undefined>(undefined);
  const [currentConfirmationType, setCurrentConfirmationType] = useState<ConfirmationType | undefined>(undefined);
  const [informationBlock, setInformationBlock] = useState<React.ReactElement>(<></>);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    (confirmation: ConfirmationDefinitions['addNetworkRequest' | 'switchNetworkRequest' | 'evmSignatureRequest' | 'evmSendTransactionRequest'][0]) => {
      if (confirmation) {
        setCurrentConfirmation(confirmation);
        setNetwork(networkMap[confirmation.networkKey || '']);
        setAccount(accounts.find((a) => (a.address === confirmation.address)));
        setRequirePassword(!!confirmation.requiredPassword);
      }
    },
    [accounts, networkMap]
  );

  useEffect(() => {
    if (checkConfirmation('evmSignatureRequest')) {
      const confirmation = Object.values(confirmations.evmSignatureRequest)[0];

      setConfirmation(confirmation);
      setCurrentConfirmationType('evmSignatureRequest');
      setHeader(t<string>('Sign Message'));
      setRequestActionText('request to sign message with');
      setConfirmLabel(t<string>('Sign'));
      setInformationBlock(<EvmSignConfirmationInfo
        className='confirmation-info'
        confirmation={confirmation}
      />);
    } else if (checkConfirmation('evmSendTransactionRequest')) {
      const confirmation = Object.values(confirmations.evmSendTransactionRequest)[0];

      setConfirmation(confirmation);
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
    } else if (checkConfirmation('addNetworkRequest')) {
      const confirmation = Object.values(confirmations.addNetworkRequest)[0];
      const { id, payload } = confirmation;

      setConfirmation(confirmation);
      setCurrentConfirmationType('addNetworkRequest');

      payload.requestId = id;
      store.dispatch({ type: 'networkConfigParams/update', payload: { data: payload, mode: 'create' } as NetworkConfigParams });

      window.localStorage.setItem('popupNavigation', '/account/config-network');
      onAction('/account/config-network');
    } else if (checkConfirmation('switchNetworkRequest')) {
      const confirmation = Object.values(confirmations.switchNetworkRequest)[0];

      setConfirmation(confirmation);
      setCurrentConfirmationType('evmSendTransactionRequest');
      setHeader(t<string>('Switch network'));
      setRequestActionText(t<string>('request to switch network of'));
      setConfirmLabel(t<string>('Switch'));
      setInformationBlock(<SwitchNetworkConfirmationInfo
        className='confirmation-info'
        confirmation={confirmation}
      />);
    }
  }, [confirmations, checkConfirmation, onAction, t, networkMap, accounts, network, setConfirmation]);

  const _onPasswordChange = useCallback(
    (p: string) => {
      setPassword(p);
    },
    []
  );

  const complete = useCallback(
    (result: boolean, payload?: any) => {
      if (currentConfirmation && currentConfirmationType) {
        setIsLoading(true);
        setError('');
        completeConfirmation(currentConfirmationType, {
          id: currentConfirmation?.id,
          isApproved: result,
          password: result ? password : undefined,
          payload: result
        }).then(() => {
          setIsLoading(false);
        }).catch((e: Error) => {
          setIsLoading(false);
          setError(e.message);
        });
      }
    },
    [currentConfirmation, currentConfirmationType, password]
  );

  const _onCancel = useCallback(() => {
    complete(false);
  }, [complete]);

  const _onApprove = useCallback(() => {
    complete(true);
  }, [complete]);

  const disableConfirm = useCallback(
    () => {
      return (requirePassword && password === '') || isLoading;
    },
    [requirePassword, password, isLoading]
  );

  return (<>
    <div className={className}>
      <Header
        showSubHeader={!!header}
        subHeaderName={header}
      />
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
      </div>
      <div className='action-area'>
        {requirePassword && (<InputWithLabel
          className='password'
          label={''}
          onChange={_onPasswordChange}
          placeholder={t<string>('Password')}
          type='password'
        />)}
        {error && (<div className='confirmation-error'>{error}</div>)}
        <ButtonArea className='button-area'>
          <Button
            className='cancel-button'
            isDisabled={isLoading}
            onClick={_onCancel}
          >{cancelLabel}</Button>
          <Button
            className='confirm-button'
            isDisabled={disableConfirm()}
            onClick={_onApprove}
          >{confirmLabel}</Button>
        </ButtonArea>
      </div>
    </div>
  </>);
}

export default withRouter(styled(Confirmation)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .confirmation-wrapper {
    overflow-y: auto;
    flex: 1;
    overflow-y: auto;
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

    span {
      color: ${theme.buttonTextColor2};
    }
  }
  
  .confirm-button {
    margin-left: 8px;
  }
  
  .action-area {
    padding: 15px;
    
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
`));
