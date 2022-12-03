import React, { useState } from 'react'
import Deposit from '../../components/deposit';
import Withdraw from '../../components/withdraw';
import Header from '../../components/header';

const Action = () => {
    
    const [tab, setTab] = useState(0);
    const [hetti, setHetti] = useState(null);

    return (
        <>
            <Header setHetti={ setHetti }/>
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
                    {tab === 0 ? <Deposit Hetti={ hetti } /> : <Withdraw Hetti={ hetti } />}
                </div>
            </div>
        </>
    )
}

export default Action;