from brownie import accounts, config

def get_account():
    account = accounts.add(config["wallets"]["from_key"])
    return account