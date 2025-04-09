#!/usr/bin/env python3


def uuid_to_base62(uuid_str: str) -> str:
    """
    Converts a UUID string to a Base62 URL-safe encoded string.
    Steps:
    1. Remove hyphens from the UUID.
    2. Convert the hex string to an integer.
    3. Encode the integer in Base62.
    """
    # Step 1: Remove hyphens from the UUID
    hex_str = uuid_str.replace("-", "")

    # Step 2: Convert the hexadecimal string to an integer (base-16)
    bigint = int(hex_str, 16)

    # Base62 alphabet: 0-9, A-Z, a-z
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    base = len(alphabet)

    # Edge-case: if the integer is 0, return the first character of the alphabet.
    if bigint == 0:
        return alphabet[0]

    # Step 3: Convert the integer to a Base62 encoded string
    encoded = ""
    while bigint > 0:
        bigint, remainder = divmod(bigint, base)
        encoded = alphabet[remainder] + encoded

    return encoded


if __name__ == "__main__":
    # The UUID to encode
    uuid_str = "e00e8310-85da-454f-936a-2b359bb1c961"
    base62_encoded = uuid_to_base62(uuid_str)
    print("Base62 encoded UUID:", base62_encoded)
