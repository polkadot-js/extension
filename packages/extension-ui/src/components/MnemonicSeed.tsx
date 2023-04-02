// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MouseEventHandler } from 'react';
import type { ThemeProps } from '../types.js';

import { faCopy } from '@fortawesome/free-regular-svg-icons';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import useTranslation from '../hooks/useTranslation.js';
import { styled } from '../styled.js';
import ActionText from './ActionText.js';
import BoxWithLabel from './BoxWithLabel.js';

interface Props {
  seed: string;
  onCopy: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

function MnemonicSeed ({ className, onCopy, seed }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <BoxWithLabel
        className='mnemonicDisplay'
        label={t<string>('Generated 12-word mnemonic seed:')}
        value={seed}
      />
      <div className='buttonsRow'>
        <CopyToClipboard text={seed}>
          <ActionText
            className='copyBtn'
            data-seed-action='copy'
            icon={faCopy}
            onClick={onCopy}
            text={t<string>('Copy to clipboard')}
          />
        </CopyToClipboard>
      </div>
    </div>
  );
}

export default styled(MnemonicSeed)(({ theme }: ThemeProps) => `
  margin-bottom: 21px;

  .buttonsRow {
    display: flex;
    flex-direction: row;

    .copyBtn {
      margin-right: 32px;
    }
  }

  .mnemonicDisplay {
    .seedBox {
      color: ${theme.primaryColor};
      font-size: ${theme.fontSize};
      height: unset;
      letter-spacing: -0.01em;
      line-height: ${theme.lineHeight};
      margin-bottom: 10px;
      padding: 14px;
    }
  }
`);
