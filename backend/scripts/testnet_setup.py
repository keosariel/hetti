from brownie import (
    HettiFactory, accounts, Wei,
    MockToken, MMatic, MCrv, MUsdt
)

from .import get_account
import json

mocks = [MockToken, MMatic, MCrv, MUsdt]

with open("./build/deployments/map.json") as f:
    d_map = json.load(f)["80001"]

def mint_test_tokens(account):
    address = d_map["MockToken"][0]

    token = MockToken.at(address)
    token.mint(account, Wei("100 ether"), {"from": account})

def deploy_tokens():
    account = get_account()
    factory_addr = d_map["HettiFactory"][0]

    for erc20 in mocks:
        mock_token = erc20.deploy({"from": get_account()})
        HettiFactory.at(factory_addr).createPool(mock_token, {"from": account})

def main():
    deploy_tokens()
