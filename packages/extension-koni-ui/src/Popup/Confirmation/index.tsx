// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationType } from '@subwallet/extension-base/background/KoniTypes';
import { ActionContext, Button, ButtonArea, ConfirmationsQueueContext } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { completeConfirmation } from '@subwallet/extension-koni-ui/messaging';
import { Header } from '@subwallet/extension-koni-ui/partials';
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
    if (checkConfirmation('addNetworkRequest')) {
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

  const _onCancel = useCallback(() => {
    currentConfirmation && currentConfirmationType && completeConfirmation(currentConfirmationType, {
      id: currentConfirmation.id,
      isApproved: false,
      payload: false
    });
  }, [currentConfirmation, currentConfirmationType]);

  const _onApprove = useCallback(() => {
    currentConfirmation && currentConfirmationType && completeConfirmation(currentConfirmationType, {
      id: currentConfirmation.id,
      isApproved: true,
      payload: true
    });
  }, [currentConfirmation, currentConfirmationType]);

  return (<>
    <div className={className}>
      <Header
        showSubHeader={true}
        subHeaderName={header}
      />
      <div className='confirmation-info'>
        {informationBlock}
      </div>
      <ButtonArea className='button-area'>
        <Button
          className='cancel-button'
          onClick={_onCancel}
        >Cancel</Button>
        <Button
          className='confirm-button'
          onClick={_onApprove}
        >Confirm</Button>
      </ButtonArea>
    </div>
  </>);
}

export default withRouter(styled(Confirmation)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;
  
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
  
  .button-area {
    padding: 15px;
    margin: 0;
  }
`));
