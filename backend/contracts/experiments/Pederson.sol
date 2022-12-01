// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

library ExPerderson {

    // TODO: use a large prime number
    uint public constant P = 0xc456aa3b7852a6e9283b2d8167b85c85;
    uint public constant G = 0x1e848769136e5df42080f3959c96d462;
    uint public constant Q = 2791360890540567458532793717447734518472938886587;

    function random(uint num) public view returns(uint){
        return uint(keccak256(abi.encodePacked(block.timestamp,block.difficulty, 
        msg.sender))) % num;
    }

    function commit(uint v) public view returns (uint, uint, uint) {
        uint s = random(Q-1); // secret
        uint h = powmod(G, s, P);
        return _commit(v, h);
    }

    function _commit(uint _v, uint _h) private view  returns (uint c, uint r, uint h) {
        r = random(P-1);
        c = powmod(G, _v, P) * powmod(_h, r, P) % P;
        h = _h;
    }

    function add(uint[] memory cs) public pure returns (uint) {
        uint cm = 1;
        for (uint i = 0; i < cs.length;) {
            cm = (cm * cs[i]);
            unchecked {
                i++;
            }   
        }

        return cm % P;
    }

    function powmod(uint256 base, uint256 e, uint256 m) public view
        returns (uint256 o)
    {
        // returns pow(base, e) % m
        assembly {
            // define pointer
            let p := mload(0x40)

            // Store data assembly-favouring ways
            mstore(p, 0x20)             // Length of Base
            mstore(add(p, 0x20), 0x20)  // Length of Exponent
            mstore(add(p, 0x40), 0x20)  // Length of Modulus
            mstore(add(p, 0x60), base)  // Base
            mstore(add(p, 0x80), e)     // Exponent
            mstore(add(p, 0xa0), m)     // Modulus

            // call modexp precompile! -- old school gas handling
            let success := staticcall(sub(gas(), 2000), 0x05, p, 0xc0, p, 0x20)

            // gas fiddling
            switch success case 0 {
                revert(0, 0)
            }

            // data
            o := mload(p)
        }
    }
}