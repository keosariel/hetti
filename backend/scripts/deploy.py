from brownie import accounts, config, Hetti, ZkWERC20
from .experiments.stealth_address import get_stealth_address
from . import get_account

def deploy():
	account = get_account()
	
	# hetti = Hetti.deploy({"from": accounts[0]})

	# data = hetti.generateStealthAddress(33)
	# _data = get_stealth_address(33)

	# assert data == _data

def main():
    deploy()