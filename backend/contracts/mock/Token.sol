// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20{

    constructor() ERC20("MockToken", "MTK"){
        _mint(msg.sender,1000*10**18);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}


contract MMatic is ERC20{

    constructor() ERC20("MockMatic", "MMAT"){
        _mint(msg.sender,1000*10**18);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract MCrv is ERC20{

    constructor() ERC20("MockCRV", "MCRV"){
        _mint(msg.sender,1000*10**18);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract MUsdt is ERC20{

    constructor() ERC20("MockUSDT", "MUsdt"){
        _mint(msg.sender,1000*10**18);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}