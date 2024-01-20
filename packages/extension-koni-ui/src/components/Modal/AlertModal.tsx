// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertDialogProps, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & AlertDialogProps & {
  modalId: string
}

const Component: React.FC<Props> = (props: Props) => {
  const { cancelButton, className, content, modalId, okButton, title } = props;

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={false}
        footer={
          <div className={'__modal-button'}>
            {!!cancelButton &&
              <Button
                block={true}
                className={'__left-btn'}
                onClick={cancelButton.onClick}
                schema={cancelButton.schema || 'secondary'}
              >
                {cancelButton.text}
              </Button>
            }
            <Button
              block={true}
              className={'__right-btn'}
              onClick={okButton?.onClick}
              schema={okButton.schema}
            >
              {okButton.text}
            </Button>
          </div>
        }
        id={modalId}
        title={title}
      >
        <div className='__modal-content'>
          {content}
        </div>
      </SwModal>
    </>
  );
};

const AlertModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__modal-content': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      color: token.colorTextDescription,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },
    '.__modal-button': {
      display: 'flex'
    }
  };
});

export default AlertModal;
