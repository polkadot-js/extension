// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ActivityIndicator, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string,
  loadingText?: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, loadingText, modalId } = props;

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={false}
        id={modalId}
      >
        <ActivityIndicator size={32} />
        {loadingText && (
          <div className={'__loading-text'}>
            {loadingText}
          </div>
        )}
      </SwModal>
    </>
  );
};

const LoadingModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    height: '100%',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '.ant-sw-modal-content.ant-sw-modal-content': {
      width: 'auto',
      minWidth: 150,
      borderRadius: token.borderRadiusXL,
      maxHeight: 'none',
      borderBottom: 0,
      paddingBottom: token.padding
    },

    '.ant-sw-modal-body.ant-sw-modal-body': {
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.sizeXS
    },

    '.__loading-text': {
      color: token.colorTextLight1,
      lineHeight: token.lineHeight,
      fontSize: token.fontSize
    }
  };
});

export default LoadingModal;
