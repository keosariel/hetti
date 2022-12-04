import React, { useState, useRef } from 'react'
import { ethers } from "ethers";
import contracts from '../gateway';
import { Scalar, Point, serialize, h1, bn128 } from '../lib/AltBn128'
import BN from 'bn.js'

const zeroHexify = (value) => {
    if (value.indexOf('0x') !== 0) {
        value = '0x' + value
    }
    return value
}

const Withdraw = ({ hettiFactory, setMsg }) => {
    
    const [ringData, setRingData] = useState(null);
    const [withdrawData, setWithdrawData] = useState(null);
    const tokenRef = useRef(null);
    const recipientRef = useRef(null);
    const [wPool, setPool] = useState(null);
    const [busy, setBusy] = useState(false);

    const getData = async () => {
        let tokenData = tokenRef.current.value;
        let tData = tokenData.split(":");

        

        if(tData.length != 5) {
            setMsg({color: "pink", text: "Invalid token data"});
            setRingData(null);
            return;
        }else{
            setMsg({});
        }

        setRingData({});

        let tAmount = tData[1];
        let rIndex = parseInt(tData[2]);
        let tPool = tData[3];

        let pool = new ethers.Contract(tPool, contracts.hettiPool.abi, hettiFactory.signer);
        setPool(pool);
        
        let tSecretKey = tData[4];
        let tokenDecimal = await pool.tokenDecimal;
        let ring = await pool.rings(tAmount, rIndex);
        let packedData = ring[1];

        let participants = await pool.getParticipant(packedData);

        var tc = new ethers.Contract(
            await pool.token(),
            contracts.ERC20.abi,
            hettiFactory.signer
        );

        let symbol = await tc.symbol();
        let status = "Closed";

        let ringHash = await pool.getRingHash(tAmount, rIndex);

        if(ringHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
            setMsg({color: "pink", text: "Ring isn't open"});
            status = "Open";
        }

        setWithdrawData({
            ringHash: ringHash,
            tokenAmount: tAmount,
            ringIndex: rIndex,
            secret: tSecretKey,
        })

        let rData = {
            token: symbol,
            amount: ethers.utils.formatUnits(tAmount, tokenDecimal),
            status: status,
            participants: parseInt(participants._hex),
            ringId: rIndex
        }

        setRingData(rData);
        setMsg({});
    };  

    const withdraw = async () => {
        setMsg({});
        setBusy(true);

        let recipient = recipientRef.current.value;

        if(!recipient) {
            setMsg({color: "pink", text: "Recipient address is required"});
            return;
        }

        if(withdrawData === null || wPool === null) {
            setMsg({color: "pink", text: "Invalid token data"});
            return;
        }

        const publicKeys = await wPool.getPublicKeys(
            withdrawData.tokenAmount, withdrawData.ringIndex
        );  

        const bnZero = new BN('0', 10);

        const publicKeysBN = publicKeys.map(x => {
              return [
                new BN(Buffer.from(x[0].slice(2), 'hex')),
                new BN(Buffer.from(x[1].slice(2), 'hex'))
              ]
        }).filter(x => x[0].cmp(bnZero) !== 0 && x[1].cmp(bnZero) !== 0)

        const stealthSecretKey = h1(
            serialize([withdrawData.secret, ''])
        )
        
        const stealthPublicKey = bn128.ecMulG(stealthSecretKey);
        console.log("0x" + stealthPublicKey[0].toString(16));
        console.log(publicKeys);

        let secretIdx = 0
        let canSign = false

        for (let i = 0; i < publicKeysBN.length; i++) {
            const curPubKey = publicKeysBN[i]

            if (curPubKey[0].cmp(stealthPublicKey[0]) === 0 && curPubKey[1].cmp(stealthPublicKey[1]) === 0) {
              secretIdx = i
              canSign = true
              break
            }
        }
        
        if(!canSign) {
            setMsg({color: "pink", text: "Invalid secret key"});
            return;
        }

        const message = Buffer.concat([
            Buffer.from(
                withdrawData.ringHash.slice(2), // Remove the '0x'
                'hex'
            ),
            Buffer.from(
                recipient.slice(2), // Remove the '0x'
                'hex'
            )
        ]);

        const signature = bn128.ringSign(
            message,
            publicKeysBN,
            stealthSecretKey,
            secretIdx
        )

        const c0 = zeroHexify(signature[0].toString(16))
        const s = signature[1].map(x => zeroHexify(x.toString(16)))
        const keyImage = [
            zeroHexify(signature[2][0].toString(16)),
            zeroHexify(signature[2][1].toString(16))
        ]

        try{
            let gasEstimate = await wPool.estimateGas.withdraw(
                recipient,
                withdrawData.tokenAmount,
                zeroHexify(withdrawData.ringIndex.toString(16)),
                c0,
                keyImage,
                s,
            );

            let tx = await wPool.withdraw(
                recipient,
                withdrawData.tokenAmount,
                zeroHexify(withdrawData.ringIndex.toString(16)),
                c0,
                keyImage,
                s,
                {gasLimit: gasEstimate}
            );

            const receipt = await tx.wait();
            if(receipt.status === 1) {
                setMsg({text: "Withdrawal successful", color: "lightgreen"});
            }else{
                setMsg({text: "Withdrawal failed", color: "pink"});
            }
        } catch (error) {
            console.log(error.message);
            setMsg({text: "Deposit failed", color: "pink"});
        }
        setBusy(false);
    }

    return (
        <>
            <div class="nes-field">
                <label htmlFor="token_field">Token</label>
                <input type="text" id="token_field" ref={tokenRef} class="nes-input is-dark" onChange={getData} placeholder='Paste you token here.'/>
            </div>
            
            <div class="nes-container with-title is-dark status">
                <p class="title">Status</p>
                {
                    ringData != null ? (
                        ringData.status ? (
                            <div>
                                <p>Ring status: <span class="nes-text is-success">{ringData.status}</span></p>
                                <p>No of Participants: <span class="nes-text is-success">{ringData.participants}</span></p>
                                <p>Ring ID: <span class="nes-text is-success">{ringData.ringId}</span></p>
                                <p>Amount: <span class="nes-text is-success">{ringData.amount} {ringData.token}</span></p>
                            </div>
                        ) : (
                            <p class="nes-text">Loading...</p>
                        )
                    ) : (
                        <p>input a valid token</p>
                    )
                }
            </div>

            <br/>
            <div class="nes-field">
                <label htmlFor="token_field">Recipient Address</label>
                <input type="text" id="token_field" ref={recipientRef} class="nes-input is-dark" placeholder='Who would recieve the funds?'/>
            </div>
            <br/>
            <br/>
            <button type="button" onClick={withdraw} className={["nes-btn is-success", withdrawData === null || busy? "is-disabled" : "" ].join(" ")}>
                {
                    busy ? (
                        'Withdrawing...'
                    ) : (
                        'Withdraw'
                    )
                }
                
            </button>
        </>
    )
}

export default Withdraw;