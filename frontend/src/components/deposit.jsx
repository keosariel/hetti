import React from 'react'

const Deposit = ({ Hetti }) => {
    
    console.log(Hetti.privateToPublic(33).then((res) => {
        console.log(res);
    }));
    
    return (
        <>
            <label htmlFor="default_select">Token</label>
            <div className="nes-select is-dark">
                <select required id="default_select">
                    <option value="MATIC">MATIC</option>
                    <option value="0">To be</option>
                    <option value="1">Not to be</option>
                </select>
            </div>

            <div className="default-amounts">
                <p>Amount</p>

                <div className='amounts'>
                    <a href="#" className="nes-badge">
                        <span className="is-success">1 MATIC</span>
                    </a>
                    <a href="#" className="nes-badge">
                        <span className="is-success">2 MATIC</span>
                    </a>
                    <a href="#" className="nes-badge">
                        <span className="is-success">4 MATIC</span>
                    </a>
                </div>
                <div className='amounts'>
                    <a href="#" className="nes-badge">
                        <span className="is-success">8 MATIC</span>
                    </a>
                    <a href="#" className="nes-badge">
                        <span className="is-success">16 MATIC</span>
                    </a>
                    <a href="#" className="nes-badge">
                        <span className="is-success">32 MATIC</span>
                    </a>
                </div>
            </div>
            <br/>
            <br/>
            <button type="button" class="nes-btn is-success">Deposit</button>
        </>
    )
}

export default Deposit;