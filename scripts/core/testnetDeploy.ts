import * as dotenv from 'dotenv'
import { ethers, run } from 'hardhat'

import {
  DaoViewer__factory,
  Factory__factory,
  Auction__factory,
  ExitModule__factory,
  OffchainVotingModule__factory,
  Dao__factory
} from '../../typechain-types'

dotenv.config()

async function main() {
  const signers = await ethers.getSigners()


  const factory = await new Factory__factory(signers[0]).deploy()

  const auction = await new Auction__factory(signers[0]).deploy()

  const exitModule = await new ExitModule__factory(signers[0]).deploy()

  const offchainVotingModule = await new OffchainVotingModule__factory(signers[0]).deploy()

  await auction.deployed()

  await factory.deployed()

  const tx = await auction.setFactory(factory.address)

  await tx.wait()

  const tx1 = await factory.setupAuction(factory.address) // 0xa2898CE12595fCC02729475FA1056c6775FA70B4

  await tx1.wait()

  const dao  = await new Dao__factory(signers[0]).deploy("TestDao", 'TDAO', 51, [signers[0].address], [1])
  await dao.deployed()

  console.log('Success: Setting Factory Address to Auction')


  await exitModule.deployed()

  await offchainVotingModule.deployed()


  const daoViewer = await new DaoViewer__factory(signers[0]).deploy()

  await daoViewer.deployed()

  try {
    await run('verify:verify', {
      address: auction.address,
      contract: 'contracts/core/Auction.sol:Auction'
    })
  } catch(ex) {
    console.log('Verification problem (Auction)', ex)
  }


  try {
    await run('verify:verify', {
      address: factory.address,
      contract: 'contracts/core/Factory.sol:Factory'
    })
  } catch(ex) {
    console.log('Verification problem (Factory)', ex)
  }

  try {
    await run('verify:verify', {
      address: exitModule.address,
      contract: 'contracts/modules/ExitModule.sol:ExitModule'
    })
  } catch(ex) {
    console.log('Verification problem (ExitModule)', ex)
  }

  try {
    await run('verify:verify', {
      address: offchainVotingModule.address,
      contract: 'contracts/modules/OffchainVotingModule.sol:OffchainVotingModule'
    })
  } catch(ex) {
    console.log('Verification problem (OffchainVotingModule)', ex)
  }


  try {
    await run('verify:verify', {
      address: daoViewer.address,
      contract: 'contracts/viewers/DaoViewer.sol:DaoViewer'
    })
  } catch(ex) {
    console.log('Verification problem (DaoViewer)', ex)
  }


  try {
    await run('verify:verify', {
      address: dao.address,
      constructorArguments: ["TestDao", 'TDAO', 51, [signers[0].address], [1]],
      contract: 'contracts/caore/Dao.sol:Dao'
    })
  } catch(ex) {
    console.log('Verification problem (Dao)', ex)
  }


  console.log('Factory:', factory.address)
  console.log('Auction:', auction.address)
  console.log('ExitModule:', exitModule.address)
  console.log('OffchainVotingModule:', offchainVotingModule.address)
  console.log('TestDao:', dao.address)

  console.log('DaoViewer:', daoViewer.address)
  

  // console.log('Auction:', auction.address)
  // console.log('Factory:', factory.address)
  console.log('owner:', signers[0].address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
