// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { REMIND_BACKUP_SEED_PHRASE_MODAL, SELECT_ACCOUNT_MODAL, USER_GUIDE_URL } from '@subwallet/extension-koni-ui/constants';
import { useSetSessionLatest } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShieldCheck } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

const RemindBackupSeedPhraseModalId = REMIND_BACKUP_SEED_PHRASE_MODAL;
const AccountSelectorModalId = SELECT_ACCOUNT_MODAL;
const DomainUserGuide = '/account-management/export-and-backup-accounts';
const HistoryPageUrl = '/home/history';

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const location = useLocation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { sessionLatest, setSessionLatest } = useSetSessionLatest();
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const isActiveModal = useMemo(() => checkActive(AccountSelectorModalId), [checkActive]);

  const onCancel = useCallback(() => {
    inactiveModal(RemindBackupSeedPhraseModalId);
    setSessionLatest({ ...sessionLatest, timeCalculate: Date.now(), remind: false, isFinished: true });
  }, [inactiveModal, sessionLatest, setSessionLatest]);

  const onExport = useCallback(() => {
    inactiveModal(RemindBackupSeedPhraseModalId);
    const from = location.pathname.includes(HistoryPageUrl) ? HistoryPageUrl : location.pathname;
    const state = (location.state ? { ...location.state, from } : { from }) as Record<string, string>;

    if (isAllAccount || !!currentAccount?.isExternal) {
      activeModal(AccountSelectorModalId);
      setSessionLatest({ ...sessionLatest, timeCalculate: Date.now(), remind: false });
    } else if (currentAccount?.address) {
      navigate(`/accounts/export/${currentAccount?.address}`, { state });
      setSessionLatest({ ...sessionLatest, timeCalculate: Date.now(), remind: false, isFinished: true });
    }
  }, [activeModal, currentAccount?.address, currentAccount?.isExternal, inactiveModal, isAllAccount, location, navigate, sessionLatest, setSessionLatest]);

  useEffect(() => {
    if (!sessionLatest.remind) {
      inactiveModal(RemindBackupSeedPhraseModalId);
    }
  }, [inactiveModal, sessionLatest.remind]);

  useEffect(() => {
    const element = document.getElementsByClassName('__tooltip-overlay-remind')[0];

    if (element) {
      if (element.classList.contains('ant-tooltip-hidden')) {
        isActiveModal && element.classList.remove('ant-tooltip-hidden');
      } else {
        (!isActiveModal) && element.classList.add('ant-tooltip-hidden');
      }
    }
  }, [isActiveModal]);

  const footerModal = useMemo(() => {
    return (
      <>
        <Button
          block={true}
          onClick={onCancel}
          schema={'secondary'}
        >
          {t('I’ve backed up')}
        </Button>

        <Button
          block={true}
          onClick={onExport}
        >
          {t('Back up now')}
        </Button>
      </>
    );
  }, [onCancel, onExport, t]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={true}
        footer={footerModal}
        id={RemindBackupSeedPhraseModalId}
        maskClosable={false}
        onCancel={onCancel}
        title={t('Back up your seed phrase!')}
      >
        <div className={'__modal-content'}>
          <PageIcon
            color={token['colorPrimary-6']}
            iconProps={{
              weight: 'fill',
              phosphorIcon: ShieldCheck
            }}
          />
          <div className='__modal-description'>
            {t(' Once your seed phrase is lost, there is no way to recover your account. Back up now to secure your funds or learn how to with')}
            <a
              className={'__modal-user-guide'}
              href={`${USER_GUIDE_URL}${DomainUserGuide}`}
              target='__blank'
            >
              {t('our user guide.')}
            </a>
          </div>
        </div>
      </SwModal>
    </>
  );
}

const RemindBackupSeedPhraseModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
      gap: token.sizeSM
    }
  };
});

export default RemindBackupSeedPhraseModal;
