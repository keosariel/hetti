// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./lib/AltBn128.sol";
import "./lib/LSAG.sol";


contract HettiPool {

    // =============================================================
    //                           Errors
    // =============================================================
    
    error AlreadyInitialized();
    error NotInitialized();

    // =============================================================
    //                           CONSTANTS
    // =============================================================

    // Maximum number of participants in a ring
    uint256 constant MAX_RING_PARTICIPANT = 5;

    // Minimum number of blocks that needs to be mined
    // before user can forcefully close the ring
    // NOTE: This is only for testing purposes, in production
    // this should be set to a higher value
    uint256 constant CLOSE_RING_BLOCK_THRESHOLD = 10;

    // The number of participants in the ring
    uint256 constant _BITPOS_NUMBER_PARTICIPANTS = 32;

    // The number of withdrawals in the ring
    uint256 constant _BITPOS_NUMBER_WITHDRAWALS = 48;

    uint256 constant _BITWIDTH_PARTICIPANTS = 16;
    uint256 constant _BITWIDTH_BLOCK_NUM = 32;
    uint256 constant _BITMASK_BLOCK_NUM = (1 << _BITWIDTH_BLOCK_NUM) -1;
    uint256 constant _BITMASK_PARTICIPANTS = (1 << _BITWIDTH_PARTICIPANTS) -1;

    // =============================================================
    //                           STORAGE
    // =============================================================

    struct Ring {
        // The total amount deposited in the ring
        uint256 amountDeposited;

        // Bits Layout:
        // - [0..32]    `initiatedBlockNumber` 
        // - [32..48]   `numberOfParticipants`
        // - [48..64]   `numberOfWithdrawnParticipants`
        uint256 packedRingData; 

        // The public keys of the participants
        mapping (uint256 => uint256[2]) publicKeys;

        // The key images from successfully withdrawn participants
        mapping (uint256 => uint256[2]) keyImages;
        bytes32 ringHash;
    }

    address public token;
    uint256 public tokenDecimals;
    uint256 public balance;

    uint256[10] allowedAmounts;

    // tokenAmount => ringIndex
    mapping(uint256 => uint256) public ringsNumber;

    // tokenAmount => ringIndex => Ring
    mapping (uint256 => mapping(uint256 => Ring)) public rings;

    /// @notice Initialize the vault to use and accept `token`
    /// @param _token The address of the token to use
    function initialize(address _token) public {
        if (token != address(0)) revert AlreadyInitialized();
        token = _token;
        tokenDecimals = ERC20(_token).decimals();

        for(uint256 i = 0; i < allowedAmounts.length; ) {
            allowedAmounts[i] = (2 ** i) * (10 ** tokenDecimals);

            unchecked {
                i++;
            }
        }
    }

    /// @notice Deposit `amount` of `token` into the vault
    /// @param _amount The amount of `token` to deposit
    /// @param _publicKey The public key of the participant
    function deposit(uint _amount, uint256[2] memory _publicKey) public {
        
        // Confirm amount sent is allowed
        uint256 amountTokenRecieved = amountCheck(_amount);

        ERC20(token).transferFrom(msg.sender, address(this), _amount);

        if (!AltBn128.onCurve(uint256(_publicKey[0]), uint256(_publicKey[1]))) {
            revert("PK_NOT_ON_CURVE");
        }

        // Gets the current ring for the amounts
        uint256 ringIndex = ringsNumber[amountTokenRecieved];
        Ring storage ring = rings[amountTokenRecieved][ringIndex];

        (uint wParticipants,
        uint participants, uint blockNum) = getRingPackedData(ring.packedRingData);

        // Making sure no duplicate public keys are added
        for (uint256 i = 0; i < participants;) {
            if (ring.publicKeys[i][0] == _publicKey[0] &&
                ring.publicKeys[i][1] == _publicKey[1]) {
                revert("PK_ALREADY_IN_RING");
            }

            unchecked {
                i++;
            }
        }

        if (participants == 0) {
            blockNum = block.number - 1;
        }

        ring.publicKeys[participants] = _publicKey;
        ring.amountDeposited += amountTokenRecieved;
        unchecked {
            participants++;
        }

        uint packedData = (wParticipants << _BITWIDTH_PARTICIPANTS) | participants;
        packedData = (packedData << _BITWIDTH_BLOCK_NUM) | blockNum;
        ring.packedRingData = packedData;

        // If the ring is full, start a new ring
        if (participants >= MAX_RING_PARTICIPANT) {
            ring.ringHash = hashRing(amountTokenRecieved, ringIndex);
            
            // Add new Ring pool
            ringsNumber[amountTokenRecieved] += 1;
        }
    }

    function withdraw(
        address payable recipient, uint256 amountToken, uint256 ringIndex,
        uint256 c0, uint256[2] memory keyImage, uint256[] memory s
    ) public
    {
        Ring storage ring = rings[amountToken][ringIndex];

        (uint wParticipants,
        uint participants, uint blockNum) = getRingPackedData(ring.packedRingData);

        if (recipient == address(0)) {
            revert("ZERO_ADDRESS");
        }
        
        if (wParticipants >= MAX_RING_PARTICIPANT) {
            revert("ALL_FUNDS_WITHDRAWN");
        }

        if (ring.ringHash == bytes32(0x00)) {
            revert("RING_NOT_CLOSED");
        }

        uint256[2][] memory publicKeys = new uint256[2][](MAX_RING_PARTICIPANT);

        for (uint256 i = 0; i < MAX_RING_PARTICIPANT;) {
            publicKeys[i] = ring.publicKeys[i];
            unchecked {
                i++;
            }
        }

        // Attempts to verify ring signature
        bool signatureVerified = LSAG.verify(
            abi.encodePacked(ring.ringHash, recipient), // Convert to bytes
            c0,
            keyImage,
            s,
            publicKeys
        );

        if (!signatureVerified) {
            revert("INVALID_SIGNATURE");
        }

        // Confirm key image is not already used (no double spends)
        for (uint i = 0; i < wParticipants;) {
            if (ring.keyImages[i][0] == keyImage[0] &&
                ring.keyImages[i][1] == keyImage[1]) {
                revert("USED_SIGNATURE");
            }

            unchecked {
                i++;
            }
        }    

        ring.keyImages[wParticipants] = keyImage;
        unchecked {
            wParticipants++;
        }

        uint packedData = (wParticipants << _BITWIDTH_PARTICIPANTS) | participants;
        packedData = (packedData << _BITWIDTH_BLOCK_NUM) | blockNum;
        ring.packedRingData = packedData;  

        ERC20(token).transfer(recipient, amountToken);
    }

    function hashRing(uint256 _amountToken, uint256 _ringIndex) internal view
        returns (bytes32)
    {
        uint256[2][MAX_RING_PARTICIPANT] memory publicKeys;
        uint256 receivedToken = amountCheck(_amountToken);

        Ring storage ring = rings[receivedToken][_ringIndex];

        for (uint8 i = 0; i < MAX_RING_PARTICIPANT;) {
            publicKeys[i] = ring.publicKeys[i];

            unchecked {
                i++;
            }
        }

        (uint participants,, uint blockNum) = getRingPackedData(ring.packedRingData);

        bytes memory b = abi.encodePacked(
            blockhash(block.number - 1),
            blockNum,
            ring.amountDeposited,
            participants,
            publicKeys
        );

        return keccak256(b);
    }

    function getRingHash(uint256 _amountToken, uint256 _ringIndex) public view
        returns (bytes32)
    {
        uint256 receivedToken = amountCheck(_amountToken);
        return rings[receivedToken][_ringIndex].ringHash;
    }

    function getPoolBalance() public view returns (uint256) {
        return ERC20(token).balanceOf(address(this));
    }

    // =============================================================
    //                           UTILITIES
    // =============================================================

    // @notice Checks if the amount sent is allowed
    // @param amount The amount of token to check
    function amountCheck(uint256 _amount) internal view
        returns (uint256)
    {
        bool allowed = false;

        for (uint256 i = 0; i < 10;) {
            if (allowedAmounts[i] == _amount) {
                allowed = true;
            }
            if (allowed) {
                break;
            }

            unchecked {
                i++;
            }
        }

        // Revert if token sent isn't in the allowed fixed amounts
        require(allowed, "AMOUNT_NOT_ALLOWED");
        return _amount;
    }

    function getPublicKeys(uint256 amountToken, uint256 index) public view
        returns (bytes32[2][MAX_RING_PARTICIPANT] memory)
    {
        amountCheck(amountToken);

        bytes32[2][MAX_RING_PARTICIPANT] memory publicKeys;

        for (uint i = 0; i < MAX_RING_PARTICIPANT; i++) {
            publicKeys[i][0] = bytes32(rings[amountToken][index].publicKeys[i][0]);
            publicKeys[i][1] = bytes32(rings[amountToken][index].publicKeys[i][1]);
        }

        return publicKeys;
    }

    function getRingPackedData(uint packedData) public view returns (uint256, uint256, uint256){
        uint256 p = packedData >> _BITWIDTH_BLOCK_NUM;
        
        return (
            p >> _BITWIDTH_PARTICIPANTS,
            p & _BITMASK_PARTICIPANTS,
            packedData & _BITMASK_BLOCK_NUM
        );
    }

    function getWParticipant(uint256 packedData) public view returns (uint256){
        return (packedData >> _BITWIDTH_BLOCK_NUM) >> _BITWIDTH_PARTICIPANTS;
    }

    function getParticipant(uint256 packedData) public view returns (uint256){
        uint256 p = packedData >> _BITWIDTH_BLOCK_NUM;
        
        return p & _BITMASK_PARTICIPANTS;
    }

    function getRingMaxParticipants() public pure
        returns (uint256)
    {
        return MAX_RING_PARTICIPANT;
    }

    function getCurrentRingIndex(uint256 amountToken) public view
        returns (uint256)
    {
        amountCheck(amountToken);
        return ringsNumber[amountToken];
    }
}