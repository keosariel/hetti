from brownie import (
	AltBn128, 
    LSAG, HettiFactory, HettiPool
)
from . import get_account
from .utils.ringsignatures import *

def main():
	account = get_account()
	print(account)
	# Deploy libraries
	AltBn128.deploy({"from": account})
	LSAG.deploy({"from": account})
	HettiPool.deploy({"from": account})

	# Deploy Factory
	HettiFactory.deploy(account, {"from": account})
	