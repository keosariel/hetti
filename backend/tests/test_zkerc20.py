from scripts import get_account
from brownie import MockToken, ZkWERC20, Pederson, accounts, history, config
import random

G = 0x3ab23329af

def deploy_and_fund_me(account):
    """Deploy a ZkWERC20 contract and fund the sender with 1000 tokens"""
    def wrapper(func):
        def inner(*args, **kwargs):
            mock_token = MockToken.deploy({"from": account})
            Pederson.deploy({"from": account})
            kwargs["mock_token"] = mock_token
            kwargs["account"] = account
            kwargs["account_2"] = accounts[1]
            try:
                func(*args, **kwargs)
            finally:
                # For debugging purposes
                # print(history[-1].call_trace(True))
                pass

        return inner
    return wrapper

def tok_to_wei(amount):
    return amount * 10 ** 18

def rand():
    return random.randint(1, G - 1)

@deploy_and_fund_me(get_account())
def test_zkerc20_deposit(account, mock_token, **kwargs):
    assert mock_token.balanceOf(account.address) > tok_to_wei(100)

    initial_balance = mock_token.balanceOf(account.address)

    # Wrappper ERC20 mock token
    zkerc20 = ZkWERC20.deploy(mock_token.address, {"from": account})
    amount = tok_to_wei(10)

    # Approve the zkERC20 contract to spend the tokens
    mock_token.approve(zkerc20, amount, {"from": account})
    
    zkerc20.deposit(amount, {"from": account})

    b = mock_token.balanceOf(account.address)
    zk_erc_b = mock_token.balanceOf(zkerc20.address)

    zk_b = zkerc20.balanceOf(account.address)
    c, r = zkerc20.decodeCommitment(zk_b)

    # Making sure the token was transfered
    assert b == initial_balance - amount
    assert zk_erc_b == amount

    # Confirm that the commitment is correct by
    # making sure a commitment of `amount` and the
    # current balance of the zkERC20 contract `zk_b` if
    # subtracted it'd equal a commitment of `0` 
    c_a, r_a = zkerc20.C(amount, random.randint(1, G - 1))
    c_v, _   = zkerc20.C(0, r - r_a)

    assert c_v == c - c_a


@deploy_and_fund_me(get_account())
def test_zkerc20_transfer(account, mock_token, account_2):
    assert mock_token.balanceOf(account.address) > tok_to_wei(100)

    initial_balance = mock_token.balanceOf(account.address)

    # Wrappper ERC20 mock token
    zkerc20 = ZkWERC20.deploy(mock_token.address, {"from": account})
    amount = tok_to_wei(10)

    # Approve the zkERC20 contract to spend the tokens
    mock_token.approve(zkerc20, amount, {"from": account})

    zkerc20.deposit(amount, {"from": account})

    sender_b = zkerc20.balanceOf(account.address)
    sender_b_c, sender_b_r = zkerc20.decodeCommitment(sender_b)
    
    # Transfer 5 tokens from account to account_2
    c_5tokens, r_5tokens = zkerc20.C(tok_to_wei(5), rand())
    bc_5tokens = zkerc20.encodeCommitment(c_5tokens, r_5tokens)

    end_sender_b_c, end_sender_b_r = zkerc20.C(tok_to_wei(5), rand())
    end_as_bytes = zkerc20.encodeCommitment(end_sender_b_c, end_sender_b_r)

    zkerc20.transfer(account_2.address, bc_5tokens, end_as_bytes, {"from": account})
    


    


    

