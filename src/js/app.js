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
                    return home;
                }).then(function (home) {
                    App.setShareHolders(home);
                });
            }
            App.loading = false;
        }).catch(function (err) {
            console.log(err.message);
            App.loading = false;
        });
    },

    displayHome: function (home) {
        console.log("dh:" + home);
        var homesRow = $('#homesRow');
        var etherPrice = web3.fromWei(home[4], "ether");
        console.log(etherPrice);
        var homeTemplate = $('#homeTemplate');
        homeTemplate.find('.panel-title').text(home[2]);
        homeTemplate.find('.home-id').text(home[0]);
        homeTemplate.find('.home-description').text(home[3]);
        homeTemplate.find('.block-price').text("€" + etherPrice + ",-");
        homeTemplate.find('.seller-blocks').text("10000/10000");
        homeTemplate.find('.num-share').text(home[5]);
        homeTemplate.find('.btn-buy').attr("data-id", home[0]);
        homeTemplate.find('.btn-buy').attr("data-value", etherPrice);

        if (home[1] == App.account) {
            homeTemplate.find('.home-seller').text("You");
            homeTemplate.find('.btn-buy').hide();
            homeTemplate.find('.btn-add-holder').show();
        } else {
            homeTemplate.find('.home-seller').text(home[1]);
            homeTemplate.find('.btn-buy').show();
            homeTemplate.find('.btn-add-holder').hide();
        }

        homesRow.append(homeTemplate.html());
    },

    setShareHolders: function (home) {

        var appender = $('#appender');

        var chainListInstance;
        App.contracts.HomeCoin.deployed().then(function (instance) {
            chainListInstance = instance;
            var translateRequests = [];

            for (var i = 1; i <= home[5]; i++) {
                translateRequests.push(chainListInstance.getHomeShareHolder(home[0], i));
            }


            Promise.all(translateRequests).then(function (translateResults) {
                console.log(translateResults);
                for (var j = 0; j < translateResults.length; j++) {
                    appender.append('' +
                        '<label>Shareholder ' + (j+1) + ':</label>' +
                        ' <div class="row">' +
                        '<div class="col-md-2"><b>Address: </b></div>' +
                        '<div class="col-md-8">' + translateResults[j][0] + '</div>' +
                        '</div>' +
                        ' <div class="row">' +
                        '<div class="col-md-2"><b>Shares: </b></div>' +
                        '<div class="col-md-8">' + translateResults[j][1] + '</div>' +
                        '</div>' +
                        ' <div class="row">' +
                        '<div class="col-md-2"><b>For Sale: </b></div>' +
                        '<div class="col-md-8">' + translateResults[j][1] + '</div>' +
                        '</div><br>');
                }
            });
        });
        /*.then(function (sh) {

         var sh2 = sh;
         console.log(sh2)
         appender.append('<div class="form-group"><label for="home_name">Shareholder address</label>' + sh2[0] + '</div>');
         });*/


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
