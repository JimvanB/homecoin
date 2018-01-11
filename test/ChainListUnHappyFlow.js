// Contract to be tested
var ChainList = artifacts.require("./HomeCoin.sol");

// Test suite
contract('ChainList', function(accounts) {
  var chainListInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var articleName = "article 1";
  var articleDescription = "Description for article 1";
  var articlePrice = 10;
  var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  it("exception when no article for sale", function(){
    return ChainList.deployed().then(function(instance){
      chainListInstance = instance;

      return chainListInstance.buyHome({
        from: buyer,
        value: web3.toWei(articlePrice, "ether")
      });
    }).then(assert.fail)
    .catch(function(error){
      assert(error.message.indexOf('revert') >= 0, "error should be revert");
    }).then(function(){
      return chainListInstance.getArticle();
    }).then(function(data){
        assert.equal(data[0], 0x0, "seller must be empty");
        assert.equal(data[1], 0x0, "buyer must be empty");
        assert.equal(data[2], '', "article name must be empty");
        assert.equal(data[3], '' , "article descriptio must be empty");
        assert.equal(data[4].toNumber(), 0, "article price must be 0");
      });
    });

    it("exception when own article for sale", function(){
      return ChainList.deployed().then(function(instance){
        chainListInstance = instance;
        return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, "ether"), {
          from: seller
        });
      }).then(function(receipt){
        return chainListInstance.buyHome({
          from: seller,
          value: web3.toWei(articlePrice, "ether")
        });
      }).then(assert.fail)
      .catch(function(error){
        assert(error.message.indexOf('revert') >= 0, "error should be revert");
      }).then(function(){
        return chainListInstance.getArticle();
      }).then(function(data){
        assert.equal(data[0], seller, "seller must be " + seller);
        assert.equal(data[1], 0x0, "buyer must be empty");
        assert.equal(data[2], articleName, "article name must be " + articleName);
        assert.equal(data[3], articleDescription, "article descriptio must be " + articleDescription);
        assert.equal(data[4].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
        });
      });

      it("exception when incorrect price", function(){
        return ChainList.deployed().then(function(instance){
          chainListInstance = instance;
          return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, "ether"), {
            from: seller
          });
        }).then(function(receipt){
          return chainListInstance.buyHome({
            from: seller,
            value: web3.toWei(articlePrice, "ether")+1
          });
        }).then(assert.fail)
        .catch(function(error){
          assert(error.message.indexOf('revert') >= 0, "error should be revert");
        }).then(function(){
          return chainListInstance.getArticle();
        }).then(function(data){
          assert.equal(data[0], seller, "seller must be " + seller);
          assert.equal(data[1], 0x0, "buyer must be empty");
          assert.equal(data[2], articleName, "article name must be " + articleName);
          assert.equal(data[3], articleDescription, "article descriptio must be " + articleDescription);
          assert.equal(data[4].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
          });
        });

        it("exception when already sold", function(){
          return ChainList.deployed().then(function(instance){
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, "ether"), {
              from: seller
            });
          }).then(function(){
            return chainListInstance.buyHome({
              from: buyer,
              value: web3.toWei(articlePrice, "ether")
            });
          }).then(function(receipt){
            return chainListInstance.buyHome({
              from: seller,
              value: web3.toWei(articlePrice, "ether")+1
            });
          }).then(assert.fail)
          .catch(function(error){
            assert(error.message.indexOf('revert') >= 0, "error should be revert");
          }).then(function(){
            return chainListInstance.getArticle();
          }).then(function(data){
            assert.equal(data[0], seller, "seller must be " + seller);
            assert.equal(data[1], buyer, "buyer must "+buyer);
            assert.equal(data[2], articleName, "article name must be " + articleName);
            assert.equal(data[3], articleDescription, "article descriptio must be " + articleDescription);
            assert.equal(data[4].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice, "ether"));
            });
          });
});
