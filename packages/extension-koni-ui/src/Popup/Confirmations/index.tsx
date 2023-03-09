// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions } from '@subwallet/extension-base/background/KoniTypes';
import { AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import useConfirmationsInfo from '@subwallet/extension-koni-ui/hooks/screen/confirmation/useConfirmationInfo';
import AuthorizeConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/AuthorizeConfirmation';
import EvmSignConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/EvmSignConfirmation';
import MetadataConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/MetadataConfirmation';
import SignConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/SignConfirmation';
import { ConfirmationType } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ConfirmationHeader from './ConfirmationHeader';

type Props = ThemeProps

const Component = function ({ className }: Props) {
  const confirmationData = useConfirmationsInfo();
  const [index, setIndex] = useState(0);
  const confirmation = confirmationData.confirmationQueue[index] || null;
  const { t } = useTranslation();

  const titleMap = useMemo<Record<ConfirmationType, string>>(() => ({
    authorizeRequest: t('Connect to SubWallet'),
    metadataRequest: t('Update Metadata'),
    signingRequest: t('Signing Request'),
    addNetworkRequest: t('Add Network Request'),
    addTokenRequest: t('Add Token Request'),
    switchNetworkRequest: t('Add Network Request'),
    evmSignatureRequest: t('Signing Request'),
    evmSignatureRequestExternal: t('Signing Request'),
    evmSendTransactionRequest: t('Transaction Request'),
    evmSendTransactionRequestExternal: t('Transaction Request')
  } as Record<ConfirmationType, string>), [t]);

  const nextConfirmation = useCallback(() => {
    setIndex((val) => Math.min(val + 1, confirmationData.numberOfConfirmations - 1));
  }, [confirmationData.numberOfConfirmations]);

  const prevConfirmation = useCallback(() => {
    setIndex((val) => Math.max(0, val - 1));
  }, []);

  return <div className={className}>
    <ConfirmationHeader
      index={index}
      numberOfConfirmations={confirmationData.numberOfConfirmations}
      onClickNext={nextConfirmation}
      onClickPrev={prevConfirmation}
      title={titleMap[confirmation?.type] || ''}
    />
    {confirmation?.type === 'authorizeRequest' &&
      <AuthorizeConfirmation request={confirmation.item as AuthorizeRequest} />}
    {confirmation?.type === 'metadataRequest' &&
      <MetadataConfirmation request={confirmation.item as MetadataRequest} />}
    {confirmation?.type === 'signingRequest' &&
      <SignConfirmation request={confirmation.item as SigningRequest} />}
    {confirmation?.type === 'evmSendTransactionRequest' &&
      <EvmSignConfirmation
        request={confirmation.item as ConfirmationDefinitions['evmSendTransactionRequest'][0]}
        type={confirmation.type}
      />}
    {confirmation?.type === 'evmSignatureRequest' &&
      <EvmSignConfirmation
        request={confirmation.item as ConfirmationDefinitions['evmSignatureRequest'][0]}
        type={confirmation.type}
      />}
  </div>;
};

const Confirmations = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',

  '.confirmation-header': {
    paddingTop: token.sizeXS,
    paddingBottom: token.sizeXS,
    backgroundColor: 'transparent',

    h4: {
      marginBottom: 0
    }
  },

  '.confirmation-content': {
    flex: '1 1 auto',
    overflow: 'auto',
    padding: token.paddingSM
  },

  '.confirmation-footer': {
    display: 'flex',
    flexWrap: 'wrap',
    padding: token.paddingSM,
    gap: token.sizeSM,

    '.ant-btn': {
      flex: '1 1 auto',

      '&.icon-btn': {
        flex: '0 0 52px'
      }
    }
  }
}));

export default Confirmations;