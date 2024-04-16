// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { Info } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string,
  onOk: () => void
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, modalId, onOk } = props;
  const { t } = useTranslation();

  return (
    <>
      <SwModal
        className={CN(className, 'choose-fee-token-container')}
        closable={false}
        destroyOnClose={true}
        id={modalId}
        title={'Are you still there?'}
      >
        <div className={'__content-wrapper'}>
          <div className={'__content-block'}>
            <div className='page-icon'>
              <PageIcon
                color='var(--page-icon-color)'
                iconProps={{
                  weight: 'fill',
                  phosphorIcon: Info
                }}
              />
            </div>
            <div className='description'>
              {t('We are ready to show you the latest quotes when you want to continue')}
            </div>
          </div>
          <div className='__button-wrapper'>
            <Button
              block={true}
              className={'__footer-button'}
              icon={
                (
                  <Icon
                    phosphorIcon={Info}
                    weight='fill'
                  />
                )
              }
              onClick={onOk}
            >
              {t('Yes, show me latest quote')}
            </Button>
          </div>
        </div>
      </SwModal>
    </>
  );
};

const SwapIdleWarningModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 20,
      '--page-icon-color': token['gray-5']
    },
    '.__content-block': {
      padding: token.padding
    },
    '.description': {
      color: token.colorTextTertiary,
      textAlign: 'center'
    }
  };
});

export default SwapIdleWarningModal;
