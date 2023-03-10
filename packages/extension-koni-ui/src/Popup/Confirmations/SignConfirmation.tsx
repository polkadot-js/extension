// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SigningRequest } from '@subwallet/extension-base/background/types';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import ViewDetailIcon from '@subwallet/extension-koni-ui/components/Icon/ViewDetailIcon';
import useOpenDetailModal from '@subwallet/extension-koni-ui/hooks/confirmation/useOpenDetailModal';
import useParseSubstrateRequestPayload from '@subwallet/extension-koni-ui/hooks/confirmation/useParseSubstrateRequestPayload';
import BaseDetailModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/BaseDetailModal';
import SubstrateExtrinsic from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Substrate/Extrinsic';
import SubstrateMessageDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Substrate/Message';
import SubstrateSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Substrate';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isSubstrateMessage } from '@subwallet/extension-koni-ui/util';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SignerPayloadJSON } from '@polkadot/types/types';

interface Props extends ThemeProps {
  request: SigningRequest;
}

function Component ({ className, request }: Props) {
  const { account } = request;

  const { t } = useTranslation();
  const payload = useParseSubstrateRequestPayload(request.request);

  const onClickDetail = useOpenDetailModal();

  const isMessage = isSubstrateMessage(payload);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          {t('Signature request')}
        </div>
        <div className='description'>
          {t('You are approving a request with account')}
        </div>
        <AccountItemWithName
          accountName={account.name}
          address={account.address}
          avatarSize={24}
          className='account-item'
          isSelected={true}
        />
        <div>
          <Button
            icon={<ViewDetailIcon />}
            onClick={onClickDetail}
            size='xs'
            type='ghost'
          >
            {t('View detail')}
          </Button>
        </div>
      </div>
      <SubstrateSignArea
        account={account}
        id={request.id}
        payload={payload}
      />
      <BaseDetailModal
        title={isMessage ? t('Message details') : t('Transaction details')}
      >
        {isMessage
          ? (
            <SubstrateMessageDetail bytes={payload} />
          )
          : (
            <SubstrateExtrinsic
              account={account}
              payload={payload}
              request={request.request.payload as SignerPayloadJSON}
            />
          )
        }
      </BaseDetailModal>
    </>
  );
}

const SignConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.__prop-label': {
      marginRight: token.marginMD,
      width: '50%',
      float: 'left'
    }
  }
}));

export default SignConfirmation;
