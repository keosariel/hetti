from brownie import (
    accounts, Hetti, AltBn128, 
    LSAG, Wei, convert
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
            hetti = Hetti.deploy({"from": account})

            kwargs["hetti"] = hetti
            return func(*args, **kwargs)
        return inner
    return wrapper

@pre_deploy()
def test_deposit(hetti):
    account = accounts[0]

    # Generate keys
    num_participants = 3
    secret_keys = [random_private_key() for i in range(num_participants)]
    public_keys = [ecMul(G, s) for s in secret_keys]

    # Deposit
    for ac, pk in zip(accounts[:3], public_keys):
        tx = hetti.deposit(pk, {"from": ac, "value": "2 ether"})
        tx.wait(1)
    
    ring = hetti.rings(Wei("2 ether"),0, {"from": account})
    
    # confirm number of participants
    assert ring[3] == 3

    # confirm amount
    assert ring[1] == Wei("2 ether") * 3

@pre_deploy()
def test_withdraw(hetti):
    account = accounts[0]

    reciever = accounts[4]
    r_balance = reciever.balance()

    # Generate keys
    num_participants = 3
    secret_keys = [random_private_key() for i in range(num_participants)]
    public_keys = [ecMul(G, s) for s in secret_keys]

    # Deposit
    for ac, pk in zip(accounts[:3], public_keys):
        tx = hetti.deposit(pk, {"from": ac, "value": "2 ether"})
        tx.wait(1)
    
    ring_hash = hetti.getRingHash(2, 0, {"from": account})
    message = convert.to_bytes(ring_hash)

    sign_idx = 0
    signature = sign(message, public_keys, secret_keys[sign_idx], sign_idx)
    assert verify(message, public_keys, signature)

    c0, s, key_image = signature
    amount = 2
    ring_index = 0

    tx = hetti.withdraw(
        reciever.address, amount,
        ring_index, c0, key_image, s, {"from": account})
    
    tx.wait(1)

    new_r_balance = reciever.balance()

    assert new_r_balance == r_balance + Wei("2 ether")
        




