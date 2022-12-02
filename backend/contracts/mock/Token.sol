// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20{

    constructor() ERC20("MockToken", "MTK"){
        _mint(msg.sender,1000*10**18);
    }
}