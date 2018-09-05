'use strict';

class BitCache
{
	/* Attributes:
	- cache: int
	- cacheLength: int
	- data: Buffer | byte[]
	- dataCursor: int
	- appendings: (Buffer | byte[])[]
	*/

	constructor(...data)
	{
		this.cache = 0;
		this.cacheLength = 0;
		this.appendings = [];

		this.append(...data);
	}

	get cacheLength()
	{
		return this._cacheLength;
	}
	set cacheLength(val)
	{
		this._cacheLength = val;
		this.trimCache();
	}

	read(length)
	{
		if(this.cacheLength === 0 && length % 8 === 0)
			return this.readRaw(length / 8);

		while(this.cacheLength < length)
			this.fillCache();

		let shift = this.cacheLength - length;
		let value = (this.cache >>> shift) & (2 ** length - 1);

		this.cacheLength -= length;

		return value;
	}
	readRaw(bytes)
	{
		let remainingBytes = bytes;

		let dataPieces = [];
		while(remainingBytes > 0)
		{
			while(!this.isDataLeft())
				this.moveDataCollectionCursor();

			let dataPiece = this.data.slice(this.dataCursor, this.dataCursor + remainingBytes);
			dataPieces.push(dataPiece);

			this.dataCursor += dataPiece.length;
			remainingBytes -= dataPiece.length;
		}

		let buffer = dataPieces.length > 1 ? Buffer.concat(dataPieces) : dataPieces[0];

		return buffer.readUIntBE(0, bytes);
	}
	readBytes(bytes)
	{
		if(this.cacheLength === 0)
			return this.readBytesRaw(bytes);

		let buffer = Buffer.alloc(bytes);

		for(let i = 0; i < bytes; ++i)
			buffer[i] = this.read(8);

		return buffer;
	}
	readBytesRaw(bytes)
	{
		if(this.cacheLength !== 0)
			return this.readBytes(bytes);

		let dataPieces = [];
		while(bytes)
		{
			while(!this.isDataLeft())
				this.moveDataCollectionCursor();

			let dataPiece = this.data.slice(this.dataCursor, this.dataCursor + bytes);
			dataPieces.push(dataPiece);

			this.dataCursor += dataPiece.length;
			bytes -= dataPiece.length;
		}

		let buffer = Buffer.concat(dataPieces);
		return buffer;
	}

	readBytesEnd()
	{
		if(this.cacheLength === 0)
			return this.readBytesEndRaw();

		let data = [];
		while(!this.endReached)
			data.push(this.read(8));

		return Buffer.from(data);
	}
	readBytesEndRaw()
	{
		if(this.cacheLength !== 0)
			return this.readBytesEnd();

		let dataPieces = [];
		while(!this.endReached)
		{
			while(!this.isDataLeft())
				this.moveDataCollectionCursor();
			
			if(this.dataCursor === 0)
				dataPieces.push(this.data);
			else
				dataPieces.push(this.data.slice(this.dataCursor));

			this.dataCursor = -1;
		}

		let buffer = Buffer.concat(dataPieces);
		return buffer;
	}


	append(...data)
	{
		if(data.length === 0)
			return;
		if(data.length > 1)
		{
			data.forEach(this.append.bind(this));
			return;
		}

		data = data[0];
		data = toBuffer(data);
		if(!data || !data.length)
			return;
		
		this.appendings.push(data);
	}
	prependBits(data, length)
	{
		this.cache |= (data << this.cacheLength);
		this.cacheLength += length;
	}


	fillCache()
	{
		while(!this.isDataLeft())
			this.moveDataCollectionCursor();

		let byte = this.data[this.dataCursor];
		++this.dataCursor;

		this.fillCacheFrom({ data: byte, length: 8 });
	}	
	fillCacheFrom({ data, length })
	{
		data &= 2 ** length - 1;
		this.cache = (this.cache << length) | data;
		this.cacheLength += length;
	}
	fillCacheEnd()
	{
		while(this.isDataLeft() || this.isAppendingLeft())
			this.fillCache();
	}

	trimCache()
	{
		this.cache &= 2 ** this.cacheLength - 1;
	}

	moveDataCollectionCursor()
	{
		if(!this.isAppendingLeft())
			throw new Error('No data left');

		this.data = this.appendings.shift();
		this.dataCursor = 0;
	}

	get totalBitsLeft()
	{
		return this.cacheLength
			+ (this.data ? this.data.length - this.dataCursor : 0) * 8
			+ this.appendings.map((data) => data.length).reduce((total, val) => total + val, 0) * 8;
	}
	isDataLeft()
	{
		return this.data && this.dataCursor >= 0 && this.dataCursor < this.data.length;
	}
	isAppendingLeft()
	{
		return this.appendings.length;
	}
	get endReached()
	{
		return this.cacheLength <= 0 && !this.isDataLeft() && !this.isAppendingLeft();
	}
}

function toBuffer(data)
{
	if(data instanceof Buffer)
		return data;

	if(data === undefined || data === null)
		return;

	if(Array.isArray(data))
		return Buffer.from(data);	
	
	if(typeof(data) === 'symbol')
		return;

	if(data.buffer instanceof Buffer)
		return data.buffer;

	if(typeof(data) === 'object')
		return toBuffer(Array.from(data));

	if(typeof(data) === 'number' || typeof(data) === 'boolean')
		return Buffer.from([data]);

	return Buffer.from(data);
}

module.exports = BitCache;
