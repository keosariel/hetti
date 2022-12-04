from brownie import HettiFactory, MockToken, accounts, Wei
from .import get_account
import json

with open("./build/deployments/map.json") as f:
    d_map = json.load(f)["80001"]

def mint_test_tokens(account):
    address = d_map["MockToken"][0]

    token = MockToken.at(address)
    token.mint(account, Wei("100 ether"), {"from": account})

def main():
    account = get_account()

    mock_token = MockToken.deploy({"from": account})

    factory_addr = d_map["HettiFactory"][0]

    HettiFactory.at(factory_addr).createPool(mock_token, {"from": account})

    # mint_test_tokens(account)
