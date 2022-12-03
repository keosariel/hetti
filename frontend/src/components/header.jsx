import React, { useState } from 'react';
import { ethers } from "ethers";
import contracts from '../gateway';

const Header = ({ setHetti }) => {
    
    const maticTestnetChainId = 80001;
    const [msg, setMsg] = useState({
        text: "Connect Wallet",
        color: "bisque"
    });

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
                
                if (chainId != maticTestnetChainId) {
                    setMsg({
                        text: "Please connect to Matic Testnet",
                        color: "pink"
                    });
                    return;
                }
                setHetti(new ethers.Contract(contracts.hetti.address, contracts.hetti.abi, signer));

                setMsg({text: "", color: "bisque"});
            } catch (error) {
                console.log(error);
                setMsg({text: "Error connecting wallet", color: "pink"});
            }
        } else {
            setMsg({text: "Please install Metamask", color: "pink"});
            console.log("Install Metamask");
        }
    }

    // connectWallet();
    
    return (
        <>
            <div className="header">
                <div className='header-content'>
                    <div>
                        <h2>Hetti</h2>
                        <p style={{maxWidth:'370px', fontSize: '14px'}}>A polygon Mixer and leding protocol</p>
                    </div>
                    <div>
                        {/* <a href="https://github.com/keosariel" target="_blank">
                            <i class="nes-icon github is-large" style={{"box-shadow": "0 0.1em #fff, 0 -0.1em #fff, 0.1em 0 #fff, -0.1em 0 #fff"}}></i>
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
                    <p style={{fontSize: '11px', textAlign: "center", padding: "4px 0"}}>{msg.text}</p>
                </div>
            }
            
        </>
    )
}

export default Header;