// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-web-ui/components';
import SwapQuotesItem from '@subwallet/extension-web-ui/components/Field/Swap/SwapQuotesItem';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string
}
const fakedatas =
  [{
    symbol: 'DOT',
    estReceiveValue: '500',
    recommendIcon: true,
    selected: true
  },
  {
    symbol: 'KSM',
    estReceiveValue: '600',
    recommendIcon: false
  },
  {
    symbol: 'AZERO',
    estReceiveValue: '700',
    recommendIcon: true
  }
  ];

const Component: React.FC<Props> = (props: Props) => {
  const { className, modalId } = props;

  const { inactiveModal } = useContext(ModalContext);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  return (
    <>
      <BaseModal
        className={CN(className)}
        closable={true}
        destroyOnClose={true}
        id={modalId}
        onCancel={onCancel}
        title={'Swap quotes'}
      >
        {fakedatas.map((fakedata, index) => (
          <SwapQuotesItem
            estReceiveValue={fakedata.estReceiveValue}
            key={index}
            recommendIcon={fakedata.recommendIcon}
            selected={fakedata.selected}
            symbol={fakedata.symbol}
          />
        ))}
      </BaseModal>
    </>
  );
};

const AllSwapQuotesModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default AllSwapQuotesModal;
