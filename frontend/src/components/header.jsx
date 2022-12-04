import React, { useState } from 'react';
import { ethers } from "ethers";
import contracts from '../gateway';

const Header = ({ setHettiFactory, setMsg, msg }) => {
    
    const maticTestnetChainId = 80001;
    
    const [user, setUser] = useState({
        address: "",
        balance: 0
    });

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
                const signer = provider.getSigner();
                const balance = await provider.getBalance(account); 
                const { chainId } = await provider.getNetwork();

                setUser({
                    address: account,
                    balance: ethers.utils.formatEther(balance)
                });
                
                if (chainId !== maticTestnetChainId) {
                    setMsg({
                        text: "Please connect to Matic Testnet",
                        color: "pink"
                    });
                    return;
                }
                setHettiFactory(new ethers.Contract(contracts.hettiFactory.address, contracts.hettiFactory.abi, signer));

                setMsg({text: "", color: "bisque"});
            } catch (error) {
                console.log(error);
                setMsg({text: "Error connecting wallet", color: "pink"});
            }
        } else {
            setMsg({text: "Please install Metamask", color: "pink"});
        }
    }

    if(user.address === "") {
        connectWallet();
    }
    
    return (
        <>
            <div className="header">
                <div className='header-content'>
                    <div>
                        <h2>Hetti</h2>
                        <p style={{maxWidth:'370px', fontSize: '14px'}}>ERC20 Mixer and Flash Loan protocol</p>
                    </div>
                    <div>
                        {/* <a href="https://github.com/keosariel" target="_blank">
                            <i className="nes-icon github is-large" style={{"box-shadow": "0 0.1em #fff, 0 -0.1em #fff, 0.1em 0 #fff, -0.1em 0 #fff"}}></i>
                        </a> */}
                        {user.address === "" ?
                            <button type="button" className="nes-btn is-success" onClick={connectWallet}>
                                Connect
                            </button>
                            :
                            <button type="button" className="nes-btn is-success" onClick={connectWallet}>
                                {user.address.slice(0, 6) + "..." + user.address.slice(-4)}
                            </button>
                        }
                        
                    </div>
                </div>
            </div>
            {msg.text === "" ? null : 
                <div className="header-msg" style={{background: msg.color}}>
                    <p style={{fontSize: '13px', textAlign: "center", padding: "8px 0"}}>{msg.text}</p>
                </div>
            }
            
        </>
    )
}

export default Header;