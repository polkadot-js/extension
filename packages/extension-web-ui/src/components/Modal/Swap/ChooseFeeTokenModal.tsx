// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-web-ui/components';
import ChooseFeeItem from '@subwallet/extension-web-ui/components/Field/Swap/ChooseFeeItem';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ModalContext, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string,
  estimatedFee: string | number | BigN,
  items: string[] | undefined,
  onSelectItem: (slug: string) => void,
  selectedItem?: string,
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, estimatedFee, items, modalId, onSelectItem, selectedItem } = props;

  const { inactiveModal } = useContext(ModalContext);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  return (
    <>
      <BaseModal
        className={CN(className, 'choose-fee-token-container')}
        closable={true}
        destroyOnClose={true}
        id={modalId}
        onCancel={onCancel}
        title={'Choose fee token'}
      >
        <div className={'__choose-fee-wrapper'}>
          <div className={'__estimate-fee'}>
            <span className={'__title'}>Estimated  fee</span>
            <Number
              className={'__value'}
              decimal={0}
              decimalOpacity={0.45}
              prefix={'$'}
              size={30}
              value={estimatedFee}
            />
            <span className={'__pay-with'}>Pay with token:</span>
          </div>
          {items && items.map((item, index) => (
            <ChooseFeeItem
              availableBalance={'100'}
              haveToPay={'100'}
              key={index}
              onSelect={onSelectItem}
              selected={!!selectedItem}
              slug={item}
            />
          ))}
        </div>
      </BaseModal>
    </>
  );
};

const ChooseFeeTokenModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__estimate-fee': {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24
    },
    '.__title': {
      fontSize: 14,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeight,
      color: token.colorTextTertiary
    },
    '.__pay-with': {
      fontSize: 14,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeight,
      color: token.colorTextTertiary
    },
    '.__value': {
      fontSize: token.fontSizeHeading2,
      lineHeight: token.lineHeightHeading2,
      fontWeight: token.fontWeightStrong,
      color: token.colorTextLight1,

      '.ant-number-integer, ant-number-prefix': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: `${token.fontWeightStrong}px !important`,
        lineHeight: 'inherit'
      },

      '.ant-number-decimal': {
        color: `${token.colorTextLight3} !important`,
        fontSize: `${token.fontSizeHeading3}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightHeading3
      }
    }

  };
});

export default ChooseFeeTokenModal;
