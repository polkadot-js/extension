// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, SwModal } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';
import CN from 'classnames';

type Props = ThemeProps & {
  modalId: string,
  title: string,
  content: React.ReactNode
  onCancel?: () => void;
  onOk: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { modalId, content, title, className, onCancel, onOk} = props;

  return (
    <>
      <SwModal
        className={CN(className)}
        id={modalId}
        title={title}
        closable={false}
        footer={
          <div className={'modal_btn'}>
            {!!onCancel &&
              <Button
                schema={'secondary'}
                className={'__left-btn'}
                block={true}
                onClick={onCancel}>
                Cancel
              </Button>
            }
            <Button
              schema={'warning'}
              block={true}
              className={'__right-btn'}
              onClick={onOk}>
              Ok
            </Button>
          </div>
        }
      >
        <div className='modal_content'>
          {content}
        </div>
      </SwModal>
    </>
  );
};

const AlertModal = styled(Component)<Props>(({ theme: {token}}: Props) => {
  return {
    '.modal_content': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      color: token.colorTextDescription,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },
    '.modal_btn': {
      display: 'flex',
      justifyContent: 'row',
      gap: token.sizeSM
    }
  };
});

export default AlertModal;
