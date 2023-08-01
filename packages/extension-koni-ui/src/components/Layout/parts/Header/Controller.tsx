// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CUSTOMIZE_MODAL } from '@subwallet/extension-koni-ui/constants';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretLeft, FadersHorizontal } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

import Accounts from './Accounts';
import Networks from './Networks';

export type Props = ThemeProps & {
  title?: string | React.ReactNode;
  onBack?: () => void
  showBackButton?: boolean
}

function Component ({ className, onBack, showBackButton, title = '' }: Props): React.ReactElement<Props> {
  const { activeModal } = useContext(ModalContext);

  const backButton = useMemo(() => {
    if (showBackButton && onBack) {
      return (
        <Button
          icon={
            (
              <Icon
                phosphorIcon={CaretLeft}
                size={'lg'}
              />
            )
          }
          onClick={onBack}
          size={'xs'}
          type='ghost'
        />
      );
    }

    return null;
  }, [onBack, showBackButton]);

  const onOpenCustomizeModal = useCallback(() => {
    activeModal(CUSTOMIZE_MODAL);
  }, [activeModal]);

  return (
    <div className={CN(className)}>
      <div className='common-header'>
        <div className='title-group'>
          {backButton}
          <Typography.Title className='page-name'>{title}</Typography.Title>
        </div>
        <div className='action-group'>
          <Button
            icon={(
              <Icon
                phosphorIcon={FadersHorizontal}
                size={'sm'}
              />
            )}
            onClick={onOpenCustomizeModal}
            size={'xs'}
            type={'ghost'}
          />
          <Networks />
          <Accounts />
        </div>
      </div>
    </div>
  );
}

const Controller = styled(Component)<Props>(({ theme }: Props) => ({
  width: '100%',

  '.common-header': {
    display: 'flex',
    justifyContent: 'space-between',

    '.title-group': {
      display: 'flex',
      justifyContent: 'start',
      alignItems: 'center',

      '.page-name': {
        fontSize: 30,
        lineHeight: '38px',
        color: '#FFF',
        margin: 0
      }
    },

    '.action-group': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',

      '.trigger-container': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        margin: '0 4px',
        padding: '10px 16px',
        gap: 8,
        background: '#1A1A1A',
        borderRadius: 32,

        '.ant-btn': {
          height: 'fit-content',
          minWidth: 'unset',
          width: 'fit-content'
        },

        '.ava-group': {
          '.__account-item': {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        }
      }
    }
  }
}));

export default Controller;
