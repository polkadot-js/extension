// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AuthUrls } from '@polkadot/extension-base/background/handlers/State';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Z_INDEX } from '@polkadot/extension-ui/zindex';

import {
  AccountContext,
  ActionContext,
  BottomWrapper,
  Button,
  ButtonArea,
  PopupBorderContainer
} from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { getAuthList, updateAuthorization, updateAuthorizationDate } from '../../messaging';
import { NewAccountSelection } from '../../partials';
import { createGroupedAccountData } from '../../util/createGroupedAccountData';

interface Props extends RouteComponentProps, ThemeProps {
  className?: string;
}

const ButtonsGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding-bottom: 0px;
  position: absolute;
  bottom: 8px;
  left: 0px;
  right: 0px;
  height: 56px;
  backdrop-filter: blur(10px);
  z-index: ${Z_INDEX.BOTTOM_WRAPPER};
`;

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
    <>
      <PopupBorderContainer>
        <div className={className}>
          <div className='content'>
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
          </div>
        </div>
      </PopupBorderContainer>
      <ButtonsGroup>
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
      </ButtonsGroup>
    </>
  );
}

export default withRouter(styled(NewAccount)`
  & ${BottomWrapper} {
    position: sticky;
    bottom: -8px !important;
  }

  .content {
    margin-top: 8px;
    overflow-y: scroll;
    overflow-x: hidden;
    height: 584px;

    ::-webkit-scrollbar-thumb {
      background: ${({ theme }: ThemeProps): string => theme.boxBorderColor};
      border-radius: 50px;  
      width: 2px;  
      border-right: 2px solid #111B24;
    }
  
    ::-webkit-scrollbar {
      width: 4px;
    }
  }

  .content-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
`);
