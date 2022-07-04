import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { constants } from 'ethers'
import { parseEther, verifyMessage } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import {
  Dao,
  Dao__factory,
  Factory,
  Factory__factory,
  GovToken,
  GovToken__factory,
  Auction,
  Auction__factory,
  Token,
  Token__factory
} from '../../typechain-types'
import { createData, createTxHash } from '../utils'

describe('GovToken', () => {
  let auction: Auction

  let factory: Factory

  let dao: Dao

  let lp: GovToken

  let signers: SignerWithAddress[]

  let ownerAddress: string

  let token: Token

  let govToken: GovToken

  beforeEach(async () => {
    signers = await ethers.getSigners()

    ownerAddress = signers[0].address

    token = await new Token__factory(signers[0]).deploy()

    auction = await new Auction__factory(signers[0]).deploy()

    factory = await new Factory__factory(signers[0]).deploy()

    await auction.setFactory(factory.address)

    await factory.setupAuction(auction.address)

    const DAO_CONFIG = {
      daoName: 'TestDAO',
      daoSymbol: 'TDAO',
      quorum: 51,
      partners: [ownerAddress],
      shares: [10]
    }

    await factory.create(
      DAO_CONFIG.daoName,
      DAO_CONFIG.daoSymbol,
      DAO_CONFIG.quorum,
      DAO_CONFIG.partners,
      DAO_CONFIG.shares
    )

    dao = Dao__factory.connect(await factory.daoAt(0), signers[0])
  })

  it('Deploy GovToken, Change Mintable/Burnable and Freeze Them', async () => {
    expect(await dao.govToken()).to.eq(constants.AddressZero)

    const timestamp = dayjs().unix()

    let VOTING = {
      target: auction.address,
      data: createData('createGovToken', ['string', 'string'], ['EgorGovToken', 'EGovToken']),
      value: 0,
      nonce: 0,
      timestamp
    }

    let txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    let sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    ).to.emit(auction, 'GovTokenCreated')

    expect(await dao.govToken()).to.not.eq(constants.AddressZero)

    govToken = GovToken__factory.connect(await dao.govToken(), signers[0])
    
    expect(await auction.govTokens(govToken.address)).to.eq(true)

    expect(
      await Promise.all([
        govToken.name(),
        govToken.symbol(),
        govToken.totalSupply(),
        govToken.mintable(),
        govToken.burnable(),
        govToken.mintableStatusFrozen(),
        govToken.burnableStatusFrozen(),
        govToken.dao(),
        govToken.auction()
      ])
    ).to.deep.eq([
      'EgorGovToken',
      'EGovToken',
      constants.Zero,
      true,
      true,
      false,
      false,
      dao.address,
      auction.address
    ])

    VOTING = {
      target: govToken.address,
      data: createData('changeMintable', ['bool'], [false]),
      value: 0,
      nonce: 0,
      timestamp
    }

    txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    )

    expect(await govToken.mintable()).to.eq(false)

    VOTING = {
      target: govToken.address,
      data: createData('changeBurnable', ['bool'], [false]),
      value: 0,
      nonce: 0,
      timestamp
    }

    txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    )

    expect(await govToken.burnable()).to.eq(false)

    VOTING = {
      target: govToken.address,
      data: createData('freezeMintingStatus'),
      value: 0,
      nonce: 0,
      timestamp
    }

    txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    )

    expect(await govToken.mintableStatusFrozen()).to.eq(true)

    VOTING = {
      target: govToken.address,
      data: createData('freezeBurningStatus'),
      value: 0,
      nonce: 0,
      timestamp
    }

    txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    )

    expect(await govToken.burnableStatusFrozen()).to.eq(true)
  })

  it('Mint GovToken with Auction, then Burn', async () => {
    expect(await dao.govToken()).to.eq(constants.AddressZero)

    const timestamp = dayjs().unix()

    const friendAddress = signers[1].address

    let VOTING = {
      target: auction.address,
      data: createData('createGovToken', ['string', 'string'], ['EgorGovToken', 'EGovToken']),
      value: 0,
      nonce: 0,
      timestamp
    }

    let txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    let sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    ).to.emit(auction, 'GovTokenCreated')

    govToken = GovToken__factory.connect(await dao.govToken(), signers[0])

    const goldToken = await new Token__factory(signers[0]).deploy()
    const silverToken = await new Token__factory(signers[0]).deploy()

    VOTING = {
      target: auction.address,
      data: createData(
        'createPrivateOffer',
        ['address', 'address', 'uint256', 'uint256'],
        [friendAddress, goldToken.address, 25, 15]
      ),
      value: 0,
      nonce: 0,
      timestamp
    }

    txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    )

    await goldToken.transfer(friendAddress, 30)

    await goldToken.connect(signers[1]).approve(auction.address, 25)

    await auction.connect(signers[1]).buyPrivateOffer(dao.address, 0)

    expect(
      (
        await Promise.all([
          govToken.balanceOf(ownerAddress),
          govToken.balanceOf(friendAddress),
          govToken.balanceOf(dao.address),
          
          goldToken.balanceOf(ownerAddress),
          goldToken.balanceOf(friendAddress),
          goldToken.balanceOf(dao.address)
        ])
      ).map(Number)
    ).to.deep.eq([0, 15, 0, 1e20 - 30, 5, 25])

    VOTING = {
      target: auction.address,
      data: createData(
        'createPrivateOffer',
        ['address', 'address', 'uint256', 'uint256'],
        [ownerAddress, silverToken.address, 15, 10]
      ),
      value: 0,
      nonce: 0,
      timestamp
    }

    txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    expect(
      await dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    )

    await silverToken.approve(auction.address, 15)

    await auction.buyPrivateOffer(dao.address, 1)

    expect(
      (
        await Promise.all([
          govToken.balanceOf(ownerAddress),
          govToken.balanceOf(friendAddress),
          govToken.balanceOf(dao.address),
          goldToken.balanceOf(ownerAddress),
          goldToken.balanceOf(friendAddress),
          goldToken.balanceOf(dao.address),
          silverToken.balanceOf(ownerAddress),
          silverToken.balanceOf(friendAddress),
          silverToken.balanceOf(dao.address)
        ])
      ).map(Number)
    ).to.deep.eq([10, 15, 0, 1e20 - 30, 5, 25, 1e20 - 15, 0, 15])

    await signers[0].sendTransaction({
      to: dao.address,
      value: parseEther('0.05')
    })

    expect(await ethers.provider.getBalance(dao.address)).to.eq(
      parseEther('0.05')
    )

    await expect(
      await govToken
        .connect(signers[1])
        .burn(15, [goldToken.address, silverToken.address], [], [])
    ).to.changeEtherBalances(
      [dao, signers[1]],
      [
        parseEther('-0.05').mul('15').div('25'),
        parseEther('0.05').mul('15').div('25')
      ]
    )

    expect(
      (
        await Promise.all([
          govToken.balanceOf(ownerAddress),
          govToken.balanceOf(friendAddress),
          govToken.balanceOf(dao.address),
          goldToken.balanceOf(ownerAddress),
          goldToken.balanceOf(friendAddress),
          goldToken.balanceOf(dao.address),
          silverToken.balanceOf(ownerAddress),
          silverToken.balanceOf(friendAddress),
          silverToken.balanceOf(dao.address)
        ])
      ).map(Number)
    ).to.deep.eq([
      10,
      0,
      0,
      1e20 - 30,
      5 + (25 * 15) / 25,
      (25 * 10) / 25,
      1e20 - 15,
      (15 * 15) / 25,
      (15 * 10) / 25
    ])
  })
})
