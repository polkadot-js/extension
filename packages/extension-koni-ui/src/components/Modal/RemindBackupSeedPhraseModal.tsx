// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { AccountSelectorModal } from '@subwallet/extension-koni-ui/components/Modal/AccountSelectorModal';
import { LATEST_SESSION, REMIND_BACKUP_SEED_PHRASE_MODAL } from '@subwallet/extension-koni-ui/constants';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { SessionStorage, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShieldCheck } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

const RemindBackupSeedPhraseModalId = REMIND_BACKUP_SEED_PHRASE_MODAL;
const AccountSelectorModalId = 'account_selector_for_backup_seed_phrase_modal';
const DEFAULT_SESSION_VALUE: SessionStorage = {
  remind: false,
  timeCalculate: Date.now()
};

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts, currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const location = useLocation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const [sessionLatest, setSessionLatest] = useLocalStorage<SessionStorage>(LATEST_SESSION, DEFAULT_SESSION_VALUE);
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;

  const onCancel = useCallback(() => {
    inactiveModal(RemindBackupSeedPhraseModalId);
    setSessionLatest({ timeCalculate: Date.now(), remind: false });
  }, [inactiveModal, setSessionLatest]);

  const accountFiler = useMemo(() => {
    return accounts.filter(({ address }) => address !== 'ALL');
  }, [accounts]);

  const onSelectAccount = useCallback((account: AccountJson) => {
    if (account?.address) {
      navigate(`/accounts/export/${account.address}`, { state: { from: location.pathname } });
      inactiveModal(AccountSelectorModalId);
    }
  }, [inactiveModal, location.pathname, navigate]);

  const onExport = useCallback(() => {
    inactiveModal(RemindBackupSeedPhraseModalId);

    if (isAllAccount) {
      activeModal(AccountSelectorModalId);
      inactiveModal(RemindBackupSeedPhraseModalId);
    } else if (currentAccount?.address) {
      navigate(`/accounts/export/${currentAccount?.address}`, { state: { from: location.pathname } });
    }

    setSessionLatest({ timeCalculate: Date.now(), remind: false });
  }, [activeModal, currentAccount?.address, inactiveModal, isAllAccount, location.pathname, navigate, setSessionLatest]);

  useEffect(() => {
    if (!sessionLatest.remind) {
      inactiveModal(RemindBackupSeedPhraseModalId);
    }
  }, [inactiveModal, sessionLatest.remind]);

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
            {t('Once your seed phrase is lost, there is no way to recover your account. Back up now to secure your funds.')}
          </div>
        </div>

      </SwModal>
      <AccountSelectorModal
        id={AccountSelectorModalId}
        items={accountFiler}
        onSelectItem={onSelectAccount}
      />
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

    '.ant-sw-modal-footer': {
      borderTop: 'none',
      display: 'flex',
      gap: token.sizeSM
    }
  };
});

export default RemindBackupSeedPhraseModal;
