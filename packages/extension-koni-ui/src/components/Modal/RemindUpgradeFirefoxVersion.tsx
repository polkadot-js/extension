// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { REMIND_UPGRADE_FIREFOX_VERSION, USER_GUIDE_URL } from '@subwallet/extension-koni-ui/constants';
import { useUpgradeFireFoxVersion } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShieldWarning } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

const RemindUpdateFireFoxVersionModalId = REMIND_UPGRADE_FIREFOX_VERSION;
const DomainUserGuide = 'faqs#i-cant-connect-my-accounts-to-any-dapps-on-firefox.-what-should-i-do';

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const { isUpdatedVersion, setIsUpdatedVersion } = useUpgradeFireFoxVersion();
  const { token } = useTheme() as Theme;

  const onCancel = useCallback(() => {
    inactiveModal(RemindUpdateFireFoxVersionModalId);
    setIsUpdatedVersion(true);
  }, [inactiveModal, setIsUpdatedVersion]);

  const goUserGuide = useCallback(() => {
    setIsUpdatedVersion(true);
    window.open(`${USER_GUIDE_URL}/${DomainUserGuide}`);
  }, [setIsUpdatedVersion]);

  useEffect(() => {
    if (isUpdatedVersion) {
      inactiveModal(RemindUpdateFireFoxVersionModalId);
    }
  }, [inactiveModal, isUpdatedVersion]);

  const footerModal = useMemo(() => {
    return (
      <>
        <Button
          block={true}
          onClick={onCancel}
          schema={'secondary'}
        >
          {t('Dismiss')}
        </Button>

        <Button
          block={true}
          onClick={goUserGuide}
        >
          {t('Review guide')}
        </Button>
      </>
    );
  }, [onCancel, goUserGuide, t]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={true}
        footer={footerModal}
        id={RemindUpdateFireFoxVersionModalId}
        maskClosable={false}
        onCancel={onCancel}
        title={t('Pay attention!')}
      >
        <div className={'__modal-content'}>
          <PageIcon
            color={token['colorWarning-5']}
            iconProps={{
              weight: 'fill',
              phosphorIcon: ShieldWarning
            }}
          />
          <div className='__modal-description'>
            {t(' You\'re using an old version of Firefox, which no longer supports automatic dApp access and phishing detection. Review our user guide to learn how to update Firefox to version 127.0 or manually enable dApp access. ')}
          </div>
        </div>
      </SwModal>
    </>
  );
}

const RemindUpgradeVersionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__modal-content': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size,
      alignItems: 'center',
      padding: `${token.padding}px ${token.padding}px 0 ${token.padding}px`
    },

    '.ant-sw-header-center-part': {
      width: 'fit-content'
    },

    '.__modal-description': {
      textAlign: 'center',
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    },

    '.__modal-user-guide': {
      marginLeft: token.marginXXS
    },

    '.ant-sw-modal-footer': {
      borderTop: 'none',
      display: 'flex',
      gap: token.sizeXXS
    }
  };
});

export default RemindUpgradeVersionModal;
