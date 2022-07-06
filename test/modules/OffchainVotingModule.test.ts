import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { constants } from 'ethers'
import { parseEther, verifyMessage } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import dayjs from 'dayjs'

import {
  Dao,
  Dao__factory,
  Factory,
  Factory__factory,
  
  GovToken,
  GovToken__factory,
  
  NamedToken__factory,

  Auction,
  Auction__factory,

  OffchainVotingModule,
  OffchainVotingModule__factory

} from '../../typechain-types'
import { executeTx, createData, createTxHash } from '../utils'

describe('OffchainVotingModule', () => {
  let auction: Auction

  let factory: Factory

  let dao: Dao

  let govToken: GovToken

  let offchainVotingModule: OffchainVotingModule

  let signers: SignerWithAddress[]

  let ownerAddress: string

  let _spaceId: string = 'demo.eth' 

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

    offchainVotingModule = await new  OffchainVotingModule__factory(signers[0]).deploy()

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


    await executeTx(
      dao.address,
      dao.address,
      'addPermitted',
      ['address'],
      [offchainVotingModule.address],
      0,
      signers[0]
    )

    await executeTx(
      dao.address,
      dao.address,
      'setPermittedSpaceId',
      ['string'],
      [_spaceId],
      0,
      signers[0]
    )

    expect(await dao.containsPermitted(offchainVotingModule.address)).to.eq(true)

  })

  it('create gov token by permitted proxy ',async () => {
    

      const timestamp = dayjs().unix();
      let Tx = {
        target: dao.address,
        data: createData('changeQuorum', ['uint8'], [60]),
        value: 0,
        nonce: 0,
        timestamp
      }

      let txHash = createTxHash(
        offchainVotingModule.address,
        Tx.target,
        Tx.data,
        Tx.value,
        Tx.nonce,
        Tx.timestamp,
        1337
      )

      const sig = await signers[0].signMessage(txHash)
      expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)

      
      console.log('signer::', signers[0].address, signers[1].address);
      // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

      expect(
        await offchainVotingModule.createAndExecute(
          dao.address,
          Tx.target,
          Tx.data,
          Tx.value,
          Tx.nonce,
          Tx.timestamp,
          sig,
          _spaceId
        )
      ).to.emit(dao, 'changeQuorum')

  })
  it('Create, Execute, Disable, Read', async () => {
  
    
    const timestamp = dayjs().unix();

    let Tx = {
      target: govToken.address,
      data: createData('mint', ['address', 'uint256'], [ownerAddress, 10000]),
      value: 0,
      nonce: 0,
      timestamp
    }

    let txHash = createTxHash(
      offchainVotingModule.address,
      Tx.target,
      Tx.data,
      Tx.value,
      Tx.nonce,
      Tx.timestamp,
      1337
    )
  
    const sig = await signers[0].signMessage(txHash)
    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)
    
    console.log('signer::', signers[0].address, signers[1].address);
    // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

    expect(
      await offchainVotingModule.createProposal(
        dao.address,
        Tx.target,
        Tx.data,
        Tx.value,
        Tx.nonce,
        Tx.timestamp,
        sig,
        _spaceId
      )
    ).to.emit(dao, 'changeQuorum')
    
    expect(await govToken.balanceOf(ownerAddress)).to.eq(0)
    
    
    expect(
      (await offchainVotingModule.proposals(dao.address, 0)).isActive
    ).to.eq(true)
    
    let proposal = await offchainVotingModule.getProposals(dao.address);
    console.log(proposal);


    await offchainVotingModule.connect(signers[0]).execute(dao.address, 0)

    expect(await govToken.balanceOf(ownerAddress)).to.eq(10000)


    expect((await offchainVotingModule.getProposals(dao.address)).length).to.eq(1)
  })


  it('deposit, withdraw from the dao vault',async () => {
    const friendAddress = signers[1].address

    const usdc = await new NamedToken__factory(signers[0]).deploy(
      'USDC',
      'USDC'
    )
    const timestamp = dayjs().unix();

    let Tx = {
      target: usdc.address,
      data: createData('transfer', ['address', 'uint256'], [signers[1].address, 100]),
      value: 0,
      nonce: 0,
      timestamp
    }

    let txHash = createTxHash(
      offchainVotingModule.address,
      Tx.target,
      Tx.data,
      Tx.value,
      Tx.nonce,
      Tx.timestamp,
      1337
    )
  
    const sig = await signers[0].signMessage(txHash)
    expect(verifyMessage(txHash, sig)).to.eq(ownerAddress)
    
    console.log('signer::', signers[0].address, signers[1].address);
    // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

    expect(
      await offchainVotingModule.createProposal(
        dao.address,
        Tx.target,
        Tx.data,
        Tx.value,
        Tx.nonce,
        Tx.timestamp,
        sig,
        _spaceId
      )
    ).to.emit(dao, 'changeQuorum')
    
    expect(
      (await offchainVotingModule.proposals(dao.address, 0)).isActive
    ).to.eq(true)
    
    let proposal = await offchainVotingModule.getProposals(dao.address);
    console.log(proposal);

    console.log('dao usdc balance:: ', await usdc.balanceOf(dao.address));

    
    await usdc.transfer(dao.address, 1000);
    expect(await usdc.balanceOf(dao.address)).to.eq(1000);


    
    console.log('dao usdc balance:: ', await usdc.balanceOf(dao.address));
    console.log('ownerAddress usdc balance:: ', await usdc.balanceOf(ownerAddress));
    
    console.log('ownerAddress usdc balance:: ', await usdc.balanceOf(signers[1].address));
   
    await offchainVotingModule.connect(signers[0]).execute(dao.address, 0)

    console.log('dao usdc balance:: ', await usdc.balanceOf(dao.address));
    console.log('ownerAddress usdc balance:: ', await usdc.balanceOf(ownerAddress));
      console.log('ownerAddress usdc balance:: ', await usdc.balanceOf(signers[1].address));
   
    // expect(await govToken.balanceOf(ownerAddress)).to.eq(10000)


    expect((await offchainVotingModule.getProposals(dao.address)).length).to.eq(1)


  })

})
