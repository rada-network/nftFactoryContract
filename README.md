# Referral Program

Configuration .env file

```shell
PRIVATE_KEY=
RINKEBY_API_KEY=
ETHERSCAN_API_KEY=
BSC_API_KEY=
MNEMONIC=
```

The following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
```

Step by step Deploy to testnet / mainnet

```shell
npx hardhat run scripts/MysteryBoxNftContract/1_deploy.js --network testnet
// Copy Contract address to proxyAddresses.js
npx hardhat run scripts/PrlNftContract/1_deploy.js --network testnet
// Copy Contract address to proxyAddresses.js
npx hardhat run scripts/NftFactoryContract/1_deploy.js --network testnet
// Copy Contract address to proxyAddresses.js

npx hardhat run scripts/MysteryBoxNftContract/2_setup.js --network testnet
npx hardhat run scripts/PrlNftContract/2_setup.js --network testnet
npx hardhat run scripts/NftFactoryContract/2_setupBoxAndRandom.js --network testnet
npx hardhat run scripts/NftFactoryContract/3_setWhitelistAddress.js --network testnet



```

Build & Deploy BSC testnet | MysteryBoxNFTContract

```shell

npx hardhat run scripts/MysteryBoxNftContract/1_deploy.js --network testnet
// Copy Token address to proxyAddresses.js
npx hardhat run scripts/MysteryBoxNftContract/2_setup.js --network testnet

// npx hardhat verify --network testnet TODO_token_address

```

Build & Deploy BSC testnet | PrlNftContract

```shell

npx hardhat run scripts/PrlNftContract/1_deploy.js --network testnet
// Copy Token address to proxyAddresses.js
npx hardhat run scripts/PrlNftContract/2_setup.js --network testnet

// npx hardhat verify --network testnet TODO_token_address

```

Build & Deploy NFT contract and NftFactory Contract

```shell

npx hardhat run scripts/NftFactoryContract/1_deploy.js --network testnet
// Copy Proxy address to proxyAddresses.js
npx hardhat run scripts/NftFactoryContract/2_setupBoxAndRandom.js --network testnet
npx hardhat run scripts/NftFactoryContract/3_setWhitelistAddress.js --network testnet

```

Build & Deploy BSC testnet | BUSDToken

```shell

npx hardhat run scripts/BUSDToken/deploy.js --network testnet
// Copy Token address to tokenAddresses.js

// npx hardhat verify --network testnet TODO_token_address
// npx hardhat verify --network testnet --contract contracts/BUSDToken.sol:BUSDToken TODO_token_address

```
