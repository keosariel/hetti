// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

interface HettiFactory {
    function createPool(address token) external returns (address vault);
    function allPoolsLength() external view returns (uint);
    function setManager(address _manager) external;
}