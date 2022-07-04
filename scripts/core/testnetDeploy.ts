import * as dotenv from 'dotenv'
import { ethers, run } from 'hardhat'

import {
  DaoViewer__factory,
  Factory__factory,
  Auction__factory,
} from '../../typechain-types'

dotenv.config()

async function main() {
  const signers = await ethers.getSigners()

  const auction = await new Auction__factory(signers[0]).deploy()

  await auction.deployed()

  console.log('Auction:', auction.address)

  const factory = await new Factory__factory(signers[0]).deploy()

  await factory.deployed()

  console.log('Factory:', factory.address)

  console.log('Setting Factory Address to Auction')

  const tx = await auction.setFactory(factory.address)

  await tx.wait()

  console.log('Success: Setting Factory Address to Auction')

  const daoViewer = await new DaoViewer__factory(signers[0]).deploy()

  await daoViewer.deployed()

  console.log('Dao Viewer:', daoViewer.address)

  try {
    await run('verify:verify', {
      address: auction.address,
      contract: 'contracts/core/Auction.sol:Auction'
    })
  } catch {
    console.log('Verification problem (Auction)')
  }


  try {
    await run('verify:verify', {
      address: factory.address,
      constructorArguments: [auction.address],
      contract: 'contracts/core/Factory.sol:Factory'
    })
  } catch {
    console.log('Verification problem (Factory)')
  }

  try {
    await run('verify:verify', {
      address: daoViewer.address,
      contract: 'contracts/viewers/DaoViewer.sol:DaoViewer'
    })
  } catch {
    console.log('Verification problem (DaoViewer)')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
