pragma solidity ^0.4.11;

contract HomeCoin {

    //custom typeof
    struct Home {
        uint id;
        address seller;
        address owners;
        string name;
        string description;
        uint256 price;
    }

    struct Owner {
        address owner;
        uint blocks;
    }

    // State variables
    mapping(uint => Home) public homes;
    uint homeCounter = 0;
    uint totalBlocks = 10000;

    //sell home event
    event sellHomeEvent(uint indexed id, address indexed _seller,  address owners, string _name, string description, uint256 _price);
    //home Sold
    event buyHomeEvent(uint indexed id, address indexed _seller, string _name, uint256 _price);

    // sell an home
    function sellHome(string _name, string _description, uint256 _price, address ownersAdresses) public {
        homeCounter++;
        homes[homeCounter] = Home(homeCounter, msg.sender, ownersAdresses, _name, _description, _price);
        sellHomeEvent(homeCounter, msg.sender, ownersAdresses, _name, _description, _price);
    }

    //buy home
    function buyHome(uint _id) payable public returns (uint[]) {
        if (homeCounter == 0) {
            return new uint[](0);
        }
        require(_id > 0 && _id <= homeCounter);
        Home storage home = homes[_id];
        require(home.seller != msg.sender);
        require(home.price == msg.value);
        home.seller.transfer(msg.value);
        buyHomeEvent(_id, home.seller, home.name, home.price);
    }

    function getNumberOfHomes() public constant returns (uint){
        return homeCounter;
    }

    function getHomesForSale() public constant returns (uint[]){
        if (homeCounter == 0) {
            return new uint[](0);
        }

        uint[] memory homeIds = new uint[](homeCounter);

        uint numberOfHomesForSale = 0;
        for (uint i = 1; i <= homeCounter; i++) {

                homeIds[numberOfHomesForSale] = homes[i].id;
                numberOfHomesForSale++;

        }

        uint[] memory forSale = new uint[](numberOfHomesForSale);
        for (uint j = 0; j < numberOfHomesForSale; j++) {
            forSale[j] = homeIds[j];
        }
        return (forSale);
    }

}
