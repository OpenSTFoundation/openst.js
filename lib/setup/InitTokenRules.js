'use strict';

const deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const InitTokenRules = function(params) {
  const oThis = this;

  oThis.web3Provider = params.web3Provider;
  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;
  // args = [organization, token]
  // organization and token address
  oThis.args = params.args;
};

InitTokenRules.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployTokenRulesOnAuxiliary();
  },

  deployTokenRulesOnAuxiliary: async function() {
    const oThis = this;

    console.log('unlocking account.');
    await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);

    let contractName = 'TokenRules';
    console.log('Deploy TokenRules contract on auxiliary chain START.');
    let tokenRulesDeployResponse = await new deployContract({
      web3: oThis.web3Provider,
      contractName: contractName,
      deployerAddress: oThis.deployerAddress,
      gasPrice: oThis.gasPrice,
      gas: oThis.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: oThis.args
    }).deploy();

    oThis.tokenRulesContractAddress = tokenRulesDeployResponse.receipt.contractAddress;

    console.log('TokenRules ContractAddress :', oThis.tokenRulesContractAddress);

    return tokenRulesDeployResponse;
  }
};

module.exports = InitTokenRules;