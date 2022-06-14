// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationType } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext, Button, ButtonArea, ConfirmationsQueueContext, InputWithLabel } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
import EvmSignConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/EvmSignConfirmationInfo';
import SendEvmTransactionConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/SendEvmTransactionConfirmationInfo';
import SwitchNetworkConfirmationInfo from '@subwallet/extension-koni-ui/Popup/Confirmation/SwitchNetworkConfirmationInfo';
import { store } from '@subwallet/extension-koni-ui/stores';
import { NetworkConfigParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function Confirmation ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const confirmations = useContext(ConfirmationsQueueContext);
  const onAction = useContext(ActionContext);
  const [header, setHeader] = useState<string>('');
  const [currentConfirmation, setCurrentConfirmation] = useState<ConfirmationDefinitions['addNetworkRequest'| 'switchNetworkRequest' | 'evmSignatureRequest' | 'evmSendTransactionRequest'][0] | undefined>(undefined);
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

  useEffect(() => {
    if (checkConfirmation('evmSignatureRequest')) {
      const confirmation = Object.values(confirmations.evmSignatureRequest)[0];

      setInformationBlock(<EvmSignConfirmationInfo confirmation={confirmation} />);

      setRequirePassword(confirmation.requiredPassword);

      setHeader(t<string>('Sign Message'));
      setCurrentConfirmation(confirmation);
      setCurrentConfirmationType('evmSignatureRequest');
    } else if (checkConfirmation('evmSendTransactionRequest')) {
      const confirmation = Object.values(confirmations.evmSendTransactionRequest)[0];

      setInformationBlock(<SendEvmTransactionConfirmationInfo confirmation={confirmation} />);

      setRequirePassword(confirmation.requiredPassword);

      setHeader(t<string>('Send Transaction'));
      setCurrentConfirmation(confirmation);
      setCurrentConfirmationType('evmSendTransactionRequest');
    } else if (checkConfirmation('addNetworkRequest')) {
      const confirmation = Object.values(confirmations.addNetworkRequest)[0];
      const { id, payload } = confirmation;

      setCurrentConfirmation(confirmation);
      setCurrentConfirmationType('addNetworkRequest');

      payload.requestId = id;
      store.dispatch({ type: 'networkConfigParams/update', payload: { data: payload, mode: 'create' } as NetworkConfigParams });

      window.localStorage.setItem('popupNavigation', '/account/config-network');
      onAction('/account/config-network');
    } else if (checkConfirmation('switchNetworkRequest')) {
      const confirmation = Object.values(confirmations.switchNetworkRequest)[0];

      setInformationBlock(<SwitchNetworkConfirmationInfo confirmation={confirmation} />);

      setHeader(t<string>('Switch network'));
      setCurrentConfirmation(confirmation);
      setCurrentConfirmationType('switchNetworkRequest');
    }
  }, [confirmations, checkConfirmation, onAction, t]);

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
        showSubHeader={true}
        subHeaderName={header}
      />
      {currentConfirmation && <div className='requester-info'>
        Request from: <span className='address'>{currentConfirmation?.url}</span>
      </div>}
      <div className='confirmation-info'>
        {informationBlock}
      </div>
      <div className='action-area'>
        <InputWithLabel
          className='password'
          label={''}
          onChange={_onPasswordChange}
          placeholder={t<string>('Password')}
          type='password'
        />
        {error && (<div className={'error'}>{error}</div>)}
        <ButtonArea className='button-area'>
          <Button
            className='cancel-button'
            isDisabled={isLoading}
            onClick={_onCancel}
          >Cancel</Button>
          <Button
            className='confirm-button'
            isDisabled={disableConfirm()}
            onClick={_onApprove}
          >Confirm</Button>
        </ButtonArea>
      </div>
    </div>
  </>);
}

export default withRouter(styled(Confirmation)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .requester-info {
   padding: 15px;
   display: flex;
   white-space: nowrap;
   border-bottom: 1px solid rgba(128,128,128,0.2);
   
   .address {
    color: #7B8098;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 8px;
   }  
  }
  
  .confirmation-info {
    padding: 15px;
    overflow-y: auto;
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
  
  .button-area {
    
  }
`));
