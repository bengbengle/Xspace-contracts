import { parseEther } from '@ethersproject/units'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { XspacePeg__factory } from '../../typechain-types'

describe('XspacePeg', () => {
  it('Mint & Burn', async () => {
    const signers = await ethers.getSigners()

    const [owner, friend] = await Promise.all([
      signers[0].address,
      signers[1].address
    ])

    const XspacePeg = await new XspacePeg__factory(signers[0]).deploy()

    expect(await XspacePeg.balanceOf(owner))
      .to.eql(await XspacePeg.balanceOf(friend))
      .to.eql(await XspacePeg.totalSupply())
      .to.eql(ethers.constants.Zero)

    await XspacePeg.mint(owner, parseEther('1.23'))

    expect(await XspacePeg.balanceOf(owner))
      .to.eql(await XspacePeg.totalSupply())
      .to.eql(parseEther('1.23'))

    await XspacePeg.mint(friend, parseEther('2.34'))

    expect(await XspacePeg.balanceOf(friend))
      .to.eql((await XspacePeg.totalSupply()).sub(parseEther('1.23')))
      .to.eql(parseEther('2.34'))

    await expect(
      XspacePeg.connect(signers[1]).mint(owner, parseEther('1'))
    ).to.be.revertedWith('Ownable: caller is not the owner')

    await XspacePeg.burn(parseEther('0.12'))

    expect(await XspacePeg.balanceOf(owner))
      .to.eql((await XspacePeg.totalSupply()).sub(parseEther('2.34')))
      .to.eql(parseEther('1.23').sub(parseEther('0.12')))

    await XspacePeg.connect(signers[1]).burn(parseEther('0.16'))

    expect(await XspacePeg.balanceOf(friend))
      .to.eql(
        (await XspacePeg.totalSupply())
          .sub(parseEther('1.23'))
          .add(parseEther('0.12'))
      )
      .to.eql(parseEther('2.34').sub(parseEther('0.16')))
  })
})
