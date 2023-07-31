import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AuthUrls } from '@polkadot/extension-base/background/handlers/State';
import { AccountJson } from '@polkadot/extension-base/background/types';

import {
  AccountContext,
  ActionContext,
  BottomWrapper,
  Button,
  ButtonArea,
  PopupBorderContainer,
  ScrollWrapper,
  VerticalSpace
} from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { getAuthList, updateAuthorization, updateAuthorizationDate } from '../../messaging';
import { NewAccountSelection } from '../../partials';
import { createGroupedAccountData } from '../../util/createGroupedAccountData';

interface Props extends RouteComponentProps, ThemeProps {
  className?: string;
}

function NewAccount({ className, location: { search } }: Props): React.ReactElement<Props> {
  const { hierarchy, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const [authList, setAuthList] = useState<AuthUrls | null>(null);

  const { t } = useTranslation();
  const { show } = useToast();
  const onAction = useContext(ActionContext);
  const searchParams = new URLSearchParams(search);
  const url = searchParams.get('url');
  const { flattened } = useMemo(() => createGroupedAccountData(hierarchy), [hierarchy]);
  const newAccountsRef = useRef<AccountJson[] | []>([]);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => {
        if (url && !list[url]) {
          return;
        }

        setAuthList(list);

        if (url && setSelectedAccounts) {
          setSelectedAccounts(list[url].authorizedAccounts);
        }
      })
      .catch(console.error);
  }, [setSelectedAccounts, url]);

  useEffect(() => {
    if (!flattened || !authList || !url) {
      newAccountsRef.current = [];

      return;
    }

    newAccountsRef.current = flattened.filter(
      (account: AccountJson) => account && account.whenCreated && account.whenCreated > authList[url].lastAuth
    );
  }, [flattened, authList, url]);

  const _onApprove = useCallback(async (): Promise<void> => {
    if (!url) {
      return;
    }

    try {
      await updateAuthorization(selectedAccounts, url);

      onAction('/');
      show(t('Connected app updated'), 'success');
    } catch (error) {
      console.error(error);
    }
  }, [onAction, selectedAccounts, show, t, url]);

  const _onCancel = useCallback(async (): Promise<void> => {
    if (!url) {
      return;
    }

    try {
      await updateAuthorizationDate(url);

      onAction('/');
    } catch (error) {
      console.error(error);
    }
  }, [onAction, url]);

  return (
    <ScrollWrapper className={className}>
      <PopupBorderContainer>
        <div className='content-inner'>
          {url && (
            <NewAccountSelection
              className='accountSelection'
              newAccounts={newAccountsRef.current}
              showHidden={true}
              url={url}
            />
          )}
        </div>
      </PopupBorderContainer>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={_onCancel}
          secondary
        >
          {t<string>('Dismiss')}
        </Button>
        <Button
          className='acceptButton'
          onClick={_onApprove}
        >
          {t<string>('Update')}
        </Button>
      </ButtonArea>
    </ScrollWrapper>
  );
}

export default withRouter(styled(NewAccount)`
  ${BottomWrapper} {
    padding-inline: 16px;
    margin-inline: -16px;
  }

  .accountSelection {
    max-width: 100%;
  }

  .content-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
`);
