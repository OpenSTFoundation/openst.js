'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const ContractName = 'TokenRules';

/**
 * This library is used to interact with Recovery contracts.
 */
class TokenRules {
  /**
   * TokenRules class constructor.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address delayedRecovery proxy contract address.
   */
  constructor(auxiliaryWeb3, address) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      const err = new TypeError("Mandatory Parameter 'auxiliaryWeb3' is missing or invalid.");
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(address)) {
      const err = new TypeError(`Mandatory Parameter 'address' is missing or invalid: ${address}.`);
      return Promise.reject(err);
    }

    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.address = address;

    this.contract = Contracts.getTokenRules(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load TokenRules contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys TokenRules contract.
   *
   * @param {Web3} auxiliaryWeb3 Origin chain web3 object.
   * @param {String} organization Organization which holds all the keys needed to administer the economy.
   * @param {String } eip20Token EIP20 token contract address deployed for an economy.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<TokenRules>} Promise containing the TokenRules
   *                              instance that has been deployed.
   */
  static async deploy(auxiliaryWeb3, organization, eip20Token, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = TokenRules.deployRawTx(auxiliaryWeb3, organization, eip20Token);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new TokenRules(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy TokenRules contract.
   *
   * @param {auxiliaryWeb3} auxiliaryWeb3 Auxiliary chain web3 object.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(auxiliaryWeb3, organization, eip20Token) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      throw new TypeError(`Mandatory Parameter 'auxiliaryWeb3' is missing or invalid: ${auxiliaryWeb3}`);
    }
    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [organization, eip20Token];
    const contract = Contracts.getTokenRules(auxiliaryWeb3, organization, eip20Token);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }

  /**
   * It is used to register a custom rule to the economy.
   *
   * @param {String} ruleName Name of the rule.
   * @param {String} ruleAddress Contract address of the rule.
   * @param {String} ruleAbi Abi of the rule.
   * @param {Object} txOptions Tx options.
   *
   * @return Promise object.
   */
  async registerRule(ruleName, ruleAddress, ruleAbi, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    const txObject = await this.registerRuleRawTx(ruleName, ruleAddress, ruleAbi);
    return Utils.sendTransaction(txObject, txOptions);
  }

  /**
   * Private method which is used to register a custom rule in the economy.
   *
   * @param {String} ruleName Name of the rule.
   * @param {String} ruleAddress Contract address of the rule.
   * @param {String} ruleAbi Abi of the rule.
   * @private
   */
  registerRuleRawTx(ruleName, ruleAddress, ruleAbi) {
    if (!Web3.utils.isAddress(ruleAddress)) {
      const err = new TypeError(`Invalid ruleAddress: ${ruleAddress}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.registerRule(ruleName, ruleAddress, ruleAbi);
  }

  /**
   * It is used to get the executable data for directTransfers method of TokenRules.
   *
   * @param transferTos List of addresses to transfer.
   * @param transfersAmounts List of amounts to transfer.
   *
   * @returns Executable data of directTransfers method.
   */
  getDirectTransferExecutableData(transferTos, transfersAmounts) {
    return this.contract.methods.directTransfers(transferTos, transfersAmounts).encodeABI();
  }

  /**
   * It is used to fetch rule data by its name.
   * Rule data consists:
   *  - RuleName: Name of the rule.
   *  - RuleAddress: Contract address of the rule contract.
   *  - RuleAbi: JSON interface of the rule.
   *
   * @param ruleName Name of the rule.
   *
   * @returns Rule data if present.
   */
  async getRuleByName(ruleName) {
    const ruleNameHash = this.auxiliaryWeb3.utils.soliditySha3({ t: 'string', v: ruleName });
    const ruleIndex = await this.contract.methods.rulesByNameHash(ruleNameHash).call();
    return this.contract.methods.rules(ruleIndex.index).call();
  }

  /**
   * It is used to fetch rule data by its address.
   * Rule data consists:
   *  - RuleName: Name of the rule.
   *  - RuleAddress: Contract address of the rule contract.
   *  - RuleAbi: JSON interface of the rule.
   *
   * @param ruleAddress Address of the rule contract.
   *
   * @returns Rule data if present.
   */
  async getRuleByAddress(ruleAddress) {
    const ruleIndex = await this.contract.methods.rulesByAddress(ruleAddress).call();
    return this.contract.methods.rules(ruleIndex.index).call();
  }
}

module.exports = TokenRules;