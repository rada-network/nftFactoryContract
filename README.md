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

// npx hardhat verify --network testnet --contract contracts/MysteryBoxNFTContract.sol:MysteryBoxNftContract 0x839Ef4925f169140211bf0B6ae441469ae70F900

```

Build & Deploy BSC testnet | PrlNftContract

```shell

npx hardhat run scripts/PrlNftContract/1_deploy.js --network testnet
// Copy Token address to proxyAddresses.js
npx hardhat run scripts/PrlNftContract/2_setup.js --network testnet

// npx hardhat verify --network testnet --contract contracts/PRLNFTContract.sol:PrlNftContract 0x2091A2C10C6242fFF11224D89FE3881f174B7F73

```

Build & Deploy NFT contract and NftFactory Contract

```shell

npx hardhat run scripts/NftFactoryContract/1_deploy.js --network testnet
// Copy Proxy address to proxyAddresses.js
npx hardhat run scripts/NftFactoryContract/2_setupBoxAndRandom.js --network testnet
npx hardhat run scripts/NftFactoryContract/3_setWhitelistAddress.js --network testnet

npx hardhat run scripts/NftFactoryContract/getImplementationAddress.js --network testnet
npx hardhat verify --network testnet 0xdcEc2C5f5aF78a08c513cf4Ed139C88A3aD2eaE7
```

Build & Deploy BSC testnet | BUSDToken

```shell

npx hardhat run scripts/BUSDToken/deploy.js --network testnet
// Copy Token address to tokenAddresses.js

// npx hardhat verify --network testnet TODO_token_address
// npx hardhat verify --network testnet --contract contracts/BUSDToken.sol:BUSDToken TODO_token_address

```
