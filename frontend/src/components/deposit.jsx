import React, { useState, useEffect } from 'react';
import contracts from '../gateway';
import { ethers } from "ethers";
import { serialize, h1, bn128 } from '../lib/AltBn128';
import crypto from 'crypto';

const Deposit = ({ hettiFactory, setMsg, tokenRef }) => {

    const [tokens, setTokens] = useState([]);
    const [amount, setAmount] = useState(1);
    const [token, setToken] = useState(null);
    const [hettiToken, setHettiToken] = useState(null);
    const [busy, setBusy] = useState(false);

    if(hettiFactory !== null) {
        hettiFactory.allPoolsLength().then((length) => {
            length = length.toNumber();
            for(var i=0; i<length; i++) {
                hettiFactory.allPools(i).then((pool) => {
                    var pc = new ethers.Contract(
                        pool,
                        contracts.hettiPool.abi,
                        hettiFactory.signer
                    )

                    pc.token().then((token) => {
                        var tc = new ethers.Contract(
                            token,
                            contracts.ERC20.abi,
                            hettiFactory.signer
                        );

                        tc.symbol().then((symbol) => {
                            var d = {symbol: symbol, address: token, pool: pool};
                            for(var i=0; i<tokens.length; i++) {
                                if(tokens[i].address === token) {
                                    return;
                                }
                            }
                            setTokens([...tokens, d]);
                            if(tokens.length === 0) {
                                setToken(d);
                            }else{
                                setToken(tokens[0]);
                            }
                        });

                    });

                });
            }
        });
    }

    const deposit = async () => {
        if(token) {
            setMsg({});
            setBusy(true);
            var Pool = new ethers.Contract(
                token.pool,
                contracts.hettiPool.abi,
                hettiFactory.signer
            );
            
            var Token = new ethers.Contract(
                token.address,
                contracts.ERC20.abi,
                hettiFactory.signer
            );

            const amountToken = ethers.utils.parseUnits(amount.toString(), 18).toHexString();
                
            const targetAddress = '';
            const randomSecretKey = crypto.randomBytes(32).toString('hex')
            const stealthSecretKey = h1(
                serialize([randomSecretKey, targetAddress])
            )
            
            const stealthPublicKey = bn128.ecMulG(stealthSecretKey).map(x => '0x' + x.toString(16))
            
            const ringIndex = await Pool.getCurrentRingIndex(amountToken);
            const hettiToken = {
                randomSecretKey: randomSecretKey,
                amount: amountToken,
                ringIndex: ringIndex.toHexString()
            };

            try {
                let gasEstimate = Token.estimateGas.approve(token.pool, amountToken);

                await Token.approve(token.pool, amountToken, {gasLimit: gasEstimate});

                gasEstimate = await Pool.estimateGas.deposit(
                    amountToken,
                    stealthPublicKey
                )
                
                let tx = await Pool.deposit(
                    amountToken,
                    stealthPublicKey,
                    {gasLimit: gasEstimate}
                );
                
                const receipt = await tx.wait();
                if(receipt.status === 1) {
                    tokenRef.current.value = `hetti:${hettiToken.amount}:${hettiToken.ringIndex}:${token.pool}:${hettiToken.randomSecretKey}`;
                    document.getElementById("deposit-dialog").setAttribute("open", "");
                    setMsg({text: "Deposit successful", color: "lightgreen"});
                }else{
                    setMsg({text: "Deposit failed", color: "pink"});
                }
            } catch (error) {
                console.log(error.message);
                setMsg({text: "Deposit failed", color: "pink"});
            }
            setBusy(false);
        }
    }
    
    return (
        <>
            <label htmlFor="default_select">Token</label>
            <div className="nes-select is-dark">
                <select required id="default_select">
                    {tokens.map((token) => {
                        return <option key={0} value={token.pool}>{token.symbol}</option>
                    })}
                </select>
            </div>
            
            <div className="default-amounts">
                { token ? (
                    <>
                        <p>Amount</p>

                        <div className='amounts'>
                            <a href="#" className="nes-badge" onClick={() => setAmount(1)}>
                                <span className="is-success">1 {token.symbol}</span>
                            </a>
                            <a href="#" className="nes-badge" onClick={() => setAmount(2)}>
                                <span className="is-success">2 {token.symbol}</span>
                            </a>
                            <a href="#" className="nes-badge" onClick={() => setAmount(4)}>
                                <span className="is-success">4 {token.symbol}</span>
                            </a>
                        </div>
                        <div className='amounts'>
                            <a href="#" className="nes-badge" onClick={() => setAmount(8)}>
                                <span className="is-success">8 {token.symbol}</span>
                            </a>
                            <a href="#" className="nes-badge" onClick={() => setAmount(16)}>
                                <span className="is-success">16 {token.symbol}</span>
                            </a>
                            <a href="#" className="nes-badge" onClick={() => setAmount(32)}>
                                <span className="is-success">32 {token.symbol}</span>
                            </a>
                        </div>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
            
            <br/>
            <br/>
            <button type="button" className={["nes-btn is-success", busy? "is-disabled" : ""].join(" ")} onClick={deposit} >
                {
                    busy ? (
                        'Depositing...'
                    ) : (
                        amount > 0 && token != null ? `Deposit ${amount} ${token.symbol}` : `Deposit`
                    )
                }
            </button>
        </>
    )
}

export default Deposit;