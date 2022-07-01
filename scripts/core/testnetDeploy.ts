import * as dotenv from 'dotenv'
import { ethers, run } from 'hardhat'

import {
  DaoViewer__factory,
  Factory__factory,
  Shop__factory,
  Xspace__factory
} from '../../typechain-types'

dotenv.config()

async function main() {
  const signers = await ethers.getSigners()

  const shop = await new Shop__factory(signers[0]).deploy()

  await shop.deployed()

  console.log('Shop:', shop.address)

  const XspaceToken = await new Xspace__factory(signers[0]).deploy()

  await XspaceToken.deployed()

  console.log('Xspace Token:', XspaceToken.address)

  const factory = await new Factory__factory(signers[0]).deploy(
    shop.address,
    XspaceToken.address
  )

  await factory.deployed()

  console.log('Factory:', factory.address)

  console.log('Setting Factory Address to Shop')

  const tx = await shop.setFactory(factory.address)

  await tx.wait()

  console.log('Success: Setting Factory Address to Shop')

  const daoViewer = await new DaoViewer__factory(signers[0]).deploy()

  await daoViewer.deployed()

  console.log('Dao Viewer:', daoViewer.address)

  try {
    await run('verify:verify', {
      address: shop.address,
      contract: 'contracts/core/Shop.sol:Shop'
    })
  } catch {
    console.log('Verification problem (Shop)')
  }

  try {
    await run('verify:verify', {
      address: XspaceToken.address,
      contract: 'contracts/core/Xspace.sol:Xspace'
    })
  } catch {
    console.log('Verification problem (Xspace Token)')
  }

  try {
    await run('verify:verify', {
      address: factory.address,
      constructorArguments: [shop.address, XspaceToken.address],
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
