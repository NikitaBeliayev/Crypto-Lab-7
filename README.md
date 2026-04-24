# Crypto-lab7 — upgradeable ERC-20 (Assignment 7)

UUPS upgradeable `MyToken`: V1 is `ERC20` + `Ownable` + `initialize` + `mint`; V2 adds `version()` → `"V2"`. The plugin deploys a **proxy** — that address is the token. Scripts: `deploy-v1.js`, `upgrade-to-v2.js`, `e2e-hardhat.js` (one-shot); tests in `src/test/`.

`npm install` → add `PRIVATE_KEY` for testnet. Run `npm test`, `npm run e2e:hardhat`, or `deploy:proxy:local` / `upgrade:v2:local` with `npx hardhat node`, or the `mantleSepolia` variants.

