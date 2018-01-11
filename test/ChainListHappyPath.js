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
  var articleName2 = "article 2";
  var articleDescription2 = "Description for article 2";
  var articlePrice2 = 20;
  var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  // Test case: check initial values
  it("should be initialized with empty values", function() {
    return ChainList.deployed().then(function(instance) {
      return instance.getNumberOfArticles();
    }).then(function(data) {
      assert.equal(data, 0x0, "number of articles must be zero");
    });
  });

  // Test case: sell an article
  it("should sell an article", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.sellArticle(articleName1, articleDescription1, web3.toWei(articlePrice1, "ether"), {
        from: seller
      });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event shoyld have been recorded");
      assert.equal(receipt.logs[0].event, "sellArticleEvent", "should be sell article event");
      assert.equal(receipt.logs[0].args._id,toNumber(), 1, "id must be 1");
      assert.equal(receipt.logs[0].args._seller,toNumber(), seller, "seller must be "+seller);
      assert.equal(receipt.logs[0].args._name, articleName1, "articleName must be "+articleName1);
      assert.equal(receipt.logs[0].args._price,toNumber(), web3.toWei(articlePrice1, "ether"), "must be price");

      return chainListInstance.getNumberOfArticles();
    }).then(function(data){
      assert.equal(data.length,1, "must be one article for sale");
      articleId = data[0].toNumber();
      assert.equal(articleId,1,"article id mst be 1");

      return chainListInstance.article(articleId);
    }).then(function(data){
      assert.equal(data[0].toNumber(),1, " article id must be 1");
      assert.equal(data[1],seller, " seller must be seller");
      assert.equal(data[2],0x0, "buyer must be empty");
      assert.equal(data[3],articleName1, " article name must be name");
      assert.equal(data[4],articleDescription1, " article desciption");
      assert.equal(data[5].toNumber(),web3.toWei(articlePrice1, "ether"), "article price must be the price");
    })
  });

  // Test case: sell an article
  it("should sell second article", function() {
    return ChainList.deployed().then(function(instance) {
      chainListInstance = instance;
      return chainListInstance.sellArticle(articleName2, articleDescription2, web3.toWei(articlePrice2, "ether"), {
        from: seller
      });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event shoyld have been recorded");
      assert.equal(receipt.logs[0].event, "sellArticleEvent", "should be sell article event");
      assert.equal(receipt.logs[0].args._id,toNumber(), 1, "id must be 1");
      assert.equal(receipt.logs[0].args._seller,toNumber(), seller, "seller must be "+seller);
      assert.equal(receipt.logs[0].args._name, articleName2, "articleName must be "+articleName2);
      assert.equal(receipt.logs[0].args._price,toNumber(), web3.toWei(articlePrice2, "ether"), "must be price");

      return chainListInstance.getArticlesForSale();
    }).then(function(data){
      assert.equal(data.length,2, "must be one article for sale");
      articleId = data[1].toNumber();
      assert.equal(articleId,2,"article id mst be 2");
      return chainListArtifact.getNumberOfArticles();
    }).then(function(data){
      assert.equal(data,2, "must be two articles")
      return chainListInstance.article(articleId);
    }).then(function(data){
      assert.equal(data[0].toNumber(),2, " article id must be 1");
      assert.equal(data[1],seller, " seller must be seller");
      assert.equal(data[2],0x0, "buyer must be empty");
      assert.equal(data[3],articleName2, " article name must be name");
      assert.equal(data[4],articleDescription2, " article desciption");
      assert.equal(data[5].toNumber(),web3.toWei(articlePrice2, "ether"), "article price must be the price");
    })
  });

  it("should buy first article", function(){
    return ChainList.deployed().then(function(instance){
      chainListInstance = instance;
      articleId=1;
      sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      return chainListInstance.buyHome({
        from: buyer,
        value: web3.toWei(articlePrice1, "ether")
      });
    }).then(function(receipt){
      assert.equal(receipt.logs.length,1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event,"buyArticleEvent", "should be buyArticleEvent");
      assert.equal(receipt.logs[0].args._id.toNumber(),"articleId", "articleId");
      assert.equal(receipt.logs[0].args._seller,seller, "should be "+seller);
      assert.equal(receipt.logs[0].args._buyer,buyer, "should be "+buyer);
      assert.equal(receipt.logs[0].args._price.toNumber(),web3.toWei(articlePrice,"ether"), " should be the same");

      sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy+articlePrice1, "seller should have earned " +articlePrice1 + " ETH");
      assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy-articlePrice1, "buyer should have spend" +articlePrice1 + " ETH");
      return chainListInstance.articles(articleId);
    }).then(function(data){
        assert.equal(data[0], seller, "seller must be " + seller);
        assert.equal(data[1], buyer, "buyer must be buyer");
        assert.equal(data[2], articleName1, "article name must be " + articleName1);
        assert.equal(data[3], articleDescription1, "article descriptio must be " + articleDescription1);
        assert.equal(data[4].toNumber(), web3.toWei(articlePrice, "ether"), "article price must be " + web3.toWei(articlePrice1, "ether"));

        return chainListInstance.getArticlesForSale();
      }).then(function(data){
        assert(data.length,1, "shoul now be one article for sale");
      })
    });
});
