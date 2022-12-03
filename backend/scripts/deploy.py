from brownie import accounts, config, Hetti, AltBn128, LSAG, Wei, history, convert
from . import get_account
from .utils.ringsignatures import *

def main():
	account = get_account()
	print(account)
	# Deploy libraries
	AltBn128.deploy({"from": account})
	LSAG.deploy({"from": account})

	# Deploy Hetti
	hetti = Hetti.deploy({"from": account})
		