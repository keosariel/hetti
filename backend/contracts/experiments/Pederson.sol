// SPDX-License-Identifier: MIT

pragma solidity ^0.8.5;

library ExPerderson {

    // TODO: use a large prime number
    uint public constant P = 19;
    uint public constant G = 5;

    function random(uint num) public view returns(uint){
        return uint(keccak256(abi.encodePacked(block.timestamp,block.difficulty, 
        msg.sender))) % num;
    }

    function commit(uint v, uint h) public view returns (uint c, uint r) {
        r = random(P-1);
        c = ((G ** v) % P) * ((h ** r) % P) % P;
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

    function verify(uint c, uint v, uint h, uint r) public pure returns (bool) {
        return c == ((G ** v) % P) * ((h ** r) % P) % P;
    }
}