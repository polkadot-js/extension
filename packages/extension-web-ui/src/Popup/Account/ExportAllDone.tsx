// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox, BaseModal, CloseIcon, Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import { ACCOUNT_EXPORT_ALL_MODAL } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useDefaultNavigate } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, ModalContext, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  id?: string;
};

const FinishIcon = (
  <Icon
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const { inactiveModal } = useContext(ModalContext);
  //
  const onCancel = useCallback(() => {
    inactiveModal(ACCOUNT_EXPORT_ALL_MODAL);
  }, [inactiveModal]);
  const contentBlock = (
    <PageWrapper className={CN(className, 'modal-content', { '-mobile-mode': !isWebUI })}>
      <Layout.WithSubHeaderOnly
        onBack={goHome}
        rightFooterButton={{
          children: t('Finish'),
          icon: FinishIcon,
          onClick: goHome
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t('Successful')}
      >
        <div className='body-container'>
          <div className={CN('notice')}>
            <AlertBox
              description={t('Anyone with your key can use any assets held in your account.')}
              title={t('Warning: Never disclose this key')}
              type='warning'
            />
          </div>
          <div className='result-content'>
            <div className='page-icon'>
              <PageIcon
                color='var(--page-icon-color)'
                iconProps={{
                  phosphorIcon: CheckCircle,
                  weight: 'fill'
                }}
              />
            </div>
            <div className='json-done-tile'>
              {t('Success!')}
            </div>
            <div className='json-done-description'>
              {t('You have successfully export JSON file for your accounts')}
            </div>
          </div>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );

  if (isWebUI) {
    return (
      <BaseModal
        className={CN(className, '-modal-container')}
        closable={true}
        id={ACCOUNT_EXPORT_ALL_MODAL}
        onCancel={onCancel}
        title={'Successful'}
      >
        {contentBlock}
      </BaseModal>
    );
  } else {
    return contentBlock;
  }
};

const ExportAllDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.-mobile-mode': {
      '.ant-sw-screen-layout-body': {
        paddingLeft: token.padding,
        paddingRight: token.padding
      },
      '.notice': {
        marginTop: token.margin
      },
      '.ant-sw-screen-layout-footer': {
        paddingLeft: token.padding,
        paddingRight: token.padding
      }
    },
    '.notice': {
      marginTop: token.marginXS,
      marginBottom: token.paddingLG
    },
    '.ant-sw-screen-layout-footer-button-container': {
      padding: 0
    },
    '.ant-sw-screen-layout-footer-right-button': {
      margin: 0
    },
    '.ant-sw-modal-header': {
      paddingTop: token.paddingSM,
      paddingBottom: token.paddingSM
    },
    '.ant-sw-modal-content': {
      paddingTop: 0
    },
    '.ant-sw-header-center-part, .ant-sw-modal-title, .ant-sw-header-container': {
      minHeight: 56
    },

    '.result-content': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size,
      paddingBottom: token.padding
    },

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      '--page-icon-color': token.colorSecondary
    },

    '.json-done-tile': {
      color: token.colorTextHeading,
      textAlign: 'center',
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3
    },

    '.json-done-description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      color: token.colorTextLabel,
      textAlign: 'center',
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    }

  };
});

export default ExportAllDone;
