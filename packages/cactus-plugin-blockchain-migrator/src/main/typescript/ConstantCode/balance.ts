/* 'use strict';
const shim = require('fabric-shim');

let Chaincode = class {

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();

    let method = this[ret.fcn];
    if (!method) {
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      return shim.error(err);
    }
  }

  async Init(stub) {
    return shim.success();
  }

  async send(ctx: Context, value: number, addressFrom: string, addressTo: string, amount: number): Promise<void> {
    let senderBalance = await ctx.stub.getState(addressFrom);
    let receiverBalance = await ctx.stub.getState(addressTo);

    let senderBalanceVal = parseFloat(senderBalance);
    let receiverBalanceVal = parseFloat(receiverBalance)

    if (senderBalanceVal > amount) {
      senderBalanceVal -= amount;
      receiverBalanceVal += amount;

      await ctx.stub.putState(addressFrom, Buffer.from(senderBalanceVal.toString()));
      await ctx.stub.putState(addressTo, Buffer.from(receiverBalanceVal.toString()));
    } else {
      throw new Error('Sender has not enough amount to transfer');
    }
  }

    async addContract(stub, args, thisClass) {

    let contractName = args[0];
    let balance = parseFloat(args[1]);

    let key = contractName;
    let contractDetail = await stub.getState(key);


    if (!contractDetail || !contractDetail.toString()) {
      await stub.putState(key, Buffer.from(balance.toString()));
    }

  }
  
  async addAccount(stub, args, thisClass) {
    let accountAddress = args[0];
    let initialAmount = parseFloat(args[1]);
    await stub.putState(accountAddress, Buffer.from(initialAmount.toString()));
  }

  async getBalance(stub, args, thisClass) {

    let accountAddress = args[0];
    let senderBalance = await stub.getState(accountAddress);
    return senderBalance;
  }

  async addBalance(stub, args, thisClass) {
    let accountAddress = args[0];
    let amountAdded = parseFloat(args[1]);
    let accountBalance = await stub.getState(accountAddress);
    let accountBalanceVal = parseFloat(accountBalance);
    accountBalanceVal += amountAdded;
    await stub.putState(accountAddress, Buffer.from(accountBalanceVal.toString()));
  }

  async removeContract(stub, args, thisClass) {
    let contractAddress = args[0];
    await stub.deleteState(contractAddress)
  }

};

shim.start(new Chaincode());
 */