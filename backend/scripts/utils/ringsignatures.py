"""
Provide an implementation of Linkable Spontaneus Anonymous Group Signature
over elliptic curve cryptography.
Original paper: https://eprint.iacr.org/2004/027.pdf

alt_bn_128 implementation with help from:
    https://github.com/ethereum/py_ecc/blob/master/py_ecc/bn128/bn128_curve.py
    https://github.com/HarryR/solcrypto/blob/master/pysolcrypto/altbn128.py
 """

import math
import web3
import hashlib
import functools
import ecdsa

from random import randint
from web3 import Web3

from typing import Tuple, List, Union

from py_ecc import bn128
from py_ecc.bn128 import FQ, add, multiply, double

# Signature :: (Initial construction value, array of public keys, link of unique signer)
Point = Tuple[int, int]
Signature = Tuple[int, List[int], Point]
Scalar = int

asint = lambda x: x.n if isinstance(x, bn128.FQ) else x
fq2point = lambda x: (asint(x[0]), asint(x[1]))
randsn = lambda: randint(1, N - 1)
randsp = lambda: randint(1, P - 1)
sbmul = lambda s: bn128.multiply(G, asint(s))
addmodn = lambda x, y: (x + y) % N
addmodp = lambda x, y: (x + y) % P
mulmodn = lambda x, y: (x * y) % N
mulmodp = lambda x, y: (x * y) % P
submodn = lambda x, y: (x - y) % N
submodp = lambda x, y: (x - y) % P
negp = lambda x: (x[0], -x[1])



def to_hex(x):
    if type(x) is tuple:
        return (to_hex(x[0]), to_hex(x[1]))
    if type(x) is int:
        return (x).to_bytes(32, 'big').hex()


def powmod(a, b, n):
    c = 0
    f = 1
    k = int(math.log(b, 2))
    while k >= 0:
        c *= 2
        f = (f*f)%n

        if (b & (1 << k)) > 0:
            c += 1
            f = (f*a) % n
            
        k -= 1
    return f


G: Point = fq2point(bn128.G1)
N: int = bn128.curve_order
P: int = bn128.field_modulus
A: int = 0xc19139cb84c680a6e14116da060561765e05aa45a1c72a34f082305b61f3f52
MASK: int = 0x8000000000000000000000000000000000000000000000000000000000000000


def random_private_key() -> int:
    sk = randsp()

    # Make sure
    # decompress_point(compress_point(p)) == p
    # otherwise regenerate key ....
    pk = ecMul(G, sk)

    if not decompress_point(compress_point(pk)) == pk:
        return random_private_key()
    
    return sk


def private_to_public(k: int) -> Tuple[int, int]:
    return ecMul(G, k)


def compress_point(p: Point) -> int:
    """
    Compresses a point
    """
    x = p[0]

    if (p[1] & 0x1 == 0x1):
        x = x | MASK

    return x


def decompress_point(_x: int) -> Point:
    """
    Reconstructs a pint
    """
    x = _x & (~MASK)
    _, y = eval_curve(x)

    if (x & MASK != 0):
        if (y & 0x1 != 0x1):
            y = P - y
    else:
        if (y & 0x1 == 0x1):
            y = P - y

    return (x, y)


def serialize(*args) -> bytes:
    """
    Helper function
    Serializes all supplied arguments into bytes
    """
    b = b""

    for i in range(len(args)):
        if type(args[i]) is int:
            b += args[i].to_bytes(32, 'big')
        elif type(args[i]) is FQ:
            b += asint(args[i]).to_bytes(32, 'big')
        elif type(args[i]) is str:
            b += args[i].encode('utf-8')
        elif type(args[i]) is bytes:
            b += args[i]
        elif type(args[i]) is list or type(args[i]) is tuple:
            b += serialize(*args[i])

    return b


def on_curve(x, y) -> bool:
    """
    Does the point (x, y) exists on the curve alt_bn_128?
    """
    beta = addmodp(mulmodp(mulmodp(x, x), x), 3)
    return beta == mulmodp(y, y)


def eval_curve(x: int) -> int:
    """
    Helper function

    returns y given x for on alt_bn_128
    """
    beta = addmodp(mulmodp(mulmodp(x, x), x), 3)
    y = powmod(beta, A, P)
    return beta, y


def int_to_point(x: int) -> Point:
    """
    Helper function

    Converts an int to point
    """
    x = x % N

    while True:
        beta, y = eval_curve(x)
        if beta == mulmodp(y, y):
            return x, y
        x = addmodn(x, 1)


def H1(b: Union[bytes, str]) -> int:
    """
    Let H1: {0, 1}* -> Z_q (Section 4)

    Returns an integer representation of the hash of the input
    """
    if type(b) is not bytes:
        b = b.encode('utf-8')

    b = "0x" + b.hex()

    return int(
        Web3.soliditySha3(["bytes"], [b]).hex(),
        16
    ) % N


