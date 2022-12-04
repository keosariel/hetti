// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

import "./HettiPool.sol";
import "./interfaces/IHettiPool.sol";

contract HettiFactory {

    /// Errors
    error PoolExists();
    error ZeroAddress();
    error Forbidden();

    /// Events
    event PoolCreated(address indexed token, address poolAddress);

    address[] public allPools;
    address public manager;

    /// token => pool
    mapping(address => address) public pools;

    constructor(address _manager) {
        manager = _manager;
    }

    /// @notice Creates a new pool for the given token
    /// @param token The token to create a pool for
    function createPool(address token) public returns (address vault) {

        if (token == address(0)) revert ZeroAddress();
        if(pools[token] != address(0)) revert PoolExists();


        bytes memory bytecode = type(HettiPool).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token));

        assembly {
            vault := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        IHettiPool(vault).initialize(token);

        pools[token] = vault;
        allPools.push(vault);

        emit PoolCreated(token, vault);
    }

    /// @notice Returns the amount of pools created
    function allPoolsLength() external view returns (uint) {
        return allPools.length;
    }

    function setManager(address _manager) external {
        if (msg.sender != manager) revert Forbidden();
        manager = _manager;
    }
}