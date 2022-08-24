import { BigNumber } from '@ethersproject/bignumber'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { constants } from 'ethers'
import { parseEther, verifyMessage } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import {Activity, Activity__factory } from '../../typechain-types'

import { createData, createTxHash } from '../utils'

describe('Activity', () => {
  let activity: Activity

  let activity__factory: Activity__factory

  let signers: SignerWithAddress[]

  let ownerAddress: string

  beforeEach(async () => {
    signers = await ethers.getSigners()

    ownerAddress = signers[0].address

    activity = await new Activity__factory(signers[0]).deploy()

    const timestamp = dayjs().unix()

  })

  it('should deploy', async () => {
    expect(activity.address).to.not.be.undefined
  })


  it('Activity Create', async () => {

  })

  it('Activity Start', async () => {

})

  it('Activity Claimed', async () => {
    const timestamp = dayjs().unix()

    const friendAddress = signers[1].address
 
  })
})
