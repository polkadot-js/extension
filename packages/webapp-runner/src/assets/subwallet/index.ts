// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProjectLogos } from "@subwallet-webapp/assets/logo";

const SwLogosMap: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_32: require("./32.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_48: require("./48.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_64: require("./64.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_72: require("./72.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_120: require("./120.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_128: require("./128.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_144: require("./144.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_180: require("./180.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_196: require("./196.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_256: require("./256.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet_512: require("./512.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  subwallet: require("./256.png"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  avatar_placeholder: require("./avatar_placeholder.png"),
  transak: ProjectLogos.transak,
  onramper: ProjectLogos.onramper,
  moonpay: ProjectLogos.moonpay,
};

export default SwLogosMap;
