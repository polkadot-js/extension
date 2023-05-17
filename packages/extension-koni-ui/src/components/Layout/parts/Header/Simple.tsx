// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { Logo2D } from '@subwallet/extension-koni-ui/components/Logo';
import { useDefaultNavigate, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Typography } from '@subwallet/react-ui';
import { CaretLeft, Question } from 'phosphor-react';
import { useCallback } from 'react';
import styled from 'styled-components';

export type Props = ThemeProps & {
  title?: string | React.ReactNode;
  onBack?: () => void;
}

const StyledHeader = styled.div(({}) => {
  return {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '31px 24px 50px',

    '.logo-container': {
      width: 67,
      textAlign: 'left'
    },

    '.title-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      flex: 1,
      position: 'relative',

      '.back-button': {
        position: 'absolute',
        top: 0,
        left: 20
      }
    }
  };
});

const StyledTitle = styled(Typography.Title)`
  margin: 0 !important;
  font-size: 30px !important;
  height: 40px;
  line-height: unset !important;
`;

function Component (props: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const defaultOnBack = useCallback(() => {
    goHome();
  }, [goHome]);

  return (
    <StyledHeader>
      <div className='logo-container'>
        <Logo2D
          height={24}
          width={24}
        />
      </div>
      {props.title && (
        <div className='title-wrapper'>
          <Button
            className='back-button'
            icon={<Icon
              phosphorIcon={CaretLeft}
              size='sm'
                  />}
            onClick={props.onBack || defaultOnBack}
            size='xs'
            type='ghost'
          />
          <StyledTitle>{props.title}</StyledTitle>
        </div>
      )}
      <Button
        icon={<Icon
          phosphorIcon={Question}
          size='sm'
        />}
        size='xs'
        style={{
          padding: 0
        }}
        type='ghost'
      >
        {t<string>('Help')}
      </Button>
    </StyledHeader>
  );
}

const Simple = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));

export default Simple;
