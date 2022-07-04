import * as dotenv from 'dotenv'
import { ethers, run } from 'hardhat'

import { ExitModule__factory } from '../../typechain-types'

dotenv.config()

async function main() {
  const signers = await ethers.getSigners()

  const ExitModule = await new ExitModule__factory(
    signers[0]
  ).deploy()

  await ExitModule.deployed()

  console.log('ExitModule:', ExitModule.address)

  try {
    await run('verify:verify', {
      address: ExitModule.address,
      contract: 'contracts/modules/ExitModule.sol:ExitModule'
    })
  } catch {
    console.log('Verification problem (ExitModule)')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
