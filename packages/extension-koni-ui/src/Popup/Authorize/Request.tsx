// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@polkadot/extension-base/background/types';
import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { ActionBar, ActionContext, Button, Icon, Link, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
  isFirst: boolean;
  request: RequestAuthorizeTab;
  url: string;
}

function Request ({ authId, className, isFirst, request: { origin }, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const _onApprove = useCallback(
    () => approveAuthRequest(authId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [authId, onAction]
  );

  const _onReject = useCallback(
    () => rejectAuthRequest(authId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [authId, onAction]
  );

  return (
    <div className={className}>
      <div className='request-info-wrapper'>
        <div className='request-info'>
          <Icon
            icon='X'
            onClick={_onReject}
          />
          <div className='tab-info'>
            <Trans key='accessRequest'>An application, self-identifying as <span className='tab-name'>{origin}</span> is
              requesting access from{' '}
            <a
              href={url}
              rel='noopener noreferrer'
              target='_blank'
            >
              <span className='tab-url'>{url}</span>
            </a>
            </Trans>
          </div>
        </div>
        {isFirst && (
          <>
            <Warning className='request__warning'>
              {t<string>('Only approve this request if you trust the application. Approving gives the application access to the addresses of your accounts.')}
            </Warning>
            <Button
              className='request__accept-button'
              onClick={_onApprove}
            >
              {t<string>('Yes, allow this application access')}
            </Button>
          </>
        )}
        <ActionBar className='request__rejection-button'>
          <Link
            onClick={_onReject}
          >
            Reject
          </Link>
        </ActionBar>
      </div>
    </div>
  );
}

export default styled(Request)(({ theme }: Props) => `

  .icon {
    background: ${theme.buttonBackgroundDanger};
    color: white;
    min-width: 18px;
    width: 14px;
    height: 18px;
    font-size: 10px;
    line-height: 20px;
    margin: 16px 15px 0 0;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tab-info {
    overflow: hidden;
    margin-top: 0.75rem;
  }

  .tab-name,
  .tab-url {
    color: ${theme.textColor};
    display: inline-block;
    max-width: 20rem;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: top;
    cursor: pointer;
    text-decoration: underline;
  }

  .request-info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 8px;
  }

  .request-info {
    display: flex;
    flex-direction: row;
    padding-top: 20px;
  }

  .request__accept-button {
    margin-top: 25px;
  }

  .request__warning {
    margin-top: 24px;
  }

  .request__rejection-button {
    margin: 8px 0 15px 0;

    span {
      color: ${theme.buttonTextColor2};
      font-weight: 500;
    }

    a {
      text-decoration: underline;
    }

  }
`);
