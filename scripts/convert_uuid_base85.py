#!/usr/bin/env python3
import base64


def uuid_to_ascii85(uuid_str: str) -> str:
    """
    Converts a UUID string to a URL-safe Ascii85 encoded string.

    Steps:
    1. Remove hyphens from the UUID.
    2. Convert the hex string to bytes.
    3. Use Ascii85 encoding (with adobe=False to omit <~ and ~>).
    """
    # Remove hyphens from the UUID
    hex_str = uuid_str.replace("-", "")

    # Convert the hex string to bytes (UUIDs are 16 bytes)
    uuid_bytes = bytes.fromhex(hex_str)

    # Encode the bytes using Ascii85 without Adobe delimiters or padding
    encoded_bytes = base64.a85encode(uuid_bytes, adobe=False, pad=False)

    return encoded_bytes.decode("ascii")


if __name__ == "__main__":
    uuid = "e00e8310-85da-454f-936a-2b359bb1c961"
    ascii85_encoded = uuid_to_ascii85(uuid)
    print("Ascii85 encoded UUID:", ascii85_encoded)
