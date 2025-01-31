# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.8.0](https://github.com/hyperledger/cactus/compare/v0.7.0...v0.8.0) (2021-08-17)


### Bug Fixes

* **prometheus:** metrics.ts leaks to global registry [#1202](https://github.com/hyperledger/cactus/issues/1202) ([ce076d7](https://github.com/hyperledger/cactus/commit/ce076d709f8e0cba143f8fe9d71f1de1df8f71dc))





# [0.7.0](https://github.com/hyperledger/cactus/compare/v0.6.0...v0.7.0) (2021-08-04)


### Bug Fixes

* **connector-corda:** fix build broken by operationId rename ([291dd3b](https://github.com/hyperledger/cactus/commit/291dd3bc666939fffbc3780eaefd9059c756878a))





# [0.6.0](https://github.com/hyperledger/cactus/compare/v0.4.1...v0.6.0) (2021-07-19)


### Bug Fixes

* **connector-corda:** container image kotlin compilation fails in model ([a8a4531](https://github.com/hyperledger/cactus/commit/a8a4531d379fe16d4c991802525ec573a7e3ede1))
* **connector-xdai:** add missing hasTransactionFinality ([cc4f3e1](https://github.com/hyperledger/cactus/commit/cc4f3e141da9292b8db5b0261a3347b3ba9c0689))
* **connector-xdai:** web3.eth.estimateGas, works considering called solidity method do not throw an exception. So, for method having modifier with access control on msg.sender calling estimateGas without from field throws error.to make it work ,transactionConfig.from = web3SigningCredential.ethAccount before calling estimateGas ([63f5ff6](https://github.com/hyperledger/cactus/commit/63f5ff62b20aaf4dfdb5dd48a24dabc3342a0868))


### Features

* **connector-xdai:** add interval to pollForTxReceipt ([40be742](https://github.com/hyperledger/cactus/commit/40be74234f3bbd059fbc41f61890d25eec1d6ff8))
* **connector-xdai:** add ledger connector plugin for xdai [#852](https://github.com/hyperledger/cactus/issues/852) ([99399a3](https://github.com/hyperledger/cactus/commit/99399a3bd5020c66d2899aca500a880777b6523d))
* **core-api:** plugin async initializer method ([9678c2e](https://github.com/hyperledger/cactus/commit/9678c2e9288a73589e84f9fd254c26aed6a93297))





# [0.5.0](https://github.com/hyperledger/cactus/compare/v0.4.1...v0.5.0) (2021-05-19)


### Bug Fixes

* **connector-xdai:** add missing hasTransactionFinality ([cc4f3e1](https://github.com/hyperledger/cactus/commit/cc4f3e141da9292b8db5b0261a3347b3ba9c0689))


### Features

* **connector-xdai:** add ledger connector plugin for xdai [#852](https://github.com/hyperledger/cactus/issues/852) ([99399a3](https://github.com/hyperledger/cactus/commit/99399a3bd5020c66d2899aca500a880777b6523d))
