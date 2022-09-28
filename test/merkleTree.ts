import { ethers } from 'hardhat'

type AddressData = {
  recipient: string;
  tokenAddress: string;
  tokenAmount: number;
};

type LeafProps = {
  distributor: string,
  activityId: number,
  index: number;
  recipient: string;
  tokenAddress: string;
  tokenAmount: number;
};

class MerkleTree {
  recipients: AddressData[];
  leaves: string[];
  layers: string[][];

  distributor: string;
  activityId: number;
  tokenAddress: string;

  // recipients:

  constructor(distributor: string, activityId: number, tokenAddress: string,  addresses: AddressData[]) {
    this.recipients = addresses;
    this.distributor = distributor;
    this.activityId = activityId;
    this.tokenAddress = tokenAddress;

    this.leaves = this.getLeaves();
    this.layers = this.getLayers(this.leaves);
  }

  hash(_distributor: string, _activityId: number, _index: number, _recipient: string, _tokenAddress: string, _tokenAmount: number): string {

    return ethers.utils.solidityKeccak256(
      ['address', 'uint256', 'uint256', 'address', 'address', 'uint256'],
      [_distributor, _activityId, _index, _recipient, _tokenAddress, _tokenAmount],
    );
  }

  expandLeaves(): LeafProps[] {
    // let addresses = Object.keys(this.recipients);
    let addresses = this.recipients

    // 升序排序
    addresses.sort(function (a, b) {
      
      let al = a.recipient.toLowerCase();
      let bl = a.recipient.toLowerCase();

      if (al < bl) {
        return -1;
      }
      if (al > bl) {
        return 1;
      }
      return 0;
    });

    // 展开叶子节点， index: 序号， address: 接收地址  events: 事件
    return addresses.map((obj, i) => {
      return {
        distributor: this.distributor,
        activityId: this.activityId,
        index: i,
        recipient: obj.recipient,
        tokenAddress: obj.tokenAddress,
        tokenAmount: obj.tokenAmount,
      };
    });
  }

  getLeaves(): string[] {
    let leaves = this.expandLeaves();
    let _hash = this.hash;
    return leaves.map(function (leaf) {
      // _distributor: string, _activityId: number, _index: number, _recipient: string, _tokenAddress: string, _tokenAmount: number
      // return _hash(leaf.index, leaf.address, leaf.events);
      return _hash(leaf.distributor, leaf.activityId, leaf.index, leaf.recipient, leaf.tokenAddress, leaf.tokenAmount);
    });
  }

  getLayers(elements: any): string[][] {
    if (elements.length === 0) {
      return [['']];
    }

    const layers = [];
    layers.push(elements);

    // Get next layer until we reach the root
    // Ask if the last element of layers has more than one element
    let ctr = 0;
    while (layers[layers.length - 1].length > 1) {
      // Send the last layer
      let nextLayer = this.getNextLayer(layers[layers.length - 1]);
      layers.push(nextLayer);
      ctr += 1;
    }

    return layers;
  }

  getNextLayer(leaves: any): string[] {
    let layer = [];
    let elements = [...leaves];
    while (elements.length) {
      // 首先 升序排列，然后再计算 hash
      let left = elements.shift();
      if (elements.length > 0) {
        let right = elements.shift();
        let params = left < right ? [left, right] : [right, left];
        layer.push(ethers.utils.solidityKeccak256(['bytes32', 'bytes32'], params));
      } else {
        layer.push(left);
      }
    }
    return layer;
  }

  getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(index: number): string[] {
    if (index > Object.keys(this.recipients).length - 1) {
      throw new Error('Element does not exist in Merkle tree');
    }

    return this.layers.reduce((proof, layer) => {
      const pairElement = this.getPairElement(index, layer);

      if (pairElement) {
        proof.push(pairElement);
      }

      index = Math.floor(index / 2);

      return proof;
    }, []);
  }

  getPairElement(idx: number, layer: any): string | null {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

    if (pairIdx < layer.length) {
      return layer[pairIdx];
    } else {
      return null;
    }
  }
}

export default MerkleTree;
