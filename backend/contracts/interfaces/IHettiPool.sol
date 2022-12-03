// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

interface IHettiPool {
    function initialize(address _token) external;
    function withdraw(
        address payable recipient, uint256 amountToken, uint256 ringIndex,
        uint256 c0, uint256[2] memory keyImage, uint256[] memory s
    ) external;
    function deposit(uint _amount, uint256[2] memory publicKey) external;
    function getBalance() external view returns (uint256);
}