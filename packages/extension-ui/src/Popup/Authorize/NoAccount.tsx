// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { t } from 'i18next';
import React, { useCallback } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { Button, Warning } from '@polkadot/extension-ui/components';
import { deleteAuthRequest } from '@polkadot/extension-ui/messaging';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
}

function NoAccount ({ authId, className }: Props): React.ReactElement<Props> {
  const _onClick = useCallback(() => {
    deleteAuthRequest(authId).catch(console.error);
  }, [authId]
  );

  return (
    <div className={className}>
      <Warning className='warningMargin'>
        <Trans>You do not have any account. Please create an account and refresh the application&apos;s page.</Trans>
      </Warning>
      <Button
        className='acceptButton'
        onClick={_onClick}
      >
        {t<string>('Understood')}
      </Button>
    </div>
  );
}

export default styled(NoAccount)`
  .acceptButton {
    width: 90%;
    margin: 25px auto 0;
  }

  .warningMargin {
    margin: 1rem 24px 0 1.45rem;
  }
`;
