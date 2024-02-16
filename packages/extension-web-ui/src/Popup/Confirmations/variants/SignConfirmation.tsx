// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SigningRequest } from '@subwallet/extension-base/background/types';
import { AccountItemWithName, ConfirmationGeneralInfo, ViewDetailIcon } from '@subwallet/extension-web-ui/components';
import { useOpenDetailModal, useParseSubstrateRequestPayload } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { isSubstrateMessage } from '@subwallet/extension-web-ui/utils';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SignerPayloadJSON } from '@polkadot/types/types';

import { BaseDetailModal, SubstrateExtrinsic, SubstrateMessageDetail, SubstrateSignArea } from '../parts';

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
          {t('You are approving a request with the following account')}
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
            {t('View details')}
          </Button>
        </div>
      </div>
      <SubstrateSignArea
        account={account}
        id={request.id}
        request={request.request}
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
