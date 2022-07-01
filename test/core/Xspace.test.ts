import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import { Xspace__factory } from '../../typechain-types'

describe('Xspace', () => {
  it('Successful Deploy', async () => {
    const Xspace = await new Xspace__factory(
      (
        await ethers.getSigners()
      )[0]
    ).deploy()

    expect(await Xspace.balanceOf((await ethers.getSigners())[0].address))
      .to.eq(await Xspace.totalSupply())
      .to.eq(parseEther('1000000000'))
  })
})
