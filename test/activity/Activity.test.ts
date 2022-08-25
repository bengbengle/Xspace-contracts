import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import dayjs from "dayjs";
import { ethers } from "hardhat";

import {
  Token,
  Token__factory,
  Activity,
  Activity__factory,
} from "../../typechain-types";

import MerkleTree from "../merkleTree";

type AddressData = {
  recipient: string;
  tokenAddress: string;
  tokenAmount: number;
};

const init_tree = (
  distributor: string,
  _id: number,
  tokenAddress: string,
  list: string[]
) => {
  let _tree = {
    distributor: distributor,
    activityId: _id,
    tokenAddress,
    addresses: [
      {
        recipient: list[0],
        tokenAddress,
        tokenAmount: 1,
      },
      {
        recipient: list[1],
        tokenAddress,
        tokenAmount: 2
      },
    ],
  };
  return _tree;
};
describe("Activity", () => {
  let activity: Activity;
  let token: Token;

  let activity__factory: Activity__factory;

  let signers: SignerWithAddress[];

  let ownerAddress: string;

  let addresses: AddressData[];

  let tree: MerkleTree;

  beforeEach(async () => {
    signers = await ethers.getSigners();

    ownerAddress = "0xa8E7813150a988e7F20193983fA3017155F3C162";

    activity = await new Activity__factory(signers[0]).deploy();
    token = await new Token__factory(signers[0]).deploy();

    // const timestamp = dayjs().unix()
  });

  it("should deploy", async () => {
    expect(activity.address).to.not.be.undefined;
  });

  it("Activity Create", async () => {
    // 0x401cB83eD43013d7705CA3c742A15321b8DEde18

    let tokenAddress = '0x2441AC1a15cB95B34766913E660f423F267e0E70'
    let _id = 1;
    let list = ['0xa8E7813150a988e7F20193983fA3017155F3C162', '0x7009E5c74B3b3f28e622909e5A987e6F0e915cB7'];
    let distributor = "0xa8E7813150a988e7F20193983fA3017155F3C162";
    
    const _tree = init_tree(distributor, _id, tokenAddress, list);

    tree = new MerkleTree(
      distributor,
      _id,
      token.address,
      _tree.addresses
    );
    const rootHash = tree.getRoot();

    let leaves = tree.expandLeaves();
    let leaf = leaves.find(
      (leaf) =>
        leaf.recipient.toLowerCase() === list[1].toLowerCase()
    );

    // console.log("tree:", tree, "rootHash:", rootHash, "leaf:", leaf);

    if (!leaf) return;
    let index = leaf.index;
    let proofs = tree.getProof(index);

    // console.log("distributor", distributor, "  _id:", _id);

    console.log("addresses:");
    console.log("Merkle tree root hash:", rootHash);
    console.log("proofs", proofs);
    console.log("index", index);
    console.log("recipient", leaf.recipient);

    // let activity_id = await activity.activityIds(list[0]);
    // console.log("activity_id", activity_id.toNumber());

    // await activity.start(activity_id.toNumber(), rootHash);

    // let balance = await token.balanceOf(list[1])
    
    // console.log("balance.toNumber():", balance.toNumber());

    // await activity.claim(list[0], activity_id, index, list[1].toLowerCase(), tokenAddress, 2, proofs);

    // console.log("balance.toNumber():", balance.toNumber());

  });

  it("Activity Start", async () => {
    ownerAddress = signers[0].address;
    await token.approve(activity.address, 10);
    await activity.create(token.address, 10);

    let activity_id = await activity.activityIds(ownerAddress);
    console.log("activity_id", activity_id.toNumber());

    
    const _tree = init_tree(ownerAddress, activity_id.toNumber(), token.address, [signers[0].address, signers[1].address]);

    tree = new MerkleTree(ownerAddress, activity_id.toNumber(), token.address, _tree.addresses);
    
    
    let balance = await token.balanceOf(signers[0].address);
    console.log("balance.toNumber():", balance.toNumber());

    await activity.start(activity_id.toNumber(), tree.getRoot());

    await activity.claim(ownerAddress, activity_id.toNumber(), 1, signers[1].address, token.address, 2, tree.getProof(1));

    balance = await token.balanceOf(signers[0].address);
    console.log("balance.toNumber():", balance.toNumber());
  });

  it("Activity Claimed", async () => {
    const timestamp = dayjs().unix();

    const friendAddress = signers[1].address;
  });
});
