import * as dotenv from 'dotenv'
import { parseEther } from 'ethers/lib/utils'
import { ethers, network } from 'hardhat'

import {
  DaoViewer__factory,
  Factory__factory,
  NamedToken__factory,
  Shop__factory,
  Xspace__factory
} from '../../typechain-types'

dotenv.config()

async function main() {
  await network.provider.request({ method: 'hardhat_reset', params: [] })

  const signers = await ethers.getSigners()

  const shop = await new Shop__factory(signers[0]).deploy()

  console.log('Shop:', shop.address)

  const XspaceToken = await new Xspace__factory(signers[0]).deploy()

  console.log('Xspace Token:', XspaceToken.address)

  const factory = await new Factory__factory(signers[0]).deploy(
    shop.address,
    XspaceToken.address
  )

  console.log('Factory:', factory.address)

  console.log('Setting Factory Address to Shop')

  await shop.setFactory(factory.address)

  console.log('Success: Setting Factory Address to Shop')

  const daoViewer = await new DaoViewer__factory(signers[0]).deploy()

  console.log('Dao Viewer:', daoViewer.address)

  await factory.create(
    'AloneDAO',
    'ALONE',
    51,
    [signers[0].address],
    [parseEther('10')]
  )

  console.log('Deployed DAO')

  const usdc = await new NamedToken__factory(signers[0]).deploy('USDC', 'USDC')

  console.log('USDC Token:', usdc.address)

  console.log('Done')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
