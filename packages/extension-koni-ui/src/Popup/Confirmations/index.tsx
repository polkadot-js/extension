// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions } from '@subwallet/extension-base/background/KoniTypes';
import { AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import useConfirmationsInfo from '@subwallet/extension-koni-ui/hooks/screen/confirmation/useConfirmationInfo';
import AddNetworkConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/AddNetworkConfirmation';
import AddTokenConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/AddTokenConfirmation';
import AuthorizeConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/AuthorizeConfirmation';
import EvmSignatureConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/EvmSignatureConfirmation';
import MetadataConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/MetadataConfirmation';
import SignConfirmation from '@subwallet/extension-koni-ui/Popup/Confirmations/SignConfirmation';
import { ConfirmationType } from '@subwallet/extension-koni-ui/stores/base/RequestState';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ConfirmationHeader from './ConfirmationHeader';

type Props = ThemeProps

const titleMap: Record<ConfirmationType, string> = {
  addNetworkRequest: 'Add Network Request',
  addTokenRequest: 'Add Token Request',
  authorizeRequest: 'Connect to SubWallet',
  evmSendTransactionRequest: 'Transaction Request',
  evmSignatureRequest: 'Signature request',
  metadataRequest: 'Update Metadata',
  signingRequest: 'Signature request',
  switchNetworkRequest: 'Add Network Request'
} as Record<ConfirmationType, string>;

const Component = function ({ className }: Props) {
  const confirmationData = useConfirmationsInfo();
  const [index, setIndex] = useState(0);
  const confirmation = confirmationData.confirmationQueue[index] || null;
  const { t } = useTranslation();

  const nextConfirmation = useCallback(() => {
    setIndex((val) => Math.min(val + 1, confirmationData.numberOfConfirmations - 1));
  }, [confirmationData.numberOfConfirmations]);

  const prevConfirmation = useCallback(() => {
    setIndex((val) => Math.max(0, val - 1));
  }, []);

  useEffect(() => {

  }, []);

  return (
    <div className={className}>
      <ConfirmationHeader
        index={index}
        numberOfConfirmations={confirmationData.numberOfConfirmations}
        onClickNext={nextConfirmation}
        onClickPrev={prevConfirmation}
        title={t(titleMap[confirmation?.type] || '')}
      />
      {confirmation?.type === 'authorizeRequest' &&
        <AuthorizeConfirmation request={confirmation.item as AuthorizeRequest} />}
      {confirmation?.type === 'metadataRequest' &&
        <MetadataConfirmation request={confirmation.item as MetadataRequest} />}
      {confirmation?.type === 'signingRequest' &&
        <SignConfirmation request={confirmation.item as SigningRequest} />}
      {confirmation?.type === 'evmSendTransactionRequest' &&
        <EvmSignatureConfirmation
          request={confirmation.item as ConfirmationDefinitions['evmSendTransactionRequest'][0]}
          type={confirmation.type}
        />}
      {confirmation?.type === 'evmSignatureRequest' &&
        <EvmSignatureConfirmation
          request={confirmation.item as ConfirmationDefinitions['evmSignatureRequest'][0]}
          type={confirmation.type}
        />}
      {confirmation?.type === 'addTokenRequest' &&
        <AddTokenConfirmation request={confirmation.item as ConfirmationDefinitions['addTokenRequest'][0]} />}
      {confirmation?.type === 'addNetworkRequest' &&
        <AddNetworkConfirmation request={confirmation.item as ConfirmationDefinitions['addNetworkRequest'][0]} />}
    </div>
  );
};

const Confirmations = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',

  '.confirmation-header': {
    paddingTop: token.sizeXS,
    paddingBottom: token.sizeXS,
    backgroundColor: 'transparent',
    marginBottom: token.marginMD,

    h4: {
      marginBottom: 0
    }
  },

  '--content-gap': token.sizeMD,

  '.confirmation-content': {
    flex: '1 1 auto',
    overflow: 'auto',
    padding: `0 ${token.padding}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--content-gap)',
    textAlign: 'center'
  },

  '.__domain': {
    marginBottom: 0
  },

  '.confirmation-footer': {
    display: 'flex',
    flexWrap: 'wrap',
    padding: token.padding,
    gap: token.sizeSM,
    marginBottom: token.margin,

    '.ant-btn': {
      flex: 1,

      '&.icon-btn': {
        flex: '0 0 52px'
      }
    }
  },

  '.title': {
    fontSize: token.fontSizeHeading4,
    lineHeight: token.lineHeightHeading4,
    color: token.colorTextBase,
    fontWeight: token.fontWeightStrong
  },

  '.description': {
    fontSize: token.fontSizeHeading6,
    lineHeight: token.lineHeightHeading6,
    color: token.colorTextDescription
  }
}));

export default Confirmations;
