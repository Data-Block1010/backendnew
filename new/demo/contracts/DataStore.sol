// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DataStore {
    struct DataRecord {
        string dataHash;
        address owner;
    }

    // Mapping from user address to data records
    mapping(address => DataRecord[]) private records;

    // Mapping to track access rights
    mapping(address => mapping(address => bool)) private accessControl;

    // Owner of the contract
    address private contractOwner;

    // Events to notify updates and access changes
    event DataUpdated(address indexed owner, string dataHash);
    event AccessGranted(address indexed owner, address indexed grantedTo);
    event AccessRevoked(address indexed owner, address indexed revokedFrom);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // Modifier to restrict access to only the contract owner
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Not contract owner.");
        _;
    }

    // Modifier to restrict access to only the data owner
    modifier onlyDataOwner(uint256 _index) {
        require(records[msg.sender][_index].owner == msg.sender, "You don't own this data.");
        _;
    }

    // Constructor to set the contract owner
    constructor() {
        contractOwner = msg.sender;
    }

    // Store data (users can store multiple data hashes)
    function storeData(string memory _dataHash) public {
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");

        // Push the new data record to the user’s data records
        records[msg.sender].push(DataRecord(_dataHash, msg.sender));

        emit DataUpdated(msg.sender, _dataHash);
    }

    // Batch store data hashes to reduce individual transaction calls
    function storeMultipleData(string[] memory _dataHashes) public {
        for (uint i = 0; i < _dataHashes.length; i++) {
            storeData(_dataHashes[i]); // Reuse the storeData function to batch store
        }
    }

    // Update existing data (only the owner can update their specific data)
    function updateData(uint256 _index, string memory _dataHash) public onlyDataOwner(_index) {
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");
        records[msg.sender][_index].dataHash = _dataHash;

        emit DataUpdated(msg.sender, _dataHash);
    }

    // Grant access to multiple users at once to save gas
    function batchGrantAccess(address[] memory _users) public {
        for (uint i = 0; i < _users.length; i++) {
            grantAccess(_users[i]);
        }
    }

    // Grant access to a dataHash for another user (only the owner can grant access)
    function grantAccess(address _user) public {
        require(_user != address(0), "Invalid user address");
        require(!accessControl[msg.sender][_user], "Access already granted");

        accessControl[msg.sender][_user] = true;
        emit AccessGranted(msg.sender, _user);
    }

    // Revoke access for multiple users at once to save gas
    function batchRevokeAccess(address[] memory _users) public {
        for (uint i = 0; i < _users.length; i++) {
            revokeAccess(_users[i]);
        }
    }

    // Revoke access to a dataHash for another user (only the owner can revoke access)
    function revokeAccess(address _user) public {
        require(_user != address(0), "Invalid user address");
        require(accessControl[msg.sender][_user], "Access not granted");

        accessControl[msg.sender][_user] = false;
        emit AccessRevoked(msg.sender, _user);
    }

    // Transfer ownership of a specific data entry
    function transferDataOwnership(uint256 _index, address _newOwner) public onlyDataOwner(_index) {
        require(_newOwner != address(0), "New owner address cannot be zero.");

        // Transfer data ownership to the new owner
        records[_newOwner].push(records[msg.sender][_index]);

        // Remove the data from the old owner to save gas
        removeData(_index);
        emit OwnershipTransferred(msg.sender, _newOwner);
    }

    // Retrieve all data for a given owner address
    function getData(address _owner) public view returns (DataRecord[] memory) {
        require(_owner != address(0), "Invalid owner address");
        require(
            msg.sender == _owner || accessControl[_owner][msg.sender],
            "You do not have access to this data."
        );
        return records[_owner];
    }

    // Retrieve specific data by hash for a given owner
    function getDataByHash(address _owner, string memory _dataHash) public view returns (string memory, address) {
        require(_owner != address(0), "Invalid owner address");
        require(
            msg.sender == _owner || accessControl[_owner][msg.sender],
            "You do not have access to this data."
        );

        for (uint i = 0; i < records[_owner].length; i++) {
            if (keccak256(abi.encodePacked(records[_owner][i].dataHash)) == keccak256(abi.encodePacked(_dataHash))) {
                return (records[_owner][i].dataHash, records[_owner][i].owner);
            }
        }

        revert("Data not found");
    }

    // Transfer ownership of the contract to another address
    function transferContractOwnership(address _newOwner) public onlyContractOwner {
        require(_newOwner != address(0), "New owner address cannot be zero.");
        contractOwner = _newOwner;
        emit OwnershipTransferred(msg.sender, _newOwner);
    }

    // Get the current contract owner
    function getContractOwner() public view returns (address) {
        return contractOwner;
    }

    // Internal function to remove data at a specific index (efficient gas use for deletion)
    function removeData(uint256 _index) internal {
        uint length = records[msg.sender].length;
        require(_index < length, "Invalid index");

        // Move the last element to the position of the removed element
        if (_index < length - 1) {
            records[msg.sender][_index] = records[msg.sender][length - 1];
        }

        // Pop the last element to reduce the array size
        records[msg.sender].pop();
    }
}
