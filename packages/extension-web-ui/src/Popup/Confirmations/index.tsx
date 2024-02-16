// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import { WalletConnectNotSupportRequest, WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { AlertModal } from '@subwallet/extension-web-ui/components';
import { NEED_SIGN_CONFIRMATION } from '@subwallet/extension-web-ui/constants';
import { useAlert, useConfirmationsInfo, useSelector } from '@subwallet/extension-web-ui/hooks';
import { ConfirmationType } from '@subwallet/extension-web-ui/stores/base/RequestState';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { isRawPayload } from '@subwallet/extension-web-ui/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SignerPayloadJSON } from '@polkadot/types/types';

import { ConfirmationHeader } from './parts';
import { AddNetworkConfirmation, AddTokenConfirmation, AuthorizeConfirmation, ConnectWalletConnectConfirmation, EvmSignatureConfirmation, EvmTransactionConfirmation, MetadataConfirmation, NotSupportConfirmation, NotSupportWCConfirmation, SignConfirmation, TransactionConfirmation } from './variants';

type Props = ThemeProps

const titleMap: Record<ConfirmationType, string> = {
  addNetworkRequest: detectTranslate('Add network request'),
  addTokenRequest: detectTranslate('Add token request'),
  authorizeRequest: detectTranslate('Connect with SubWallet'),
  evmSendTransactionRequest: detectTranslate('Transaction request'),
  evmSignatureRequest: detectTranslate('Signature request'),
  metadataRequest: detectTranslate('Update metadata'),
  signingRequest: detectTranslate('Signature request'),
  switchNetworkRequest: detectTranslate('Add network request'),
  connectWCRequest: detectTranslate('WalletConnect'),
  notSupportWCRequest: detectTranslate('WalletConnect')
} as Record<ConfirmationType, string>;

const alertModalId = 'confirmation-alert-modal';

