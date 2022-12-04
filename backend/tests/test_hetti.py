from brownie import (
    accounts, AltBn128, 
    LSAG, HettiFactory, HettiPool, MockToken, Wei, convert
)
from scripts.utils.ringsignatures import (
    random_private_key, ecMul, 
    G, sign, verify
)

def pre_deploy():
    def wrapper(func):
        def inner(*args, **kwargs):
            account = accounts[0]
            # Deploy libraries
            AltBn128.deploy({"from": account})
            LSAG.deploy({"from": account})

            # Deploy Hetti
            kwargs["hetti_factory"] = HettiFactory.deploy(account, {"from": account})
            kwargs["mock_token"] = MockToken.deploy({"from": account})
            kwargs["account"] = account

            return func(*args, **kwargs)
        return inner
    return wrapper


# @pre_deploy()
# def test_factory(account, hetti_factory, mock_token, **kwargs):
#     # Create Hetti Pool
#     tx = hetti_factory.createPool(mock_token, {"from": account})
#     tx.wait(1)

#     # Get Hetti Pool address
#     pool_address = tx.events["PoolCreated"]["poolAddress"]

#     assert pool_address != "0x0000000000000000000000000000000000000000"
#     assert hetti_factory.allPools(0) == pool_address
#     assert hetti_factory.pools(mock_token) == pool_address
    

# @pre_deploy()
# def test_deposit(account, hetti_factory, mock_token, **kwargs):
#     # Create Hetti Pool
#     tx = hetti_factory.createPool(mock_token, {"from": account})
#     tx.wait(1)

#     # Get Hetti Pool address
#     pool_address = tx.events["PoolCreated"]["poolAddress"]

#     # Get Hetti Pool
#     pool = HettiPool.at(pool_address)

#     amount = Wei("2 ether")

#     # Approve Hetti Pool
#     mock_token.approve(pool_address, amount, {"from": account})

#     sk = random_private_key()
#     pk = ecMul(G, sk)

#     # Deposit tokens
#     tk = pool.deposit(amount, pk, {"from": account})
#     tk.wait(1)

#     pool_balance = pool.getPoolBalance({"from": account})

#     assert pool_balance == amount


@pre_deploy()
def test_withdraw(account, hetti_factory, mock_token, **kwargs):
    # Create Hetti Pool
    tx = hetti_factory.createPool(mock_token, {"from": account})
    tx.wait(1)

    recipient = accounts[7]
    r_balance = mock_token.balanceOf(recipient)

    # Get Hetti Pool address
    pool_address = tx.events["PoolCreated"]["poolAddress"]

    # Get Hetti Pool
    pool = HettiPool.at(pool_address)

    num_participants = 5
    secret_keys = [random_private_key() for i in range(num_participants)]
    public_keys = [ecMul(G, s) for s in secret_keys]

    amount = Wei("4 ether")

    current_index = pool.getCurrentRingIndex(amount)
    assert current_index == 0

    for ac, pk in zip(accounts[:5], public_keys):

        # Mint mock token
        mock_token.mint(ac, amount, {"from": account})

        # Approve Hetti Pool
        mock_token.approve(pool_address, amount, {"from": ac})

        tx = pool.deposit(amount, pk, {"from": ac})
        tx.wait(1)

    _, packed_data, *_ = pool.rings(amount, current_index)
    wP, p, _ = pool.getRingPackedData(packed_data)

    assert wP == 0
    assert p == num_participants
    
    ring_hash = pool.getRingHash(amount, 0, {"from": account})
    message = convert.to_bytes(ring_hash) 

    sign_idx = 0
    signature = sign(message, public_keys, secret_keys[sign_idx], sign_idx)
    assert verify(message, public_keys, signature)

    c0, s, key_image = signature
    ring_index = 0

    tx = pool.withdraw(recipient, amount, ring_index, 
                        c0, key_image, s, {"from": account})
    
    tx.wait(1)

    new_r_balance = mock_token.balanceOf(recipient)

    # Confirm that the recipient received the tokens
    assert new_r_balance == r_balance + amount

    _, packed_data, *_ = pool.rings(amount, current_index)
    wP, p, _ = pool.getRingPackedData(packed_data)

    # Confirm the withdrawal increased the wP
    assert wP == 1
    assert p == num_participants
