pragma solidity ^0.8.6;
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @dev String operations.
 */
library Signer {

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function getMessage(
        address _to,
        uint _type
    ) public pure returns (string memory) {
        return  string(abi.encodePacked("0x", toAsciiString(_to), Strings.toString(_type)));
    }

    function getEthSignedMessageHash(string memory _message)
        public
        pure
        returns (bytes32)
    {
        return keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n", Strings.toString(bytes(_message).length), _message)
            );
    }

    function verify(
        address _signer,
        address _to,
        uint _type,
        bytes memory _sig
    ) public pure returns (bool) {
        string memory message = getMessage(_to, _type);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(message);

        return recoverSigner(ethSignedMessageHash, _sig) == _signer;
    }


    function verifyTest(
        address _to,
        uint  _type,
        bytes memory _sig
    ) public pure returns (address) {
        string memory message = getMessage(_to, _type);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(message);

        return recoverSigner(ethSignedMessageHash, _sig);
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        internal
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}