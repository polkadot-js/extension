// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BackIcon } from '@subwallet/extension-koni-ui/components';
import InfoIcon from '@subwallet/extension-koni-ui/components/Icon/InfoIcon';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, SwModal, SwQRCode } from '@subwallet/react-ui';
import AccountItem from '@subwallet/react-ui/es/web3-block/account-item';
import CN from 'classnames';
import { CopySimple } from 'phosphor-react';
import React, { useCallback } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  id: string;
  address?: string;
  onBack?: () => void;
}

const Component: React.FC<Props> = ({ address, className, id: modalId, onBack }: Props) => {
  const { t } = useTranslation();
  const notify = useNotification();
  const onClickCopyBtn = useCallback(() => notify({ message: t('Copied to clipboard') }), [notify, t]);
  const isEvmAddress = isEthereumAddress(address);

  return (
    <SwModal
      className={CN(className)}
      closeIcon={(<BackIcon />)}
      id={modalId}
      onCancel={onBack}
      rightIconProps={{
        icon: <InfoIcon />
      }}
      title={t<string>('Your address')}
    >
      <div className='__qr-code-wrapper'>
        <SwQRCode
          color='#000'
          errorLevel='H'
          logoPadding={isEvmAddress ? 6 : 7 }
          size={264}
          value={address || ''}
        />
      </div>

      <div className={'__qr-account-item-wrapper'}>
        <AccountItem
          address={address || ''}
          addressPreLength={7}
          addressSufLength={7}
          avatarIdentPrefix={42}
          avatarSize={24}
          className={'__qr-account-item'}
          rightItem={
            <CopyToClipboard text={address || ''}>
              <Button
                className='__copy-button'
                icon={
                  <Icon
                    phosphorIcon={CopySimple}
                    size='sm'
                  />
                }
                onClick={onClickCopyBtn}
                size='xs'
                tooltip={t('Copy address')}
                type='ghost'
              />
            </CopyToClipboard>
          }
        />
      </div>
    </SwModal>
  );
};

const SimpleQrModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.disabled': {
      opacity: 0.4,

      '.ant-web3-block': {
        cursor: 'not-allowed',

        '&:hover': {
          backgroundColor: token['gray-1']
        }
      }
    },

    '.ant-web3-block-middle-item': {
      width: 'auto'
    },
    '.ant-account-item': {
      backgroundColor: token.colorBgSecondary
    },

    '.__qr-account-item-wrapper': {
      display: 'flex',
      marginTop: token.margin,
      marginBottom: token.margin,
      justifyContent: 'center'
    },

    '.__qr-account-item': {
      position: 'relative',
      paddingTop: token.paddingXXS,
      paddingBottom: token.paddingXXS,

      '.ant-account-item-address': {
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        color: token.colorTextLight4,
        fontWeight: token.bodyFontWeight,
        paddingRight: token.paddingXS
      }
    },

    '.__qr-code-wrapper': {
      display: 'flex',
      paddingTop: token.padding,
      flex: 1,
      justifyContent: 'center'
    },

    '.__copy-button': {
      color: token.colorTextLight3,

      '&:hover': {
        color: token.colorTextLight2
      }
    }
  };
});

export default SimpleQrModal;
