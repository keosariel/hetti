// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

library Pederson {
    int public constant G = 0x3ab23329af;
    int public constant H = 0x2be046e8afb5930;

    function random(int num) public view returns(int){
        return int(uint(keccak256(abi.encodePacked(block.timestamp,block.difficulty, 
        msg.sender)))) % num;
    }

    function commit(int _v, int _r) public view returns (int c, int r) {
        if(_r == 0) {
            _r = random(G-1);
        }
        c = (_r * G) + (_v * H);
        r = _r;
    }

    function verifyZero(bytes[] calldata _commitments) public view returns (bool) {
        int c = 0;
        int r = 0;

        for(uint i = 0; i < _commitments.length;) {
            (int _c, int _r) = abi.decode(_commitments[i], (int, int));

            if(i == 0) {
                if(r == 0) { r = _r; }
                if(c == 0) { c = _c; }
            }else{
                r -= _r;
                c -= _c;
            }

            unchecked {
                i++;
            }
        }

        (int c0, ) = commit(0, r);
        return c == int(c0);
    }

    function verify(int c, int r, int v) public pure returns (bool) {
        return (G * r) + (H * v) == c;
    }
}