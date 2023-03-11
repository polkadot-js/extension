// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueueItem, EvmSignatureRequest } from '@subwallet/extension-base/background/KoniTypes';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import ViewDetailIcon from '@subwallet/extension-koni-ui/components/Icon/ViewDetailIcon';
import useOpenDetailModal from '@subwallet/extension-koni-ui/hooks/confirmation/useOpenDetailModal';
import BaseDetailModal from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/BaseDetailModal';
import EvmMessageDetail from '@subwallet/extension-koni-ui/Popup/Confirmations/Detail/Evm/Message';
import EvmSignArea from '@subwallet/extension-koni-ui/Popup/Confirmations/Sign/Evm';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { EvmSignatureSupportType } from '@subwallet/extension-koni-ui/types/confirmation';
import { isEvmMessage } from '@subwallet/extension-koni-ui/util';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  type: EvmSignatureSupportType
  request: ConfirmationsQueueItem<EvmSignatureRequest>
}

function Component ({ className, request, type }: Props) {
  const { id, payload } = request;
  const { t } = useTranslation();
  const { account } = payload;

  const isMessage = isEvmMessage(request);

  const onClickDetail = useOpenDetailModal();

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          {isMessage ? t('Signature request') : t('Approve Request')}
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
      <EvmSignArea
        id={id}
        payload={request}
        type={type}
      />
      <BaseDetailModal
        title={t('Message details')}
      >
        <EvmMessageDetail payload={request.payload} />
      </BaseDetailModal>
    </>
  );
}

const EvmSignatureConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.__prop-label': {
      marginRight: token.marginMD,
      width: '50%',
      float: 'left'
    }
  },

  '.__label': {
    textAlign: 'left'
  }
}));

export default EvmSignatureConfirmation;
