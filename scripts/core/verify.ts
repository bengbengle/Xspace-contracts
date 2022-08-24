
import * as dotenv from 'dotenv'
import { ethers, run } from 'hardhat'

dotenv.config()

async function main() {
    const signers = await ethers.getSigners()
 

    const Factory = "0x2868E8319520b9dd46CE4cdA0F0993723078e71B"
    const OffchainVotingModule = "0xacB067462787A339845b02413EcD1b1F896b6fF1"
    const TestDao1 = "0x27B49bC7aCcefA7E4655c96060041fFce1bef876"
    const TestDao2 = "0x0261fd62da419830693d4b94c8272dbd9149d9f0"

    const Auction = "0x2bcaE18d24B694Bbb4eFE099Ce9B941441AF524D"
    const ExitModule = "0xb15b4741E8Eb0061cDD92259293b357B881Db9E2"
    const DaoViewer = "0xc43Ee3a0F4dF05Ef9a8F18abe5f71B7cCC508AfA"
    const owner = "0xa2898CE12595fCC02729475FA1056c6775FA70B4"

  // try {
  //   await run('verify:verify', {
  //     address: Auction,
  //     contract: 'contracts/core/Auction.sol:Auction'
  //   })
  // } catch(ex) {
  //   console.log('Verification problem (Auction)', ex)
  // }


  // try {
  //   await run('verify:verify', {
  //     address: Factory,
  //     contract: 'contracts/core/Factory.sol:Factory'
  //   })
  // } catch(ex) {
  //   console.log('Verification problem (Factory)', ex)
  // }

  // try {
  //   await run('verify:verify', {
  //     address: ExitModule,
  //     contract: 'contracts/modules/ExitModule.sol:ExitModule'
  //   })
  // } catch(ex) {
  //   console.log('Verification problem (ExitModule)', ex)
  // }

  // try {
  //   await run('verify:verify', {
  //     address: OffchainVotingModule,
  //     contract: 'contracts/modules/OffchainVotingModule.sol:OffchainVotingModule'
  //   })
  // } catch(ex) {
  //   console.log('Verification problem (OffchainVotingModule)', ex)
  // }


  // try {
  //   await run('verify:verify', {
  //     address: DaoViewer,
  //     contract: 'contracts/viewers/DaoViewer.sol:DaoViewer'
  //   })
  // } catch(ex) {
  //   console.log('Verification problem (DaoViewer)', ex)
  // }


  // try {
  //   await run('verify:verify', {
  //     address: TestDao,
  //     constructorArguments: ["TestDao", "TDAO", 51, [owner], [1]],
  //     contract: 'contracts/core/Dao.sol:Dao'
  //   })
  // } catch(ex) {
  //   console.log('Verification problem (Dao)', ex)
  // }


}

// const verify_activity = async() => {
//   const Activity = "0x2868E8319520b9dd46CE4cdA0F0993723078e71B"
//    try {
//     await run('verify:verify', {
//       address: Activity,
//       contract: 'contracts/activity/Activity.sol:Activity'
//     })
//   } catch(ex) {
//     console.log('Verification problem (Dao)', ex)
//   }
// }

// verify_activity()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error)
//     process.exit(1)
//   })
