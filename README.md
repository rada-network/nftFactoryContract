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

Summary cost
Deploy NFT contract: 20$
Deploy Factories contract: 30$
Allocation NFT 200 NFT: 12$

Step by step Deploy to testnet / mainnet

```shell
npx hardhat run scripts/RadaNftContract/1_deploy.js --network testnet
// Copy Contract address to proxyAddresses.js
npx hardhat run scripts/NftFactoriesContract/1_deploy.js --network testnet
// Copy Contract address to proxyAddresses.js

npx hardhat run scripts/RadaNftContract/2_setup.js --network testnet
npx hardhat run scripts/NftFactoriesContract/2_createCampaign.js --network testnet
npx hardhat run scripts/NftFactoriesContract/3_updateProgram.js --network testnet
npx hardhat run scripts/NftFactoriesContract/4_allocationBoxAndRandom.js --network testnet
npx hardhat run scripts/NftFactoriesContract/5_setWhitelistAddress.js --network testnet

npx hardhat run scripts/NftFactoriesContract/getImplementationAddress.js --network testnet

npx hardhat verify --network testnet 0xc7309b43eF2F9E1D90e054d9433201a034f8618c
npx hardhat verify --network testnet 0x24825D62d4658DA1d5cB517E2CB445D1A00F65C6
```

Build & Deploy BSC testnet | MysteryBoxNFTContract

```shell

npx hardhat run scripts/RadaNftContract/1_deploy.js --network testnet
// Copy Token address to proxyAddresses.js
npx hardhat run scripts/RadaNftContract/2_setup.js --network testnet

// npx hardhat verify --network testnet --contract contracts/MysteryBoxNFTContract.sol:RadaNftContract 0x839Ef4925f169140211bf0B6ae441469ae70F900

```

Build & Deploy NFT contract and NftFactory Contract

```shell

npx hardhat run scripts/NftFactoriesContract/1_deploy.js --network testnet
// Copy Proxy address to proxyAddresses.js
npx hardhat run scripts/NftFactoriesContract/2_createCampaignAllocationBoxAndRandom.js --network testnet
npx hardhat run scripts/NftFactoriesContract/3_updateProgram.js --network testnet
npx hardhat run scripts/NftFactoriesContract/4_setWhitelistAddress.js --network testnet

npx hardhat run scripts/NftFactoriesContract/getImplementationAddress.js --network testnet
npx hardhat verify --network testnet 0xdcEc2C5f5aF78a08c513cf4Ed139C88A3aD2eaE7
```

Build & Deploy BSC testnet | BUSDToken

```shell

npx hardhat run scripts/BUSDToken/deploy.js --network testnet
// Copy Token address to tokenAddresses.js

// npx hardhat verify --network testnet TODO_token_address
// npx hardhat verify --network testnet --contract contracts/BUSDToken.sol:BUSDToken TODO_token_address

```
