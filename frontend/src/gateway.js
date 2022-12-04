import { ethers } from "ethers";
import HettiFactory from "./abi/HettiFactory.json";
import HettiPool from "./abi/HettiPool.json";
import ERC20 from "./abi/ERC20.json";


const contracts = {
    "hettiFactory": {
        "address": "0x9117Ac25290b70f86365F43CB20D2ffc10e7Ee95",
        "abi": HettiFactory['abi']
    },
    "hettiPool": {
        "abi": HettiPool['abi']
    },
    "ERC20": {
        "abi": ERC20['abi']
    }
}

export default contracts;