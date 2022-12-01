// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

library Perdeson {
    uint public constant G = 0xc456aa3b7852a6e9283b2d8167b85c85;
    uint public constant H = 0x1e848769136e5df42080f3959c96d462;

    function random(uint num) public view returns(uint){
        return uint(keccak256(abi.encodePacked(block.timestamp,block.difficulty, 
        msg.sender))) % num;
    }

    function commit(uint _v, uint _r) public view returns (uint c, uint r) {
        if(_r == 0) {
            _r = random(G-1);
        }
        c = (_r * G)+ (_v * H);
        r = _r;
    }

    function verifyZero(bytes[] calldata _commitments) public view returns (bool) {
        uint c = 0;
        uint r = 0;

        for(uint i = 0; i < _commitments.length;) {
            (uint _c,uint _r) = abi.decode(_commitments[i], (uint, uint));
            r -= _r;
            c -= _c;
            unchecked {
                i++;
            }
        }

        (uint c0, ) = commit(0, r);
        return c == c0;
    }
}