def H2(b: Union[bytes, str]) -> Point:
    """
    Let H2: {0, 1}* -> G

    Returns elliptic curve point of the integer representation
    of the hash of the input
    """
    if type(b) is not bytes:
        b = b.encode('utf-8')
    return int_to_point(H1(b))


def ecMul(p: Point, x: int) -> Point:
    pt = FQ(p[0]), FQ(p[1])
    return fq2point(multiply(pt, x))


def ecAdd(p1: Point, p2: Point) -> Point:
    p1 = FQ(p1[0]), FQ(p1[1])
    p2 = FQ(p2[0]), FQ(p2[1])
    return fq2point(add(p1, p2))


def sign(
    message: Union[bytes, str],
    public_keys: List[Point],
    secret_key: Scalar,
    secret_key_idx: int
) -> Signature:
    """
    Generates ring signature for a message given a specific set of public keys
    and a secret key which corresponds to the public key at `secret_key_idx`
    """
    key_count = len(public_keys)

    c = [0] * key_count
    s = [0] * key_count

    # Step 1 (Section 4.2)
    # L :: public_keys
    # x_pi :: The secret key
    # h = H2(L)
    # y_tilde = h^x_pi
    h = H2(serialize(public_keys))
    y_tilde = ecMul(h, secret_key) # Also known as the key image

    # Step 2
    # Randomly generate scalar u
    # and compure c[signing_key_idx + 1] = H1(L, y_tilde, m, g**u, h**u)
    u = randsp()
    c[secret_key_idx + 1 % key_count] = H1(
        serialize(public_keys, y_tilde, message, ecMul(G, u), ecMul(h, u))
    )

    # Step 3
    for i in list(range(secret_key_idx + 1, key_count)) + list(range(secret_key_idx)):
        s[i] = randsp()

        # g**s_i * y_i**c_i
        z_1 = ecAdd(ecMul(G, s[i]), ecMul(public_keys[i], c[i]))

        # h**s_i * y_tilde**c_i
        z_2 = ecAdd(ecMul(h, s[i]), ecMul(y_tilde, c[i]))

        c[(i + 1) % key_count] = H1(
            serialize(public_keys, y_tilde, message, z_1, z_2)
        )

    # Step 4
    # s_pi = u - x_pi*c_pi mod q
    s[secret_key_idx] = submodn(u, mulmodn(secret_key, c[secret_key_idx]))

    # Signature is (C1, S1, ..., Sn, y_tilde)
    return (c[0], s, y_tilde)


def verify(
    message: Union[bytes, str],
    public_keys: List[Point],
    signature: Signature
) -> bool:
    """
    Verifies if the signature was generated by someone in the set of public keys
    """
    key_count = len(public_keys)

    c_0, s, y_tilde = signature
    c = c_0

    # Step 1
    h = H2(serialize(public_keys))

    for i in range(key_count):
        z_1 = ecAdd(ecMul(G, s[i]), ecMul(public_keys[i], c))
        z_2 = ecAdd(ecMul(h, s[i]), ecMul(y_tilde, c))

        if i is not key_count - 1:
            c = H1(
                serialize(public_keys, y_tilde, message, z_1, z_2)
            )

    # Step 2
    return c_0 == H1(
        serialize(public_keys, y_tilde, message, z_1, z_2)
    )


if __name__ == "__main__":
    secret_num = 4

    # Secret and public keys
    secret_keys = [random_private_key() for i in range(secret_num)]
    public_keys = [ecMul(G, s) for s in secret_keys]

    # Message
    message = "ETH for you and everyone!"

    # Signing key and idx
    sign_idx = 1
    sign_key = secret_keys[sign_idx]

    # Sign test cases
    signature = sign(message, public_keys, sign_key, sign_idx)
    assert verify(message, public_keys, signature)

    # wrong_sig1 = sign(message, public_keys, randsp(), sign_idx)
    # assert False is verify(message, public_keys, wrong_sig1)

    # wrong_sig2 = sign(message, public_keys, sign_key,
    #                   (sign_idx + 1) // secret_num)
    # assert False is verify(message, public_keys, wrong_sig2)

    # print("Works as expected!")

    # TODO: Fix compression
    c_0, s, y_tilde = signature
    print("--- Message ---")
    print("0x" + message.encode('utf-8').hex())
    print("--- c0 ---")
    print("0x" + to_hex(c_0))
    print("--- KeyImage ---")
    print(list(map(lambda x: "0x" + to_hex(x), list(y_tilde))))
    print("--- s ---")
    print(list(map(lambda x: "0x" + to_hex(x), list(s))))
    print("--- private keys ---")
    print(list(map(lambda x: "0x" + to_hex(x), list(secret_keys))))
    print("--- public keys ---")
    print(list(map(lambda x: ["0x" + to_hex(x[0]), "0x" + to_hex(x[1])], list(public_keys))))