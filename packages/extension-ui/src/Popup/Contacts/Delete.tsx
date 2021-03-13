// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import _ from 'lodash';
import queryString from 'query-string';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Contact } from '@polkadot/extension-base/background/types';
import { ContactsStore } from '@polkadot/extension-base/stores';

import { ActionBar, ActionContext, ActionText, Button, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import ContactComponent from './Contact';

interface Props extends ThemeProps {
  className?: string;
}

function Delete ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const [contact, setContact] = useState<Contact>({});
  const [backUrl, setBackUrl] = useState<string>('');

  useEffect(() => {
    const path = window.location.hash.split('?');
    const params = queryString.parse(path[1]);

    if (!_.isEmpty(params)) {
      const contact = JSON.parse(params.contact) as Contact;
      const stringified = queryString.stringifyUrl({ url: 'add-contact?', query: { ...contact, identity: JSON.stringify(contact.identity), isEdit: true } });

      console.log('contact: ', contact);
      setBackUrl(stringified);
      setContact(contact);
    }
  }, []);

  const _goContactInfo = useCallback(
    () => {
      onAction(backUrl);
    },
    [onAction, backUrl]
  );

  const _goContacts = useCallback(
    () => {
      onAction('/contacts');
    },
    [onAction]
  );

  const _onClick = useCallback(
    (): void => {
      ContactsStore.delete(contact.id);

      _goContacts();
    },
    [onAction, contact]
  );

  return (
    <>
      <Header
        backTo={backUrl}
        showBackArrow
        text={t<string>('Forget contact')}
      />
      <div className={className}>
        <ContactComponent contact={contact} />
        <Warning className='movedWarning'>
          {t<string>('You are about to remove the contact.')}
        </Warning>
        <div className='actionArea'>
          <Button
            isDanger
            onClick={_onClick}
          >
            {t<string>('I want to forget this contact')}
          </Button>
          <ActionBar className='withMarginTop'>
            <ActionText
              className='center'
              onClick={_goContactInfo}
              text={t<string>('Cancel')}
            />
          </ActionBar>
        </div>
      </div>
    </>
  );
}

export default styled(Delete)(() => `
  .actionArea {
    padding: 10px 24px;
  }

  .center {
    margin: auto;
  }

  .movedWarning {
    margin-top: 8px;
  }

  .withMarginTop {
    margin-top: 4px;
  }
`);
