// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Logo2D } from '@subwallet/extension-web-ui/components/Logo';
import { HELP_URL } from '@subwallet/extension-web-ui/constants';
import { useDefaultNavigate, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, Icon } from '@subwallet/react-ui';
import { CaretLeft, Question } from 'phosphor-react';
import React, { useCallback } from 'react';
import styled from 'styled-components';

export type Props = ThemeProps & {
  title?: string | React.ReactNode;
  onBack?: () => void;
  showBackButton?: boolean
}

function Component ({ className,
  onBack,
  showBackButton = true,
  title }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const defaultOnBack = useCallback(() => {
    goHome();
  }, [goHome]);

  return (
    <div className={className}>
      <div className='__box'>
        <div className={'__left-part'}>
          <div
            className='__logo'
            onClick={goHome}
            style={{ cursor: 'pointer' }}
          >
            <Logo2D
              height={24}
              width={24}
            />
          </div>
          {!!title && showBackButton && (
            <Button
              className='__back-button'
              icon={
                <Icon
                  customSize='28px'
                  phosphorIcon={CaretLeft}
                />
              }
              onClick={onBack || defaultOnBack}
              size='xs'
              type='ghost'
            />
          )}
        </div>
        {!!title && (
          <div className='__title-wrapper'>
            <div className={'__title'}>{title}</div>
          </div>
        )}
        <Button
          className={'__help-button'}
          icon={
            <Icon
              customSize='28px'
              phosphorIcon={Question}
              weight={'duotone'}
            />
          }
          onClick={openInNewTab(HELP_URL)}
          size='xs'
          type='ghost'
        >
          {t<string>('Help')}
        </Button>
      </div>
    </div>
  );
}

const Simple = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  width: '100%',
  padding: '24px 24px 48px',

  '.__box': {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  '.__left-part': {
    position: 'relative',
    zIndex: 5,
    maxWidth: 180,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  '.__back-button.__back-button': {
    color: token.colorTextLight1
  },

  '.__title-wrapper': {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 2
  },

  '.__title': {
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2,
    color: token.colorTextLight1,
    fontWeight: token.headingFontWeight
  },

  '.__help-button': {
    position: 'relative',
    zIndex: 5,
    right: -16
  }
}));

export default Simple;
