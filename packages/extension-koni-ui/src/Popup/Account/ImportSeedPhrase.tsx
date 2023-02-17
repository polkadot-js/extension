// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import SelectAccountType from '@subwallet/extension-koni-ui/components/Account/SelectAccountType';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, Input } from '@subwallet/react-ui';
import { CheckCircle, Info } from 'phosphor-react';
import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={CheckCircle}
    size='sm'
    weight='fill'
  />
);

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  // const navigate = useNavigate();

  // const accountName = useGetDefaultAccountName();

  const [selectedItems, setSelectedItems] = useState<KeypairType[]>([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);
  // const [seedPhrase, setSeedPhrase] = useState('');
  // const [loading, setLoading] = useState(false);

  return (
    <Layout.Base
      footerButton={{
        children: t('Import account'),
        icon: FooterIcon
        // onClick: _onCreate,
        // disabled: !seedPhrase,
        // loading: loading
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: <Icon
            phosphorIcon={Info}
            size='sm'
          />
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t<string>('Import from seed phrase')}
    >
      <div className={className}>
        <div className='description'>
          {t('To import an existing Polkdot wallet, please enter the recovery seed phrase here:')}
        </div>
        <Input.TextArea
          className='seed-phrase-input'
          placeholder={t('Secret phrase')}
        />
        <div>
          <SelectAccountType
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            withLabel={true}
          />
        </div>
      </div>
    </Layout.Base>
  );
};

const ImportSeedPhrase = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: token.padding,
    textAlign: 'center',

    '.description': {
      padding: `0 ${token.padding}px`,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'start',
      color: token.colorTextDescription
    },

    '.seed-phrase-input': {
      margin: `${token.margin}px 0`,

      textarea: {
        resize: 'none',
        height: `${token.sizeLG * 6}px !important`
      }
    }
  };
});

export default ImportSeedPhrase;
