from brownie import HettiFactory, MockToken, accounts
from .import get_account
import json

with open("./build/deployments/map.json") as f:
    d_map = json.load(f)["80001"]

def main():
    account = get_account()
    mock_token = MockToken.deploy({"from": account})

    factory_addr = d_map["HettiFactory"][-1]

    HettiFactory.at(factory_addr).createPool(mock_token, {"from": account})