import React, { useState, useRef } from 'react'
import Deposit from '../../components/deposit';
import Withdraw from '../../components/withdraw';
import Header from '../../components/header';
import Footer from '../../components/footer';

const Home = () => {
    
    const [tab, setTab] = useState(0);
    const [hettiFactory, setHettiFactory] = useState(null);

    const [msg, setMsg] = useState({
        text: "Connect Wallet",
        color: "bisque"
    });

    const tokenRef = useRef();

    return (
        <>  
            <dialog className="nes-dialog is-dark is-rounded" id="deposit-dialog">
                <form method="dialog">
                    <p class="title">Transaction completed!</p>
                    <p>This token would be used to withdraw you asset.</p>
                    <p>If you lose this token your asset cannot be recovered.</p>

                    <div style={{backgroundColor:"#212529", marginTop: "30px"}} className="nes-field">
                        <input type="text" id="dark_field" ref={tokenRef} className="nes-input is-dark" readonly='readonly'/>
                    </div>
                    <menu class="dialog-menu" style={{padding: "0px"}}>
                        <button class="nes-btn is-success" style={{marginTop: "25px"}}>I have kept the token</button>
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
                    {tab === 0 ? <Deposit hettiFactory={ hettiFactory } setMsg={ setMsg } tokenRef={tokenRef}/> :
                                 <Withdraw hettiFactory={ hettiFactory } setMsg={ setMsg }/>}
                </div>
            </div>
            <button type="button" class="nes-btn github-btn active">
                <i class="nes-icon github"></i>
            </button>

            <Footer />
        </>
    )
}

export default Home;