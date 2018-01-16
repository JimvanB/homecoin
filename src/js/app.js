App = {
    web3Provider: null,
    contracts: {},
    account: 0x0,
    loading: false,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            //do instantiate new one because of version differences
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new
            Web3.providers.HttpProvider('http://localhost:8545');
            web3 = new Web3(App.web3Provider);
        }
        console.log(App.web3Provider.constructor.name + ' injected');
        App.displayAccountInfo();
        App.initContract();
    },

    displayAccountInfo: function () {
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#account").text(account);
                web3.eth.getBalance(account, function (err, balance) {
                    if (err === null) {
                        $("#accountBalance").text(web3.fromWei(balance, "ether") + " ETH");
                    }
                });
            }
        });
    },

    initContract: function () {
        $.getJSON('HomeCoin.json', function (chainListArtifact) {
            App.contracts.HomeCoin = TruffleContract(chainListArtifact);
            App.contracts.HomeCoin.setProvider(App.web3Provider);
            App.listenToEvents();
            App.reloadHomes();
        });
    },


    reloadHomes: function () {
        if (App.loading) {
            return;
        }

        App.loading = true;

        App.displayAccountInfo();

        var chainListInstance;

        App.contracts.HomeCoin.deployed().then(function (instance) {
            chainListInstance = instance;
            return instance.getHomesForSale();
        }).then(function (homeIds) {

            var homesRow = $('#homesRow');
            homesRow.empty();

            for (var i = 0; i < homeIds.length; i++) {
                homeId = homeIds[i];
                chainListInstance.getHome(homeId).then(function (home) {
                    App.displayHome(home);
                });
            }
            App.loading = false;
        }).catch(function (err) {
            console.log(err.message);
            App.loading = false;
        });
    },

    displayHome: function (home) {
        var homesRow = $('#homesRow');
        var etherPrice = web3.fromWei(home[4], "ether");
        var homeTemplate = $('#homeTemplate');
        homeTemplate.find('.panel-title').text(home[2]);
        homeTemplate.find('.home-id').text(home[0]);
        homeTemplate.find('.home-description').text(home[3]);
        homeTemplate.find('.block-price').text("€" + etherPrice + ",-");
        homeTemplate.find('.num-share').text(home[5]);
        homeTemplate.find('.btn-add-holder').attr("data-id", home[0]);
        homeTemplate.find('.btn-show-holders').attr("data-id", home[0]);
        homeTemplate.find('.btn-sell-blocks').attr("data-id", home[0]);
        homeTemplate.find('.btn-buy').attr("data-id", home[0]);
        homeTemplate.find('.btn-buy').attr("data-value", etherPrice);

        if (home[1] == App.account) {
            homeTemplate.find('.home-seller').text("You");
            homeTemplate.find('.btn-buy').hide();
            homeTemplate.find('.btn-add-holder').show();
            homeTemplate.find('.btn-sell-blocks').show();
        } else {
            homeTemplate.find('.home-seller').text(home[1]);
            homeTemplate.find('.btn-buy').show();
            homeTemplate.find('.btn-add-holder').hide();
            homeTemplate.find('.btn-sell-blocks').hide();
        }

        homesRow.append(homeTemplate.html());
    },

    setShareHolders: function () {


        var _homeId = $(event.target).data('id');
        console.log("HOMEID" + _homeId);
        var chainListInstance;
        App.contracts.HomeCoin.deployed().then(function (instance) {
            chainListInstance = instance;
            return chainListInstance.getHome(_homeId);
        }).then(function (home) {
                var translateRequests = [];

                for (var i = 1; i <= home[5]; i++) {
                    translateRequests.push(chainListInstance.getHomeShareHolder(home[0], i));
                    translateRequests.push(chainListInstance.getSharesForHouseByShareHolder(home[0], i));
                }


                Promise.all(translateRequests).then(function (translateResults) {
                    console.log(translateResults);
                    var appender = $('#appender');
                    appender.empty();

                    var shareHolderSharesTemplate = $('#shareHolderShares');

                    for (var j = 0; j < translateResults.length; j = j + 2) {

                        if (translateResults[j][0] === App.account) {
                            shareHolderSharesTemplate.find('.shareHolderLabel').text("You:");
                        }
                        else {
                            shareHolderSharesTemplate.find('.shareHolderLabel').text("ShareHolder:");
                        }
                        shareHolderSharesTemplate.find('.shareholder-address').text(translateResults[j][0]);
                        shareHolderSharesTemplate.find('.shares-total').text(translateResults[j + 1][0]);
                        shareHolderSharesTemplate.find('.shares-for-sale').text(translateResults[j + 1][1]);
                        appender.append(shareHolderSharesTemplate.html());
                    }
                });
            }
        );
    },

    sellBlocksShow: function () {


        var _homeId = $(event.target).data('id');
        console.log("HOMEID" + _homeId);
        var chainListInstance;
        App.contracts.HomeCoin.deployed().then(function (instance) {
            chainListInstance = instance;
            return chainListInstance.getHome(_homeId);
        }).then(function (home) {
                var translateRequests = [];

                for (var i = 1; i <= home[5]; i++) {
                    translateRequests.push(chainListInstance.getHomeShareHolder(home[0], i));
                    translateRequests.push(chainListInstance.getSharesForHouseByShareHolder(home[0], i));
                }


                Promise.all(translateRequests).then(function (translateResults) {
                    console.log(translateResults);
                    var appender = $('#appender');
                    appender.empty();

                    var sellBlocksTemplate = $('#sellBlocks');

                    for (var j = 0; j < translateResults.length; j = j + 2) {

                        if (translateResults[j][0] === App.account) {
                            sellBlocksTemplate.find('.num-of-shares').text("You own: "+translateResults[j+1][0]);
                        }
                        appender.append(sellBlocksTemplate.html());
                    }
                });
            }
        );
    },

    sellHome: function () {
        var _homeName = $("#home_name").val();
        var _homeDescription = $("#home_description").val();
        var _homePrice = web3.toWei(parseFloat($("#home_price").val() || 0), "ether");
        var _homeOwners = $("#home_owners").val();

        if ((_homeName.trim() == '') || (_homePrice == 0)) {
            return false;
        }
        App.contracts.HomeCoin.deployed().then(function (instance) {
            return instance.sellHome(_homeName, _homeDescription, _homePrice, App.account, {
                from: App.account,
                gas: 500000
            });
        }).catch(function (err) {
            console.log(err.message);
        });

    }
    ,

    addHomeId: function () {
        event.preventDefault();

        var _homeId = $(event.target).data('id');
        console.log(_homeId);
        var addHolderTemplate = $('#addHolder');
        addHolderTemplate.find('.add-holder').attr("data-id", _homeId);
    }
    ,

    addShareHolder: function () {
        event.preventDefault();

        var _homeId = $(event.target).data('id');
        console.log(_homeId);
        var address = $("#holder_address").val();

        App.contracts.HomeCoin.deployed().then(function (instance) {
            return instance.addShareHolder(_homeId, address, {
                from: App.account,
                gas: 500000
            });
        }).catch(function (err) {
            console.log(err.message);
        });

    }
    ,

    listenToEvents: function () {
        App.contracts.HomeCoin.deployed().then(function (instance) {
            instance.sellHomeEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function (error, event) {
                $('#events').append('<li class="list-group-item">' + event.args._name + ' is for sale' + '</li>');
                App.reloadHomes();
            });

            instance.buyHomeEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function (error, event) {
                $('#events').append('<li class="list-group-item">' + event.args._name + ' is for bought' + '</li>');
                App.reloadHomes();
            });

        });
    }
    ,

    buyHome: function () {
        event.preventDefault();

        var _homeId = $(event.target).data('id');
        var _price = parseFloat($(event.target).data('value'));

        App.contracts.HomeCoin.deployed().then(function (instance) {
            return instance.buyHome(homeId, {
                from: App.account,
                value: web3.toWei(_price, "ether"),
                gas: 500000
            });
        }).then(function (results) {

        }).catch(function (err) {
            console.log(err.message);
        });
    }
    ,
}
;

$(function () {
    $(window).load(function () {
        App.init();
        $.getJSON("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=EUR", function (data) {
            console.log(data.EUR);
        });
    });
});
