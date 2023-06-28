// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationRequestBase } from '@subwallet/extension-base/background/types';
import { isWalletConnectRequest } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { getDomainFromUrl } from '@subwallet/extension-base/utils';
import DefaultLogosMap from '@subwallet/extension-koni-ui/assets/logo';
import DualLogo from '@subwallet/extension-koni-ui/components/Logo/DualLogo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Image, Logo, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: ConfirmationRequestBase;
  linkIcon?: React.ReactNode;
  linkIconBg?: string;
}

const WalletConnectLogo = (
  <Image
    height={24}
    src={DefaultLogosMap.walletconnect}
    width={24}
  />
);

// Get domain from full url
function Component ({ className, linkIcon, linkIconBg, request }: Props) {
  const domain = getDomainFromUrl(request.url);
  const leftLogoUrl = `https://icons.duckduckgo.com/ip2/${domain}.ico`;

  const isWCRequest = useMemo(() => isWalletConnectRequest(request.id), [request.id]);

  const linkNode = useMemo((): React.ReactNode => isWCRequest ? WalletConnectLogo : linkIcon, [isWCRequest, linkIcon]);

  return (
    <div className={CN(className, 'confirmation-general-info-container')}>
      <DualLogo
        leftLogo={(
          <Logo
            network={'subwallet'}
            shape='squircle'
            size={56}
          />
        )}
        linkIcon={linkNode}
        linkIconBg={linkIconBg}
        rightLogo={(
          <Image
            height={56}
            shape='squircle'
            src={leftLogoUrl}
            width={56}
          />
        )}
      />
      <Typography.Paragraph className={'text-tertiary __domain'}>
        {domain}
      </Typography.Paragraph>
    </div>
  );
}

const ConfirmationGeneralInfo = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  textAlign: 'center',

  '.__domain': {
    marginTop: `calc((var(--content-gap) - ${token.size}px))`
  }
}));

export default ConfirmationGeneralInfo;
