pragma solidity ^0.4.11;

contract HomeCoin {

    struct ShareHolder {
        address adrs;
        uint shares;
    }

    //custom typeof
    struct Home {
        uint id;
        address seller;
        uint[] shareHoldersList;
        mapping(uint => ShareHolder) shareHolders;
        string name;
        string description;
        uint256 price;
    }

    // State variables
    mapping(uint => Home) homes;
    uint[] homeList;
    uint homeCounter = 0;
    uint shareHolderCounter = 0;
    uint totalBlocks = 10000;

    //sell home event
    event sellHomeEvent(uint indexed id, address indexed _seller,  address owners, string _name, string description, uint256 _price);
    //home Sold
    event buyHomeEvent(uint indexed id, address indexed _seller, string _name, uint256 _price);

    // sell an home
    function sellHome(string _name, string _description, uint256 _price, address ownersAdresses) public {
        homeCounter++;
        homes[homeCounter].id = homeCounter;
        homes[homeCounter].seller = msg.sender;
        homes[homeCounter].name = _name;
        homes[homeCounter].description = _description;
        homes[homeCounter].price = _price;
        homeList.push(homeCounter);
        sellHomeEvent(homeCounter, msg.sender, ownersAdresses, _name, _description, _price);
    }


    function getHome(uint _id) public constant returns (uint id, address seller, string name, string description, uint256 price, uint numOfShareHolders)
    {
        return(
        homes[_id].id,
        homes[_id].seller,
        homes[_id].name,
        homes[_id].description,
        homes[_id].price,
        homes[_id].shareHoldersList.length);
    }

    function addShareHolder(uint homeId, address shrAdr){
        shareHolderCounter++;
        homes[homeId].shareHoldersList.push(shareHolderCounter);
        homes[homeId].shareHolders[shareHolderCounter].adrs = shrAdr;
        homes[homeId].shareHolders[shareHolderCounter].shares = 0;
    }

    function getHomeShareHolder(uint _homeId, uint _shId) public constant returns(address adr, uint shares)
    {
        return(
        homes[_homeId].shareHolders[_shId].adrs,
        homes[_homeId].shareHolders[_shId].shares);
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
