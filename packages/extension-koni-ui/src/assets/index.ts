import LogosMap from "./logo";

export { default as LogosMap } from './logo';
export const AssetImageMap: Record<string, string> = {
  'loading' : require('./loading.gif')
};

// preload all
[LogosMap, AssetImageMap].forEach((imageSet): void => {
  Object.values(imageSet).forEach((src): void => {
    new Image().src = src as string;
  });
});
