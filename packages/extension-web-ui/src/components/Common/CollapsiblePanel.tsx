// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretDown, CaretUp } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  initOpen?: boolean;
  title: string;
  children?: React.ReactNode | React.ReactNode[]
}

const Component: React.FC<Props> = (props: Props) => {
  const { children, className, initOpen, title } = props;
  const [isOpen, setIsOpen] = useState(!!initOpen);

  const handleFilterOpening = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      <div className={CN(className, {
        '-open': isOpen,
        '-close': !isOpen
      })}
      >
        <div
          className={'__panel-header'}
          onClick={handleFilterOpening}
        >
          <div className='__panel-title'>{title}</div>
          <div className='__panel-icon'>
            <Icon
              phosphorIcon={isOpen ? CaretUp : CaretDown}
              size='sm'
            />
          </div>
        </div>
        <div className={CN('__panel-body', {
          hidden: !isOpen
        })}
        >
          {children}
        </div>
      </div>
    </>
  );
};

const CollapsiblePanel = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgSecondary,

    '.__panel-header': {
      display: 'flex',
      alignItems: 'center',
      gap: token.sizeXS,
      cursor: 'pointer',
      padding: token.paddingXXS,
      paddingLeft: token.padding
    },

    '.__panel-title': {
      'white-space': 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      flex: 1,
      color: token.colorTextLight2
    },

    '.__panel-icon': {
      minWidth: 40,
      height: 40,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: token.colorTextLight3
    },

    '.__panel-body': {
      padding: token.padding,
      paddingTop: token.paddingXXS,
      paddingLeft: 24
    }
  });
});

export default CollapsiblePanel;
