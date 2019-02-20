'use strict';

class LimitedBitCache
{
	/* Attributes:
	- parent: BitCache
	- bitLimit: int, max bits that can be read from this BitCache
	- bitsRead: int
	*/

	constructor(parentBitCache, bitLimit)
	{
		this.parent = parentBitCache;
		this.bitLimit = bitLimit;
		this.bitsRead = 0;
	}


	get totalBitsLeft()
	{
		return Math.min(this.limitedBitsLeft, this.parent.totalBitsLeft);
	}
	get limitedBitsLeft()
	{
		return this.bitLimit - this.bitsRead;
	}
	get endsWithParent()
	{
		return this.limitedBitsLeft === this.parent.totalBitsLeft;
	}
	get endReached()
	{
		return this.limitedBitsLeft <= 0 || this.parent.endReached;
	}
	isDataLeft()
	{
		return this.limitedBitsLeft > 0 && this.parent.isDataLeft();
	}
	isAppendingLeft()
	{
		return this.parent.isAppendingLeft();
	}



	read(length)
	{
		if(length < 0)
			return;
		if(this.bitsRead + length > this.bitLimit)
			throw new Error('No data left');

		
		let bytes = this.parent.read(length);
		this.bitsRead += length;
		
		return bytes;
	}
	readBytes(byteCount)
	{
		if(byteCount < 0)
			return;
		if(this.bitsRead + (byteCount * 8) > this.bitLimit)
			throw new Error('No data left');
		

		let bytes = this.parent.readBytes(byteCount);
		this.bitsRead += byteCount * 8;

		return bytes;
	}
	readBits(bitCount)
	{
		if(bitCount < 0)
			return;
		if(this.bitsRead + bitCount > this.bitLimit)
			throw new Error('No data left');
		

		let bits = this.parent.readBits(bitCount);
		this.bitsRead += bitCount;

		return bits;
	}

	readBytesEnd()
	{
		let bytes;
		if(this.endsWithParent)
		{
			bytes = this.parent.readBytesEnd();
		}
		else
		{
			let bitsLeft = this.totalBitsLeft;
			if(bitsLeft % 8 !== 0)
				throw new Error('No data left');

			bytes = this.parent.readBytes(bitsLeft / 8);
		}
		
		this.bitsRead += bytes.length * 8;


		return bytes;
	}
	readBitsEnd()
	{
		if(this.endsWithParent)
			bits = this.parent.readBitsEnd();
		else
			bits = this.parent.readBits(this.totalBitsLeft);
		
		this.bitsRead += bits.length;

		
		return bits;
	}

	skipToEnd()
	{
		if(this.totalBitsLeft === 0)
			return;
		
		this.parent.readBits(this.totalBitsLeft);
	}
}


module.exports = LimitedBitCache;
