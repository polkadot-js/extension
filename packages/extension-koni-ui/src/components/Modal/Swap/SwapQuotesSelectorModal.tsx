// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapQuote } from '@subwallet/extension-base/types/swap';
import SwapQuotesItem from '@subwallet/extension-koni-ui/components/Field/Swap/SwapQuotesItem';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string,
  items: SwapQuote[],
  onSelectItem: (quote: SwapQuote) => void;
  selectedItem?: SwapQuote,
  optimalQuoteItem?: SwapQuote
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, items, modalId, onSelectItem, optimalQuoteItem, selectedItem } = props;

  const { inactiveModal } = useContext(ModalContext);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={true}
        destroyOnClose={true}
        id={modalId}
        onCancel={onCancel}
        title={'Swap quotes'}
      >
        {items.map((item) => (
          <SwapQuotesItem
            isRecommend={optimalQuoteItem?.provider.id === item.provider.id}
            key={item.provider.id}
            onSelect={onSelectItem}
            quote={item}
            selected={selectedItem?.provider.id === item.provider.id}
          />
        ))}
      </SwModal>
    </>
  );
};

const SwapQuotesSelectorModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default SwapQuotesSelectorModal;
