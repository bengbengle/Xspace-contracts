import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { constants } from 'ethers'
import { parseEther, verifyMessage } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import {
  Dao,
  Dao__factory,

  DaoViewer__factory,
  
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

describe('Auction', () => {
  let auction: Auction

  let factory: Factory

  let token: Token

  let dao: Dao

  let signers: SignerWithAddress[]

  let ownerAddress: string

  let govToken: GovToken

  beforeEach(async () => {
    signers = await ethers.getSigners()

    ownerAddress = signers[0].address

    token = await new Token__factory(signers[0]).deploy()

    auction = await new Auction__factory(signers[0]).deploy()

    factory = await new Factory__factory(signers[0]).deploy()

    await factory.setupAuction(auction.address)
    await auction.setFactory(factory.address)

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

    expect(await dao.govToken()).to.eq(constants.AddressZero)

    const timestamp = dayjs().unix()

    const VOTING = {
      target: auction.address,
      data: createData('createGovToken', ['string', 'string'], ['GovToken', 'GT']),
      value: 0,
      nonce: 0,
      timestamp
    }

    const txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    const sig = await signers[0].signMessage(txHash)

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
  })

  it('Public Offer', async () => {

    expect(await auction.publicOffers(dao.address)).to.have.property('isActive', false)
    expect(await auction.publicOffers(dao.address)).to.have.property('currency', constants.AddressZero)

    expect(+(await auction.publicOffers(dao.address)).rate).to.eq(0)

    const goldToken = await new Token__factory(signers[0]).deploy()

    const timestamp = dayjs().unix()

    const VOTING = {
      target: auction.address,
      data: createData(
        'initPublicOffer',
        ['bool', 'address', 'uint256'],
        [true, goldToken.address, parseEther('5')]
      ),
      value: 0,
      nonce: 0,
      timestamp
    }

    const txHash = createTxHash(
      dao.address,
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      1337
    )

    const sig = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sig]
    )

    // const daoViewer = await new DaoViewer__factory(signers[0]).deploy()

    // const investInfo = await daoViewer.getInvestInfo(factory.address)

    // expect(investInfo[0][0].slice(0, 6)).to.eql([
    //   dao.address,
    //   await dao.name(),
    //   await dao.symbol(),
    //   govToken.address,
    //   await govToken.name(),
    //   await govToken.symbol()
    // ])

    // expect(investInfo[1][0].slice(0, 3)).to.eql([
    //   true,
    //   goldToken.address,
    //   parseEther('5')
    // ])

    // expect(investInfo.slice(2)).to.eql([
    //   [await goldToken.symbol()],
    //   [await goldToken.decimals()],
    //   [constants.Zero]
    // ])

    expect(await auction.publicOffers(dao.address)).to.have.property('isActive', true)
    expect(await auction.publicOffers(dao.address)).to.have.property('currency', goldToken.address)

    expect((await auction.publicOffers(dao.address)).rate).to.eql(parseEther('5'))

    await goldToken.transfer(signers[1].address, parseEther('10'))

    await goldToken.connect(signers[1]).approve(auction.address, parseEther('10'))

    await auction.connect(signers[1]).buyPublicOffer(dao.address, parseEther('2'))

    expect(await goldToken.balanceOf(signers[1].address)).to.eq(0)

    expect(await govToken.balanceOf(signers[1].address)).to.eq(parseEther('2'))
  })

  it('Create and Disable Private Offer', async () => {
    const timestamp = dayjs().unix()

    const friendAddress = signers[1].address

    const goldToken = await new Token__factory(signers[0]).deploy()

    expect(await auction.numberOfPrivateOffers(dao.address)).to.eq(0)

    let VOTING = {
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

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sig]
    )

    const daoViewer = await new DaoViewer__factory(signers[0]).deploy()
    
    console.log('daoViewer.address:', daoViewer.address);
    const privateOffersInfo = await daoViewer.getPrivateOffersInfo(
      factory.address
    )

    expect(privateOffersInfo[0][0].slice(0, 6)).to.eql([
      dao.address,
      await dao.name(),
      await dao.symbol(),
      govToken.address,
      await govToken.name(),
      await govToken.symbol()
    ])

    expect(privateOffersInfo.slice(1)).to.eql([
      [constants.One],
      [
        [
          true,
          friendAddress,
          goldToken.address,
          BigNumber.from('25'),
          BigNumber.from('15')
        ]
      ],
      [await goldToken.symbol()],
      [await goldToken.decimals()]
    ])

    expect(await auction.numberOfPrivateOffers(dao.address)).to.eq(1)

    VOTING = {
      target: auction.address,
      data: createData('disablePrivateOffer', ['uint256'], [0]),
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

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sig]
    )

    await expect(
      auction.connect(signers[1]).buyPrivateOffer(dao.address, 0)
    ).to.be.revertedWith('Auction: this offer is disabled')

    expect(await auction.numberOfPrivateOffers(dao.address)).to.eq(1)
  })
})
