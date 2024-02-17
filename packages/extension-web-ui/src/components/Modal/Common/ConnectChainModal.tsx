// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-web-ui/components';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, VoidFunction } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Logo } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import LogoWithSquircleBorder from '../../Logo/LogoWithSquircleBorder';

type Props = ThemeProps & {
  modalId: string,
  onConnectChain: (chain: string) => void,
  onCancel: VoidFunction,
  chain: string
}

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, modalId, onCancel, onConnectChain } = props;
  const { t } = useTranslation();

  const connectChain = useCallback(() => {
    onConnectChain(chain);
  }, [chain, onConnectChain]);

  return (
    <>
      <BaseModal
        center={true}
        className={CN(className)}
        footer={(
          <>
            <Button
              block={true}
              icon={(
                <Icon
                  phosphorIcon={XCircle}
                  weight={'fill'}
                />
              )}
              onClick={onCancel}
              schema={'secondary'}
            >
              {t('Cancel')}
            </Button>
            <Button
              block={true}
              icon={(
                <Icon
                  phosphorIcon={CheckCircle}
                  weight={'fill'}
                />
              )}
              onClick={connectChain}
            >
              {t('Enable')}
            </Button>
          </>
        )}
        id={modalId}
        onCancel={onCancel}
        title={t('Enable network')}
      >
        <div className={'__modal-content'}>
          <div className='__logo-wrapper'>
            <LogoWithSquircleBorder
              innerSize={52}
              size={112}
            >
              <Logo
                className={'__logo'}
                network={chain}
                size={52}
              />
            </LogoWithSquircleBorder>
          </div>

          <div className={'__message'}>
            {t('Your selected network is currently disabled. Enable it to start using.')}
          </div>
        </div>
      </BaseModal>
    </>
  );
};

const ConnectChainModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-body': {
      paddingBottom: 0
    },

    '.ant-sw-modal-footer': {
      display: 'flex',
      borderTop: 0,
      gap: token.sizeXXS
    },

    '.__modal-content': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      paddingTop: token.padding
    },

    '.__logo-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 20
    },

    '.__message': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      textAlign: 'center'
    }
  };
});

export default ConnectChainModal;
