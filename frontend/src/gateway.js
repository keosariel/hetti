import { ethers } from "ethers";
import HettiFactory from "./abi/HettiFactory.json";
import HettiPool from "./abi/HettiPool.json";
import ERC20 from "./abi/ERC20.json";


const contracts = {
    "hettiFactory": {
        "address": "0xa1b4f0788D8a7670f619D0Ff40F66D04CA8e20b6",
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