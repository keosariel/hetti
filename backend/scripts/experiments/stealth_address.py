import sha3
import hashlib
from eth_account import Account
from py_ecc.secp256k1 import *

SK = 21
PK = (24049875635381557237058143631624836741422505207761609709712554171343558302165, 22669890352939653242079781319904043788036611953081321775127194249638113810828)

def private_to_public(s):
    return secp256k1.privtopub(s.to_bytes(32, "big"))

def get_stealth_address(s):
	pub_data_x, pub_data_y = private_to_public(s)
	shared_secret = secp256k1.multiply(PK, s)

	shared_secret_hex = sha3.keccak_256(
						shared_secret[0].to_bytes(32, "big")+
						shared_secret[1].to_bytes(32, "big")).hexdigest()

	secret = int(shared_secret_hex, 16)
	address = Account.from_key((secret).to_bytes(32, "big")).address
	
	return (pub_data_x, pub_data_y, address)


if __name__ == "__main__":
	alice_sk = 33
	alice_pk = private_to_public(alice_sk)

	bob_sk = 21
	bob_pk = private_to_public(bob_sk)

	shared_secret = secp256k1.multiply(bob_pk, alice_sk)
	shared_secret_b = secp256k1.multiply(alice_pk, bob_sk)

	assert shared_secret == shared_secret_b


	shared_secret_hex = sha3.keccak_256(
						shared_secret[0].to_bytes(32, "big")+
						shared_secret[1].to_bytes(32, "big")).hexdigest()
	
	secret = int(shared_secret_hex, 16)
	print("PRIVATE_KEY: ",secret, "ADDRESS: ", Account.from_key((secret).to_bytes(32, "big")).address)
