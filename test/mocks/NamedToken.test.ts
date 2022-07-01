import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import { NamedToken__factory } from '../../typechain-types'

describe('NamedToken', () => {
  it('Successful Deploy', async () => {
    const namedToken = await new NamedToken__factory(
      (
        await ethers.getSigners()
      )[0]
    ).deploy('Egor', 'EGOR')

    expect(await namedToken.balanceOf((await ethers.getSigners())[0].address))
      .to.eq(await namedToken.totalSupply())
      .to.eq(parseEther('100'))
  })
})
