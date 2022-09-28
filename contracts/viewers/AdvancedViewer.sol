// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.6;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// contract AdvancedViewer {
//     address private immutable factory;

//     constructor(address _factory) {
//         factory = _factory;
//     }

//     function userDaos(
//         uint256 start,
//         uint256 end,
//         address user
//     ) external view returns (address[] memory) {
//         address _factory = factory;

//         (bool s1, bytes memory r1) = _factory.staticcall(hex"24f2ff16");
//         require(s1);
//         uint numberOfDaos = abi.decode(r1, (uint256));

//         address[] memory _userDaos = new address[](numberOfDaos);

//         uint j = 0;

//         for (uint i = start; i < end; i++) {
//             (bool s2, bytes memory r2) = _factory.staticcall(
//                 abi.encodeWithSelector(hex"b2dabed4", i)
//             );
//             require(s2);

//             address daoAddress = abi.decode(r2, (address));

//             if (IERC20(daoAddress).balanceOf(user) > 0) {
//                 _userDaos[j] = daoAddress;
//                 j++;
//             }
//         }

//         return _userDaos;
//     }
// }
