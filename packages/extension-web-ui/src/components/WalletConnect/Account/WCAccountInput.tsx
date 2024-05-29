// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { DotsThree } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { AccountItemBase, AvatarGroup } from '../../Account';

interface Props extends ThemeProps {
  accounts: AccountJson[];
  selected: string[];
  onClick: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { accounts, selected } = props;

  const { t } = useTranslation();

  const selectedAccounts = useMemo(() => accounts.filter((account) => selected.some((address) => isSameAddress(address, account.address))), [accounts, selected]);

  const countSelected = selectedAccounts.length;

  return (
    <AccountItemBase
      {...props}
      address=''
      className={CN('wallet-connect-account-input', props.className)}
      leftItem={<AvatarGroup accounts={selectedAccounts} />}
      middleItem={(
        <div className={CN('wallet-connect-account-input-content')}>
          { countSelected ? t('{{number}} accounts connected', { replace: { number: countSelected } }) : t('Select account')}
        </div>
      )}
      rightItem={(
        <div className={'more-icon'}>
          <Icon
            iconColor='var(--icon-color)'
            phosphorIcon={DotsThree}
            size='md'
            type='phosphor'
            weight='fill'
          />
        </div>
      )}
    />
  );
};

const WCAccountInput = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.wc-network-modal-content': {
      textAlign: 'left'
    },

    '.more-icon': {
      display: 'flex',
      width: 40,
      justifyContent: 'center'
    }
  };
});

export default WCAccountInput;
