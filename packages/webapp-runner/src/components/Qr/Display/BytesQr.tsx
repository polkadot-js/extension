// Copyright 2017-2022 @polkadot/react-qr authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useCreateQrPayload from "@subwallet-webapp/hooks/qr/useCreateQrPayload";
import { ThemeProps } from "@subwallet-webapp/types";
import CN from "classnames";
import React, { useMemo } from "react";
import styled from "styled-components";

import { createImgSize } from "@polkadot/react-qr/util";

interface Props extends ThemeProps {
  size?: string | number;
  skipEncoding?: boolean;
  style?: React.CSSProperties;
  value: Uint8Array;
}

const Component = ({ className, size, skipEncoding, style, value }: Props) => {
  const { images, index: imageIndex } = useCreateQrPayload(value, skipEncoding);

  const containerStyle = useMemo(() => createImgSize(size), [size]); // run on initial load to setup the global timer and provide and unsubscribe

  if (!images.length) {
    return null;
  }

  return (
    <div className={CN(className)} style={containerStyle}>
      <div className={"ui--qr-Display"} style={style}>
        {images.map((image, _index) => {
          return (
            <img
              alt={`qr-code_${_index}`}
              className={CN({ hidden: imageIndex !== _index })}
              key={_index}
              src={image}
            />
          );
        })}
      </div>
    </div>
  );
};

const BytesQr = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    borderStyle: token.lineType,
    borderWidth: token.sizeXS,
    borderColor: token.colorTextBase,
    borderRadius: token.borderRadiusLG,

    ".ui--qr-Display": {
      height: "100%",
      width: "100%",

      "img,svg": {
        background: token.colorTextBase,
        height: "auto !important",
        maxHeight: "100%",
        maxWidth: "100%",
        width: "auto !important",
      },

      ".hidden": {
        display: "none",
      },
    },
  };
});

export default BytesQr;
