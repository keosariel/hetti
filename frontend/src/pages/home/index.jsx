import React, { useState, useRef } from 'react'
import Deposit from '../../components/deposit';
import Withdraw from '../../components/withdraw';
import Header from '../../components/header';
import Footer from '../../components/footer';
import contracts from '../../gateway';
import { ethers } from "ethers";

const Home = () => {
    
    const [tab, setTab] = useState(0);
    const [hettiFactory, setHettiFactory] = useState(null);

    const [mintToken, setMintToken] = useState(null);
    const [busy, setBusy] = useState(false);

    const [msg, setMsg] = useState({
        text: "Connect Wallet",
        color: "bisque"
    });

    const tokenRef = useRef();

    const mint = async () => {
        if(hettiFactory !== null) {
            setBusy(true);
            try {
                const Token = new ethers.Contract(
                    mintToken.address,
                    contracts.MockToken.abi,
                    hettiFactory.signer
                );
                
                const amount = 10;
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                
                if(account !== undefined) {
                    const gasEstimate = await Token.estimateGas.mint(account, amount);
                    let tx = await Token.mint(
                        account, 
                        ethers.utils.parseUnits(amount.toString(), 18).toHexString(),
                        { gasLimit: (parseInt(gasEstimate) + 1000).toString() }
                    );
                    
                    let receipt = await tx.wait();
                    if(receipt.status === 1) {
                        setMsg({
                            text: `Tokens Minted to ${account}`,
                            color: "lightgreen"
                        });
                    }else{
                        setMsg({
                            text: "Error Minting Token",
                            color: "pink"
                        });
                    }
                    
                }else{
                    setMsg({
                        text: "Connect Wallet",
                        color: "bisque"
                    });
                }
            } catch (error) {
                setMsg({
                    text: "Error Minting Token",
                    color: "pink"
                });
            }
            setBusy(false);
        }

    };

    return (
        <>  
            <dialog className="nes-dialog is-dark is-rounded" id="deposit-dialog">
                <form method="dialog">
                    <p className="title">Transaction completed!</p>
                    <p>This token would be used to withdraw you asset.</p>
                    <p>If you lose this token your asset cannot be recovered.</p>

                    <div style={{backgroundColor:"#212529", marginTop: "30px"}} className="nes-field">
                        <input type="text" id="dark_field" ref={tokenRef} className="nes-input is-dark" readonly='readonly'/>
                    </div>
                    <menu className="dialog-menu" style={{padding: "0px"}}>
                        <button className="nes-btn is-success" style={{marginTop: "25px"}}>I have kept the token</button>
                    </menu>
                </form>
            </dialog>
            <div id="overlay"></div>

            <Header setHettiFactory={ setHettiFactory } setMsg={ setMsg } msg={ msg } />
            <div className="body-content swap">
                <div>
                    <button className={["nes-btn", (tab === 0? "current": "")].join(" ")} onClick={() => {setTab(0)}}>
                        Deposit
                    </button>
                    <button className={["nes-btn", (tab === 1? "current": "")].join(" ")} onClick={() => {setTab(1)}}>
                        Withdraw
                    </button>
                </div>
                <div className="nes-container is-rounded is-dark">
                    {tab === 0 ? <Deposit hettiFactory={ hettiFactory } setMsg={ setMsg } setMintToken={setMintToken} tokenRef={tokenRef}/> :
                                 <Withdraw hettiFactory={ hettiFactory } setMsg={ setMsg }/>}
                </div>
            </div>
            <div style={{margin: "40px 0"}}>
                    {
                    mintToken !== null ? (
                        <button 
                            style={{ width: "300px", margin: "10px auto", display: "block" }}
                            type="button" className={["nes-btn is-success", busy? "is-disabled" : ""].join(" ")} onClick={mint} >
                                {busy ? (
                                    'Minting...'
                                ) : (
                                    `Mint ${mintToken.symbol} Tokens`
                                )}
                        </button>
                    ) : (
                        <></>
                    )}
            </div>
            <button type="button" className="nes-btn github-btn active">
                <i className="nes-icon github"></i>
            </button>

            <Footer />
        </>
    )
}

export default Home;