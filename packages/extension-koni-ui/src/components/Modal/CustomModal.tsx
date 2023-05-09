// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwModal } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  id: string;
  onCancel: () => void;
  title?: string | React.ReactNode;
  closeIcon?: React.ReactNode;
  children: React.ReactElement
  footer?: React.ReactNode;
}

function Component (props: Props): React.ReactElement<Props> {
  const { className = '', closeIcon, id, onCancel, title, footer, children } = props;

  return (
    <SwModal
      className={className}
      closeIcon={closeIcon}
      footer={footer}
      id={id}
      onCancel={onCancel}
      title={title}
    >
      {children}
    </SwModal>
  );
}

export const CustomModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

    '.ant-sw-modal-content': {
      maxHeight: 'unset',
    },

    '.ant-sw-modal-body': {
      paddingBottom: token.paddingXS,
    },

    '.ant-sw-modal-footer': {
      borderTop: 0
    },

    '.__option-item': {
      display: 'flex'
    },


    '.ant-checkbox-wrapper': {
      display: 'flex',
      alignItems: 'center'
    }
  });
});
