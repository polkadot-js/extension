// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import NetworkGroupItem from '@subwallet/extension-web-ui/components/MetaInfo/parts/NetworkGroupItem';
import { CUSTOMIZE_MODAL } from '@subwallet/extension-web-ui/constants';
import useChainInfoWithState from '@subwallet/extension-web-ui/hooks/chain/useChainInfoWithState';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretDown } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

const Component: React.FC<ThemeProps> = ({ className }: ThemeProps) => {
  const chainInfoList = useChainInfoWithState();
  const { activeModal } = useContext(ModalContext);

  const openModal = useCallback(() => {
    activeModal(CUSTOMIZE_MODAL);
  }, [activeModal]);

  return (
    <div
      className={CN('trigger-container', className)}
      onClick={openModal}
    >
      <NetworkGroupItem
        chains={chainInfoList}
        className='ava-group'
        content={`${chainInfoList.length} networks`}
      />
      <Icon
        phosphorIcon={CaretDown}
        weight={'bold'}
      />
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Networks = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    '.__account-item': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    '.__account-name': {
      'white-space': 'nowrap',
      maxWidth: 200,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: token.colorTextLight1
    },
    '.anticon': {
      fontSize: 12,
      color: token.colorTextLight3
    },

    '&:hover': {
      '.__account-name': {
        color: token.colorTextLight3
      }
    }
  };
});

export default Networks;
