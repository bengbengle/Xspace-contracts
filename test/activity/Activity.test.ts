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

const recipient_list = (list: string[], tokenAddress: string) => {
  return [
    {
      // 领奖者地址
      recipient: list[0],
      // erc20 代币地址
      tokenAddress,
      // 领奖金额
      tokenAmount: 1,
    },
    {
      // 领奖者地址
      recipient: list[1],
      // erc20 代币地址
      tokenAddress,
      // erc20 领奖金额
      tokenAmount: 2
    },
  ];
};

describe("Activity", () => {
  let activity: Activity;
  let token: Token;

  let activity__factory: Activity__factory;

  let signers: SignerWithAddress[];

  let distributor: string;

  let addresses: AddressData[];

  let tree: MerkleTree;

  let _list: string[];
  let _recipient_list: AddressData[];

  beforeEach(async () => {
    signers = await ethers.getSigners();

    // 活动发起者
    distributor = "0xa8E7813150a988e7F20193983fA3017155F3C162";

    activity = await new Activity__factory(signers[0]).deploy();
    token = await new Token__factory(signers[0]).deploy();
  });

  it("Activity Create", async () => {

    let tokenAddress = '0x2441AC1a15cB95B34766913E660f423F267e0E70'
    
    // 领奖者
    _list = [
      '0xa8E7813150a988e7F20193983fA3017155F3C162', 
      '0x7009E5c74B3b3f28e622909e5A987e6F0e915cB7'
    ];

    // ----- 通过监听 created 事件 获取

    // // 活动发起者
    // let distributor = "0xa8E7813150a988e7F20193983fA3017155F3C162";
    
    // // 活动ID
    // let _id = 1;

    // const _recipient_list = recipient_list(distributor, _id, tokenAddress, list);

    // tree = new MerkleTree(distributor, _id, token.address, _recipient_list);

  });

  it("Activity Start", async () => {
    
    distributor = signers[0].address;
    await token.approve(activity.address, 10);
    await activity.create(token.address, 10);

    // 最新 活动 Id
    let activity_id = await activity.activityIds(distributor);

    console.log("activity_id", activity_id.toNumber());

    // Mock 领奖者 列表
    _recipient_list = recipient_list(_list, token.address);

    // 生成 MerkleTree rootHash
    tree = new MerkleTree(distributor, activity_id.toNumber(), token.address, _recipient_list);

    await activity.start(activity_id.toNumber(), tree.getRoot());
    
  });

  it("Activity Claimed", async () => {
    
    let balance = await token.balanceOf(signers[0].address);
    console.log("balance.toNumber():", balance.toNumber());

    // 最新 活动 Id
    let activity_id = await activity.activityIds(distributor);


    // 获取用户的 Index
    let leaves = tree.expandLeaves();
    let leaf = leaves.find(
      (leaf) =>
        leaf.recipient.toLowerCase() === _list[1].toLowerCase()
    );
    if (!leaf) return;
    let index = leaf.index;


    await activity.claim(
      distributor, 
      activity_id.toNumber(), 
      index, 
      leaf.recipient, 
      leaf.tokenAddress, 
      leaf.tokenAmount, 
      tree.getProof(leaf.index)
    );

    balance = await token.balanceOf(signers[0].address);
    console.log("balance.toNumber():", balance.toNumber());

  });
});
