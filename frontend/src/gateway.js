import { ethers } from "ethers";
import HettiFactory from "./abi/HettiFactory.json";
import HettiPool from "./abi/HettiPool.json";
import ERC20 from "./abi/ERC20.json";


const contracts = {
    "hettiFactory": {
        "address": "0xC5D6AE486f04a54ccf60a4aA5de7a16F34acB889",
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