var ChainList = artifacts.require("./HomeCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(ChainList);
};
