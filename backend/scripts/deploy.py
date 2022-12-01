from brownie import accounts, config, Hetti, ZkWERC20
from .experiments.stealth_address import get_stealth_address

def deploy():
	account = accounts.add(config["wallets"]["from_key"])
	
	# hetti = Hetti.deploy({"from": accounts[0]})

	# data = hetti.generateStealthAddress(33)
	# _data = get_stealth_address(33)

	# assert data == _data

def main():
    deploy()