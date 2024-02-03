// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, VoidFunction } from '@subwallet/extension-web-ui/types';
import { Button, Logo, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

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
      <SwModal
        className={CN(className)}
        footer={(
          <Button
            block={true}
            onClick={connectChain}
          >
            {t('Enable')}
          </Button>
        )}
        id={modalId}
        onCancel={onCancel}
        title={t('Enable network?')}
      >
        <div className='__logo-wrapper'>
          <Logo
            className={'__logo'}
            network={chain}
            size={100}
          />
        </div>

        <div className={'__message'}>
          {t('Your selected network is currently disabled. Enable it to start using.')}
        </div>
      </SwModal>
    </>
  );
};

const ConnectChainModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__logo-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: token.marginSM
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
