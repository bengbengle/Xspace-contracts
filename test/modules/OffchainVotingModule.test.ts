import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { constants } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import {
  Dao,
  Dao__factory,
  Factory,
  Factory__factory,
  
  GovToken,
  GovToken__factory,
  
  NamedToken__factory,

  ExitModule,
  ExitModule__factory,
  
  Auction,
  Auction__factory,

} from '../../typechain-types'
import { executeTx } from '../utils'

describe('ExitModule', () => {
  let auction: Auction

  let factory: Factory

  let dao: Dao

  let govToken: GovToken

  let offchainVotingModule: ExitModule

  let signers: SignerWithAddress[]

  let ownerAddress: string

  beforeEach(async () => {
    signers = await ethers.getSigners()
    
    ownerAddress = signers[0].address
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

    offchainVotingModule = await new ExitModule__factory(signers[0]).deploy()

    await executeTx(
      dao.address,
      auction.address,
      'createGovToken',
      ['string', 'string'],
      ['EgorLP', 'ELP'],
      0,
      signers[0]
    )

    govToken = GovToken__factory.connect(await dao.govToken(), signers[0])
  })

  it('Create, Exit, Disable, Read', async () => {
    const friendAddress = signers[1].address

    const usdc = await new NamedToken__factory(signers[0]).deploy('USDC', 'USDC')

    const btc = await new NamedToken__factory(signers[0]).deploy('BTC', 'BTC')

    await executeTx(
      dao.address,
      offchainVotingModule.address,
      'createExitOffer',
      ['address', 'uint256', 'uint256', 'address[]', 'uint256[]'],
      [
        friendAddress,
        parseEther('1'),
        parseEther('0.07'),
        [usdc.address, btc.address],
        [parseEther('0.9'), parseEther('1.3')]
      ],
      0,
      signers[0]
    )

    await expect(
      offchainVotingModule.connect(signers[1]).exit(dao.address, 0)
    ).to.be.revertedWith('ERC20: insufficient allowance')

    expect(await govToken.totalSupply()).to.eql(constants.Zero)

    await executeTx(
      dao.address,
      auction.address,
      'createPrivateOffer',
      ['address', 'address', 'uint256', 'uint256'],
      [friendAddress, usdc.address, 0, parseEther('2')],
      0,
      signers[0]
    )

    await auction.connect(signers[1]).buyPrivateOffer(dao.address, 0)

    expect(await govToken.balanceOf(friendAddress))
      .to.eql(parseEther('2'))
      .to.eql(await govToken.totalSupply())

    await expect(
      offchainVotingModule.connect(signers[1]).exit(dao.address, 0)
    ).to.be.revertedWith('ERC20: insufficient allowance')

    await govToken
      .connect(signers[1])
      .approve(offchainVotingModule.address, parseEther('999'))

    await expect(
      offchainVotingModule.connect(signers[1]).exit(dao.address, 0)
    ).to.be.revertedWith('DAO: only for permitted')

    await executeTx(
      dao.address,
      dao.address,
      'addPermitted',
      ['address'],
      [offchainVotingModule.address],
      0,
      signers[0]
    )

    expect(await dao.containsPermitted(offchainVotingModule.address)).to.eq(true)

    await expect(
      offchainVotingModule.connect(signers[1]).exit(dao.address, 0)
    ).to.be.revertedWith('ERC20: transfer amount exceeds balance')

    await usdc.transfer(dao.address, parseEther('1'))
    await btc.transfer(dao.address, parseEther('2'))

    await expect(
      offchainVotingModule.connect(signers[1]).exit(dao.address, 0)
    ).to.be.revertedWith('Address: insufficient balance')

    await signers[0].sendTransaction({
      to: dao.address,
      value: parseEther('10')
    })

    await executeTx(
      dao.address,
      govToken.address,
      'changeBurnable',
      ['bool'],
      [false],
      0,
      signers[0]
    )

    await expect(
      await offchainVotingModule.connect(signers[1]).exit(dao.address, 0)
    ).to.changeEtherBalances(
      [dao, signers[1], offchainVotingModule],
      [parseEther('-0.07'), parseEther('0.07'), parseEther('0')]
    )

    expect(await ethers.provider.getBalance(offchainVotingModule.address)).to.eql(
      constants.Zero
    )

    expect(await ethers.provider.getBalance(dao.address)).to.eql(
      parseEther('9.93')
    )

    expect(await usdc.balanceOf(friendAddress)).to.eql(parseEther('0.9'))
    expect(await btc.balanceOf(friendAddress)).to.eql(parseEther('1.3'))

    // Create and Disable

    await executeTx(
      dao.address,
      offchainVotingModule.address,
      'createExitOffer',
      ['address', 'uint256', 'uint256', 'address[]', 'uint256[]'],
      [
        friendAddress,
        parseEther('1'),
        parseEther('0.07'),
        [usdc.address, btc.address],
        [parseEther('0.9'), parseEther('1.3')]
      ],
      0,
      signers[0]
    )

    expect(
      (await offchainVotingModule.exitOffers(dao.address, 1)).isActive
    ).to.eq(true)

    await executeTx(
      dao.address,
      offchainVotingModule.address,
      'disableExitOffer',
      ['uint256'],
      [1],
      0,
      signers[0]
    )

    expect(
      (await offchainVotingModule.exitOffers(dao.address, 1)).isActive
    ).to.eq(false)

    expect((await offchainVotingModule.getOffers(dao.address)).length).to.eq(2)
  })
})
