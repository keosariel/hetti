from brownie import accounts, Hetti
from .experiments.stealth_address import get_stealth_address

def deploy():
	hetti = Hetti.deploy({"from": accounts[0]})

	data = hetti.generateStealthAddress(33)
	_data = get_stealth_address(33)

	assert data == _data

def main():
    deploy()