const Component = function ({ className }: Props) {
  const { confirmationQueue, numberOfConfirmations } = useConfirmationsInfo();
  const [index, setIndex] = useState(0);
  const confirmation = confirmationQueue[index] || null;
  const { t } = useTranslation();
  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);

  const { transactionRequest } = useSelector((state) => state.requestState);

  const nextConfirmation = useCallback(() => {
    setIndex((val) => Math.min(val + 1, numberOfConfirmations - 1));
  }, [numberOfConfirmations]);

  const prevConfirmation = useCallback(() => {
    setIndex((val) => Math.max(0, val - 1));
  }, []);

  const content = useMemo((): React.ReactNode => {
    if (!confirmation) {
      return null;
    }

    if (NEED_SIGN_CONFIRMATION.includes(confirmation.type)) {
      let account: AccountJson | undefined;
      let canSign = true;
      let isMessage = false;

      if (confirmation.type === 'signingRequest') {
        const request = confirmation.item as SigningRequest;
        const _isMessage = isRawPayload(request.request.payload);

        account = request.account;

        if (account.isHardware) {
          if (_isMessage) {
            canSign = false;
          } else {
            const payload = request.request.payload as SignerPayloadJSON;

            canSign = !!account.availableGenesisHashes?.includes(payload.genesisHash);
          }
        } else {
          canSign = true;
        }

        isMessage = _isMessage;
      } else if (['evmSignatureRequest', 'evmSendTransactionRequest', 'evmWatchTransactionRequest'].includes(confirmation.type)) {
        const request = confirmation.item as ConfirmationDefinitions['evmSignatureRequest' | 'evmSendTransactionRequest' | 'evmWatchTransactionRequest'][0];

        account = request.payload.account;
        canSign = request.payload.canSign;
        isMessage = confirmation.type === 'evmSignatureRequest';
      }

      if (account?.isReadOnly || !canSign) {
        return (
          <NotSupportConfirmation
            account={account}
            isMessage={isMessage}
            request={confirmation.item}
            type={confirmation.type}
          />
        );
      }
    }

    if (confirmation.item.isInternal) {
      return (
        <TransactionConfirmation
          closeAlert={closeAlert}
          confirmation={confirmation}
          openAlert={openAlert}
        />
      );
    }

    switch (confirmation.type) {
      case 'addNetworkRequest':
        return <AddNetworkConfirmation request={confirmation.item as ConfirmationDefinitions['addNetworkRequest'][0]} />;
      case 'addTokenRequest':
        return <AddTokenConfirmation request={confirmation.item as ConfirmationDefinitions['addTokenRequest'][0]} />;
      case 'evmSignatureRequest':
        return (
          <EvmSignatureConfirmation
            request={confirmation.item as ConfirmationDefinitions['evmSignatureRequest'][0]}
            type={confirmation.type}
          />
        );
      case 'evmSendTransactionRequest':
        return (
          <EvmTransactionConfirmation
            request={confirmation.item as ConfirmationDefinitions['evmSendTransactionRequest'][0]}
            type={confirmation.type}
          />
        );
      case 'authorizeRequest':
        return (
          <AuthorizeConfirmation request={confirmation.item as AuthorizeRequest} />
        );
      case 'metadataRequest':
        return (
          <MetadataConfirmation request={confirmation.item as MetadataRequest} />
        );
      case 'signingRequest':
        return (
          <SignConfirmation request={confirmation.item as SigningRequest} />
        );
      case 'connectWCRequest':
        return (
          <ConnectWalletConnectConfirmation request={confirmation.item as WalletConnectSessionRequest} />
        );
      case 'notSupportWCRequest':
        return (<NotSupportWCConfirmation request={confirmation.item as WalletConnectNotSupportRequest} />);
    }

    return null;
  }, [closeAlert, confirmation, openAlert]);

  const headerTitle = useMemo((): string => {
    if (!confirmation) {
      return '';
    }

    if (confirmation.item.isInternal) {
      const transaction = transactionRequest[confirmation.item.id];

      if (!transaction) {
        return t(titleMap[confirmation.type] || '');
      }

      switch (transaction.extrinsicType) {
        case ExtrinsicType.TRANSFER_BALANCE:
        case ExtrinsicType.TRANSFER_TOKEN:
        case ExtrinsicType.TRANSFER_XCM:
        case ExtrinsicType.SEND_NFT:
          return t('Transfer confirmation');
        case ExtrinsicType.STAKING_JOIN_POOL:
        case ExtrinsicType.STAKING_BOND:
          return t('Add to bond confirm');
        case ExtrinsicType.STAKING_LEAVE_POOL:
        case ExtrinsicType.STAKING_UNBOND:
          return t('Unbond confirm');
        case ExtrinsicType.STAKING_WITHDRAW:
          return t('Withdrawal confirm');
        case ExtrinsicType.STAKING_CLAIM_REWARD:
          return t('Claim rewards confirm');
        case ExtrinsicType.STAKING_CANCEL_UNSTAKE:
          return t('Cancel unstake confirm');
        default:
          return t('Transaction confirm');
      }
    } else {
      return t(titleMap[confirmation.type] || '');
    }
  }, [confirmation, t, transactionRequest]);

  useEffect(() => {
    if (numberOfConfirmations) {
      if (index >= numberOfConfirmations) {
        setIndex(numberOfConfirmations - 1);
      }
    }
  }, [index, numberOfConfirmations]);

  return (
    <>
      <div className={className}>
        <ConfirmationHeader
          index={index}
          numberOfConfirmations={numberOfConfirmations}
          onClickNext={nextConfirmation}
          onClickPrev={prevConfirmation}
          title={headerTitle}
        />
        {content}
      </div>
      {
        !!alertProps && (
          <AlertModal
            modalId={alertModalId}
            {...alertProps}
          />
        )
      }
    </>
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
    marginBottom: token.marginXS,

    h4: {
      marginBottom: 0
    }
  },

  '--content-gap': `${token.sizeMD}px`,

  '.confirmation-content': {
    flex: '1',
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

    '.warning-message': {
      width: '100%',
      color: token.colorWarning
    },

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
