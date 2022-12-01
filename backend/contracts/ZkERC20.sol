// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./EllipticCurve.sol";
import "./Pederson.sol";



contract ZkWERC20 {

    // Events
    event  Approval(address indexed src, address indexed guy, bytes commitment);
    event  Transfer(address indexed src, address indexed dst, bytes commitment);
    event  Deposit(address indexed dst, uint wad);
    event  Withdrawal(address indexed src, uint wad);

    // The ERC20 token that is being wrapped
    address public erc20Address; 

    string public name;
    string public symbol;
    uint8 public decimals;

    mapping (address => bytes) public balanceOf;
    mapping (address => mapping (address => bytes))  public  allowance; 
    

    constructor(address _erc20Address) {
        erc20Address = _erc20Address;

        // TODO: add zk to name and symbol
        name = ERC20(_erc20Address).name();
        symbol = ERC20(_erc20Address).symbol();
        decimals = ERC20(_erc20Address).decimals();
    } 

    // @notice Deposit ERC20 token to the contract, and hash 
    //         the amount as a commitment for the new balance
    // @param _amount The amount of ERC20 token to deposit
    function deposit(uint256 _amount) public {
        ERC20(erc20Address).transferFrom(msg.sender, address(this), _amount);

        (uint c, uint r) = Perdeson.commit(_amount, 0);
        balanceOf[msg.sender] = abi.encode(c,r);

        emit Deposit(msg.sender, _amount);
    }

    // @notice Transfer ZKWERC20 token to another address, and hash
    //         the amount as a commitment for the new balance
    // @param _dst The address to transfer to
    // @param c1 the commitment of the amount to transfer
    // @param c2 the commitment of the new balance
    function transfer(address _dst, bytes calldata c1, bytes calldata c2) public {
        (uint c, uint r) = abi.decode(data, (uint, uint));
        bool verified = Perdeson.verifyZero([c, c1, c2]);

        // Confirm that the commitment is correct
        require(verified, "INVALID_COMMITMENT");

        // Update the sender balance
        balanceOf[msg.sender] = c2;
        
        // Update the receiver balance
        if(balanceOf[_dst] == bytes(0)) {
            balanceOf[_dst] = c1;
        }else{
            (uint d_pc, uint d_pr) = abi.decode(balanceOf[_dst], (uint, uint));
            (uint d_ac, uint d_ar) = abi.decode(c1, (uint, uint));

            balanceOf[_dst] = abi.encode(d_pc + d_ac, d_pr + d_ar);
        }
        

        emit Transfer(msg.sender, _dst, c1);
    }


    // Secp256k1 Elliptic Curve
    uint256 public constant GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint256 public constant GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    uint256 public constant AA = 0;
    uint256 public constant BB = 7;
    uint256 public constant PP = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

    uint256 public PublicKeyX = 24049875635381557237058143631624836741422505207761609709712554171343558302165;
    uint256 public PublicKeyY = 22669890352939653242079781319904043788036611953081321775127194249638113810828;

    
    // @notice Generates a stealth address from a `secret`
    // @param _secret The secret to generate the stealth address from
    // @return pubDataX The X coordinate of the public key
    // @return pubDataY The Y coordinate of the public key
    // @return stealthAddress The stealth address
    function generateStealthAddress(uint256 secret) public view returns (uint256, uint256, address){
        //  s*G = S
        (uint256 pubDataX,uint256 pubDataY) = EllipticCurve.ecMul(secret, GX, GY, AA, PP);
        //  s*P = q
        (uint256 Qx,uint256 Qy) = EllipticCurve.ecMul(secret, PublicKeyX, PublicKeyY, AA, PP);
        // hash(sharedSecret)
        bytes32 hQ = keccak256(abi.encodePacked(Qx, Qy));
        // hash value to public key
        (Qx, Qy) = EllipticCurve.ecMul(uint(hQ), GX, GY, AA, PP);
        // generate stealth address
        address stealthAddress = address(uint160(uint256(keccak256(abi.encodePacked(Qx, Qy)))));
        // return public key coordinates and stealthAddress
        return (pubDataX, pubDataY, stealthAddress);
    }
}