// SPDX-License-Identifier: MIT

pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZkWERC20 {

    address public erc20Address; 

    constructor(address _erc20Address) {
        erc20Address = _erc20Address;
    } 
}