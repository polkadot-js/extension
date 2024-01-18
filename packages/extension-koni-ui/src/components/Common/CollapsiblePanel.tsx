// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretDown, CaretUp } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  open?: boolean;
  title: string;
  children: React.ReactNode | React.ReactNode[]
}

const Component: React.FC<Props> = (props: Props) => {
  const { children, className, open, title } = props;
  const [isOpen, setIsOpen] = useState(open);

  const handleFilterOpening = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  console.log('isOpen', isOpen);

  return (
    <>
      <div className={CN(className, {
        '-colapsible': !isOpen
      })}
      >
        <div>
          <div className='item-panel-container'>
            <div className={'item-panel'}>
              <div className='item-panel-title'>{title}</div>
              <Button
                className='btn'
                onClick={handleFilterOpening}
                type={'ghost'}
              >
                {!isOpen
                  ? (
                    <Icon
                      phosphorIcon={CaretDown}
                      size='sm'
                    />
                  )
                  : (
                    <Icon
                      phosphorIcon={CaretUp}
                      size='sm'
                    />
                  )}
              </Button>
            </div>
          </div>
        </div>
        <div className='content-inner'>
          <div>{isOpen && <div className='p-3'>{children}</div>}</div>
        </div>
      </div>
    </>
  );
};

const CollapsiblePanel = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: token.fontSize,
    flexDirection: 'column',
    paddingLeft: token.padding,
    paddingRight: token.padding,
    '.item-panel': {
      display: 'flex',
      justifyContent: 'space-between',
      paddingLeft: token.paddingSM,
      alignItems: 'center',
      borderTopRightRadius: token.borderRadiusLG,
      borderTopLeftRadius: token.borderRadiusLG,
      backgroundColor: 'var(--Background-Secondary-background, #1A1A1A)'
    },
    '.item-panel-title': {
      fontSize: 14
    },
    '.content-inner': {
      backgroundColor: 'var(--Background-Secondary-background, #1A1A1A)',
      paddingRight: token.paddingSM,
      paddingLeft: 24
    },
    '&.-colapsible .item-panel': {
      borderBottomLeftRadius: token.borderRadiusLG,
      borderBottomRightRadius: token.borderRadiusLG
    }

  });
});

export default CollapsiblePanel;
