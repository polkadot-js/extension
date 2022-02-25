## Run this after change query from folder extension-koni-base
- `npx apollo codegen:generate --endpoint=https://app.gc.subsquid.io/beta/subwallet-polkadot/v4/graphql --target=typescript --tagName=gql --globalTypesFile="./src/api/graphqlTypes.ts"`
-  `apollo schema:download --endpoint=https://app.gc.subsquid.io/beta/subwallet-polkadot/v4/graphql staking-schema.json`
