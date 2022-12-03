import React, { useState } from 'react'

const Withdraw = () => {
    
    const [ringData, setRingData] = useState({
        token: "MATIC",
        amount: 0,
        status: "open",
        participants: 0,
        ringId: 0,
        fee: 0
    });

    return (
        <>
            <div class="nes-field">
                <label htmlFor="token_field">Token</label>
                <input type="text" id="token_field" class="nes-input is-dark" placeholder='Paste you token here.'/>
            </div>

            <div class="nes-container with-title is-dark status">
                <p class="title">Status</p>
                <div>
                    <p>Ring status: <span class="nes-text is-success">{ringData.status}</span></p>
                    <p>No of Participants: <span class="nes-text is-success">{ringData.participants}</span></p>
                    <p>Ring ID: <span class="nes-text is-success">{ringData.ringId}</span></p>
                    <p>Token: <span class="nes-text is-success">{ringData.token}</span></p>
                    <p>Amount: <span class="nes-text is-success">{ringData.amount}</span></p>
                    <p>Fee: <span class="nes-text is-success">{ringData.fee}</span></p>
                </div>
            </div>

            <br/>
            <div class="nes-field">
                <label htmlFor="token_field">Recipient Address</label>
                <input type="text" id="token_field" class="nes-input is-dark" placeholder='Paste you token here.'/>
            </div>
            <br/>
            <br/>
            <button type="button" class="nes-btn is-success">Withdraw</button>
        </>
    )
}

export default Withdraw;