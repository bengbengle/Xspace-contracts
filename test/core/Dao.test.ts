import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { constants } from 'ethers'
import { parseEther, verifyMessage } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import {
  Dao,
  Dao__factory,
  GovToken__factory,
  Factory,
  Factory__factory,
  PayableFunction__factory,
  
  Token,
  Token__factory,
  
  Auction,
  Auction__factory,
  
  Adapter,
  Adapter__factory
} from '../../typechain-types'
import { createData, createTxHash } from '../utils'

describe('Dao', () => {
  let auction: Auction

  let factory: Factory

  let dao: Dao
  
  let token: Token 

  let signers: SignerWithAddress[]

  let ownerAddress: string

  beforeEach(async () => {
    signers = await ethers.getSigners()

    ownerAddress = signers[0].address

    token = await new Token__factory(signers[0]).deploy()

    auction = await new Auction__factory(signers[0]).deploy()

    factory = await new Factory__factory(signers[0]).deploy()

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
  })

  it('Change Quorum', async () => {
    expect(await dao.balanceOf(ownerAddress)).to.eq(10)

    expect(await dao.quorum()).to.eq(51)

    expect(await dao.getExecutedVoting()).to.be.an('array').that.is.empty

    const timestamp = dayjs().unix()

    const VOTING = {
      target: dao.address,
      data: createData('changeQuorum', ['uint8'], [60]),
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
    ).to.emit(dao, 'Executed')

    expect(await dao.quorum()).to.eq(60)

    expect(await dao.getExecutedVoting()).to.have.lengthOf(1)

    expect(await dao.executedVotingByIndex(0)).to.have.property(
      'target',
      VOTING.target
    )

    expect(await dao.executedVotingByIndex(0)).to.have.property(
      'data',
      VOTING.data
    )

    expect(+(await dao.executedVotingByIndex(0)).value).to.eq(VOTING.value)

    expect(+(await dao.executedVotingByIndex(0)).nonce).to.eq(VOTING.nonce)

    expect(+(await dao.executedVotingByIndex(0)).timestamp).to.eq(
      VOTING.timestamp
    )

    const sigs = (await dao.executedVotingByIndex(0)).sigs

    expect(sigs).to.be.an('array')

    expect(verifyMessage(txHash, sigs[0])).to.eq(ownerAddress)
  })

  it('Mint and Sign Together', async () => {
    expect(await dao.balanceOf(ownerAddress)).to.eq(10)

    expect(await dao.mintable()).to.eq(true)

    const timestamp = dayjs().unix()

    const friendAddress = signers[1].address

    let VOTING = {
      target: dao.address,
      data: createData('mint', ['address', 'uint256'], [friendAddress, 10]),
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

    expect(await dao.balanceOf(friendAddress)).to.eq(10)

    VOTING = {
      target: dao.address,
      data: createData('disableMinting'),
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

    const sigOwner = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sigOwner)).to.eq(ownerAddress)

    await expect(
      dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sigOwner]
      )
    ).to.be.revertedWith('DAO: quorum is not reached')

    await expect(
      dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sigOwner, sigOwner]
      )
    ).to.be.revertedWith('DAO: signatures are not unique')

    const sigFriend = await signers[1].signMessage(txHash)

    expect(verifyMessage(txHash, sigFriend)).to.eq(friendAddress)

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sigOwner, sigFriend]
    )

    expect(await dao.mintable()).to.eq(false)

    VOTING = {
      target: dao.address,
      data: createData('disableBurning'),
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

    const sigOwnerDisableBurning = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sigOwnerDisableBurning)).to.eq(ownerAddress)

    await expect(
      dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sigOwner]
      )
    ).to.be.revertedWith('DAO: quorum is not reached')

    await expect(
      dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sigOwner, sigOwner]
      )
    ).to.be.revertedWith('DAO: signatures are not unique')

    const sigFriendDisableBurning = await signers[1].signMessage(txHash)

    expect(verifyMessage(txHash, sigFriendDisableBurning)).to.eq(friendAddress)

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sigOwnerDisableBurning, sigFriendDisableBurning]
    )

    expect(await dao.burnable()).to.eq(false)
  })

  it('Signature Replay Revert', async () => {
    expect(await dao.balanceOf(ownerAddress)).to.eq(10)

    expect(await dao.quorum()).to.eq(51)

    const timestamp = dayjs().unix()

    let VOTING = {
      target: dao.address,
      data: createData('changeQuorum', ['uint8'], [60]),
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

    expect(await dao.quorum()).to.eq(60)

    await expect(
      dao.execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )
    ).to.be.revertedWith('DAO: voting already executed')

    VOTING = {
      target: dao.address,
      data: createData('changeQuorum', ['uint8'], [60]),
      value: 0,
      nonce: 1,
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

    const sigNew = await signers[0].signMessage(txHash)

    expect(verifyMessage(txHash, sigNew)).to.eq(ownerAddress)

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sigNew]
    )

    expect(await dao.quorum()).to.eq(60)
  })

  it('Revert Transfer and Transfer From', async () => {
    await expect(
      dao.transfer(signers[1].address, 1)
    ).to.be.revertedWith('DAO: transfer is prohibited')

    await expect(
      dao.transferFrom(signers[0].address, signers[1].address, 1)
    ).to.be.revertedWith('DAO: transferFrom is prohibited')
  })

  it('Adapter and Viewers, Burn with Mock Adapter, Remove Adapter', async () => {
    const adapter = await new Adapter__factory(signers[0]).deploy()

    expect(await dao.numberOfAdapters()).to.eq(0)
    expect(await dao.containsAdapter(adapter.address)).to.eq(false)
    expect(await dao.getAdapters()).to.be.an('array').that.is.empty
    expect(await dao.numberOfPermitted()).to.eq(0)
    expect(await dao.containsPermitted(adapter.address)).to.eq(false)
    expect(await dao.getPermitted()).to.be.an('array').that.is.empty

    const timestamp = dayjs().unix()

    let VOTING = {
      target: dao.address,
      data: createData('addAdapter', ['address'], [adapter.address]),
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

    expect(await dao.numberOfAdapters()).to.eq(1)
    expect(await dao.containsAdapter(adapter.address)).to.eq(true)
    expect(await dao.getAdapters()).to.deep.eq([adapter.address])
    expect(await dao.numberOfPermitted()).to.eq(1)
    expect(await dao.containsPermitted(adapter.address)).to.eq(true)
    expect(await dao.getPermitted()).to.deep.eq([adapter.address])

    VOTING = {
      target: auction.address,
      data: createData('createGovToken', ['string', 'string'], ['EgorLP', 'ELP']),
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
    ).to.emit(auction, 'GovTokenCreated')

    expect(await dao.govToken()).to.not.eq(constants.AddressZero)

    const govToken = GovToken__factory.connect(await dao.govToken(), signers[0])

    const goldToken = await new Token__factory(signers[0]).deploy()

    VOTING = {
      target: auction.address,
      data: createData(
        'createPrivateOffer',
        ['address', 'address', 'uint256', 'uint256'],
        [ownerAddress, goldToken.address, 0, 10]
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

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sig]
    )

    await auction.buyPrivateOffer(dao.address, 0)

    // await govToken.burn(0, [])

    VOTING = {
      target: dao.address,
      data: createData('removeAdapter', ['address'], [adapter.address]),
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

    expect(await dao.numberOfAdapters()).to.eq(0)
    expect(await dao.containsAdapter(adapter.address)).to.eq(false)
    expect(await dao.getAdapters()).to.be.an('array').that.is.empty
    expect(await dao.numberOfPermitted()).to.eq(0)
    expect(await dao.containsPermitted(adapter.address)).to.eq(false)
    expect(await dao.getPermitted()).to.be.an('array').that.is.empty

    // await expect(govToken.burn(0, [])).to.be.revertedWith('DAO: this is not an adapter')
  })

  it('Permitted: Add, Execute Permitted and Remove', async () => {
    expect(await dao.numberOfPermitted()).to.eq(0)

    const friendAddress = signers[1].address

    await signers[0].sendTransaction({
      to: dao.address,
      value: parseEther('0.05')
    })

    await expect(
      dao.executePermitted(signers[2].address, '0x', parseEther('0.03'))
    ).to.be.revertedWith('DAO: only for permitted')

    const timestamp = dayjs().unix()

    const VOTING = {
      target: dao.address,
      data: createData('addPermitted', ['address'], [friendAddress]),
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

    expect(await dao.numberOfPermitted()).to.eq(1)

    expect(await dao.containsPermitted(friendAddress)).to.eq(true)

    expect(await dao.getPermitted()).to.eql([friendAddress])

    expect(
      await dao
        .connect(signers[1])
        .executePermitted(signers[2].address, '0x', parseEther('0.03'))
    )
      .to.emit(dao, 'ExecutedPermittedEvent')
      .withArgs(signers[2].address, '0x', parseEther('0.03'), friendAddress)
      .to.changeEtherBalances(
        [dao, signers[2]],
        [parseEther('-0.03'), parseEther('0.03')]
      )

    expect(await dao.getExecutedPermitted()).to.lengthOf(1)

    const paybleFunctionContract = await new PayableFunction__factory(
      signers[0]
    ).deploy()

    expect(
      await dao
        .connect(signers[1])
        .executePermitted(
          paybleFunctionContract.address,
          createData('hello', ['uint256'], [123]),
          parseEther('0.01')
        )
    )
      .to.emit(dao, 'ExecutedPermittedEvent')
      .withArgs(
        paybleFunctionContract.address,
        createData('hello', ['uint256'], [123]),
        parseEther('0.01'),
        friendAddress
      )
      .to.changeEtherBalances(
        [dao, paybleFunctionContract],
        [parseEther('-0.01'), parseEther('0.01')]
      )

    expect(
      await dao
        .connect(signers[1])
        .executePermitted(
          dao.address,
          createData('addPermitted', ['address'], [signers[3].address]),
          0
        )
    )
      .to.emit(dao, 'ExecutedPermittedEvent')
      .withArgs(
        dao.address,
        createData('addPermitted', ['address'], [signers[3].address]),
        0,
        friendAddress
      )

    expect(await dao.containsPermitted(signers[3].address)).to.eq(true)

    expect(
      await dao
        .connect(signers[1])
        .executePermitted(
          dao.address,
          createData('removePermitted', ['address'], [signers[3].address]),
          0
        )
    )
      .to.emit(dao, 'ExecutedPermittedEvent')
      .withArgs(
        dao.address,
        createData('removePermitted', ['address'], [signers[3].address]),
        0,
        friendAddress
      )

    expect(await dao.containsPermitted(signers[3].address)).to.eq(false)
  })

  it('Function Call With Value', async () => {
    const paybleFunctionContract = await new PayableFunction__factory(
      signers[0]
    ).deploy()

    expect(
      await ethers.provider.getBalance(paybleFunctionContract.address)
    ).to.eq(0)

    await signers[0].sendTransaction({
      to: dao.address,
      value: parseEther('0.05')
    })

    const timestamp = dayjs().unix()

    const VOTING = {
      target: paybleFunctionContract.address,
      data: createData('hello', ['uint256'], [123]),
      value: parseEther('0.02'),
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
    ).to.changeEtherBalances(
      [dao, paybleFunctionContract],
      [parseEther('-0.02'), parseEther('0.02')]
    )
  })

  it('Revert Adapter Duplicates and Length Mismatch', async () => {
    const adapter = await new Adapter__factory(signers[0]).deploy()

    const timestamp = dayjs().unix()

    let VOTING = {
      target: dao.address,
      data: createData('addAdapter', ['address'], [adapter.address]),
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

    VOTING = {
      target: auction.address,
      data: createData('createGovToken', ['string', 'string'], ['EgorLP', 'ELP']),
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
    ).to.emit(auction, 'GovTokenCreated')

    expect(await dao.govToken()).to.not.eq(constants.AddressZero)

    const govToken = GovToken__factory.connect(await dao.govToken(), signers[0])

    const goldToken = await new Token__factory(signers[0]).deploy()

    VOTING = {
      target: auction.address,
      data: createData(
        'createPrivateOffer',
        ['address', 'address', 'uint256', 'uint256'],
        [ownerAddress, goldToken.address, 0, 10]
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

    await dao.execute(
      VOTING.target,
      VOTING.data,
      VOTING.value,
      VOTING.nonce,
      VOTING.timestamp,
      [sig]
    )

    await auction.buyPrivateOffer(dao.address, 0)

    // await expect(govToken.burn(0, [])).to.be.revertedWith('DAO: duplicates are prohibited (adapters)')

    // await expect(govToken.burn(0, [])).to.be.revertedWith('DAO: adapters error')
  })

  it('Move and Burn', async () => {
    const timestamp = dayjs().unix()

    const friendAddress = signers[1].address

    expect(await dao.balanceOf(ownerAddress)).to.eq(10)

    expect(await dao.balanceOf(friendAddress)).to.eq(0)

    let VOTING = {
      target: dao.address,
      data: createData(
        'move',
        ['address', 'address', 'uint256'],
        [ownerAddress, friendAddress, 10]
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

    expect(await dao.balanceOf(ownerAddress)).to.eq(0)

    expect(await dao.balanceOf(friendAddress)).to.eq(10)

    VOTING = {
      target: dao.address,
      data: createData('burn', ['address', 'uint256'], [friendAddress, 5]),
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

    sig = await signers[1].signMessage(txHash)

    expect(verifyMessage(txHash, sig)).to.eq(friendAddress)

    await dao
      .connect(signers[1])
      .execute(
        VOTING.target,
        VOTING.data,
        VOTING.value,
        VOTING.nonce,
        VOTING.timestamp,
        [sig]
      )

    expect(await dao.balanceOf(ownerAddress)).to.eq(0)

    expect(await dao.balanceOf(friendAddress)).to.eq(5)
  })

  it('Send Value', async () => {
    await signers[0].sendTransaction({
      to: dao.address,
      value: parseEther('0.05')
    })

    const friendAddress = signers[1].address

    const timestamp = dayjs().unix()

    const VOTING = {
      target: friendAddress,
      data: '0x',
      value: parseEther('0.01'),
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
    ).to.changeEtherBalances(
      [dao, signers[1]],
      [parseEther('-0.01'), parseEther('0.01')]
    )
  })
})
