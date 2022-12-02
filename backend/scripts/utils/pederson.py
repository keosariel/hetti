import random

G = 0xc456aa3b7852a6e9283b2d8167b85c85
H = 0x1e848769136e5df42080f3959c96d462 # random.randint(1, G - 1)

def C(v, r=None):
    if r is None:
        r = random.randint(1, G - 1)

    return (r * G)+ (v * H), r

def verify(c, r, v):
    return (G * r) + (H * v) == c

if __name__ == "__main__":
    v1 = 30
    v2 = 1
    v3 = 29

    c1, r1 = C(v1)
    c2, r2 = C(v2)
    c3, r3 = C(v3)

    c4, r4 = C(v1 + v2 + v3, r1 + r2 + r3)

    assert c4 == c1 + c2 + c3

    c5, r5 = C(0, r1 - r2 - r3)

    assert c5 == c1 - c2 - c3

    print(c5, c1 - c2 - c3)