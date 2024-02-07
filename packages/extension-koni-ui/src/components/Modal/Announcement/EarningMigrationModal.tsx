// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { detectTranslate } from '@subwallet/extension-base/utils';
import { EARNING_MIGRATION_ANNOUNCEMENT, EARNING_MIGRATION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Vault, XCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps
const modalId = EARNING_MIGRATION_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { className } = props;
  const { inactiveModal } = useContext(ModalContext);
  const [, setIsReadEarningMigrationAnnouncement] = useLocalStorage<boolean>(EARNING_MIGRATION_ANNOUNCEMENT, false);

  const onCloseModal = useCallback(() => {
    setIsReadEarningMigrationAnnouncement(true);
    inactiveModal(modalId);
  }, [inactiveModal, setIsReadEarningMigrationAnnouncement]);

  const onEarnNow = useCallback(() => {
    setIsReadEarningMigrationAnnouncement(true);
    navigate('/home/earning');
    inactiveModal(modalId);
  }, [inactiveModal, navigate, setIsReadEarningMigrationAnnouncement]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={false}
        footer={
          <div className={'__modal-buttons'}>
            <Button
              block={true}
              className={'__left-btn'}
              icon={
                <Icon
                  customSize='28px'
                  phosphorIcon={XCircle}
                  weight={'fill'}
                />
              }
              onClick={onCloseModal}

              schema={'secondary'}
            >
              {t('Dismiss')}
            </Button>
            <Button
              block={true}
              className={'__right-btn'}
              icon={
                <Icon
                  customSize='28px'
                  phosphorIcon={CheckCircle}
                  weight={'fill'}
                />
              }
              onClick={onEarnNow}
            >
              {t('Earn now')}
            </Button>
          </div>
        }
        id={modalId}
        onCancel={onCloseModal}
        title={t('Introducing Earning feature')}
      >
        <div className={'page-icon-astar-modal'}>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: Vault
            }}
          />
        </div>
        <div className='__modal-content'>
          <Trans
            components={{
              highlight: (
                <strong />
              )
            }}
            i18nKey={detectTranslate('SubWallet\'s <highlight>Staking</highlight> feature has been updated to become <highlight>Earning</highlight> feature. Now, you can earn yield with native staking, liquid staking, lending, and staking dApp on SubWallet.')}
          />
        </div>
      </SwModal>
    </>
  );
};

const EarningMigrationModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__modal-content': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      color: token.colorTextDescription,
      paddingLeft: token.padding,
      paddingRight: token.padding,

      strong: {
        color: token.colorTextLight2,
        fontWeight: token.headingFontWeight
      }
    },
    '.__modal-buttons': {
      display: 'flex',
      justifyContent: 'row',
      gap: token.sizeXXS
    },
    '.page-icon-astar-modal': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.margin,
      marginBottom: token.marginMD,
      '--page-icon-color': token['green-7']
    },
    '.ant-sw-header-center-part': {
      width: 'auto'
    },
    '.ant-sw-modal-footer': {
      borderTop: 0,
      paddingTop: 0
    }
  };
});

export default EarningMigrationModal;
