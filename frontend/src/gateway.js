import { ethers } from "ethers";
import HettiABI from "./abi/Hetti.json";

const hettiAbi = HettiABI['abi'];
const contracts = {
    "hetti": {
        "address": "0x3C31137957159b642dd1e1EdACCFD78ef54f3997",
        "abi": hettiAbi
    }
}

export default contracts;