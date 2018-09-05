'use strict';

const Big = require('big.js');
const defaultParsers = require(__dirname + '/node/default-parsers');
const BitCache = require(__dirname + '/node/BitCache');

const symbols =
{
	parent: Symbol(),
};

class BinaryParser
{
	/* Attributes:
	- parsers: {},
	- bitCache: BitCache,
	*/

	constructor(definition, parsers = null)
	{
		this.parsers = defaultParsers.create(this);
		if(parsers && typeof (parsers) === 'object')
			Object.assign(this.parsers, parsers);
		
		this.readStructs(definition);
	}

	parse(data, type)
	{
		this.bitCache = new BitCache(data);

		let parse = this.getParser(type);
		let parsed = parse();

		return parsed;
	}

	readStructs(root)
	{
		let parsers = this.parsers;

		for(let [name, struct] of Object.entries(root))
			this.parsers[name] = this.readStruct(struct);
	}
	readStruct(struct)
	{
		let parsers = Object.entries(struct)
			.map(([name, type]) => [name, this.getParser(type)]);

		return (parent) =>
		{
			let obj =
			{
				[symbols.parent]: parent,
			};

			for(let [name, parser] of parsers)
				obj[name] = parser(obj);

			return obj;
		};
	}
	getParser(val)
	{
		if(Array.isArray(val))
		{
			let [parserName, ...args] = val;
			return (that) =>
			{
				parserName = this.resolve(parserName, that);
				let parser = this.getParser(parserName);

				return parser(that, ...args);
			};
		}

		switch(typeof(val))
		{
			case 'string':
				let parser = this.parsers[val];
				if(parser)
					return parser;
				break;
			case 'number':
				return (that) => this.parsers.int.call(that, that, val);
			case 'function':
				return this.getParser([val]);
			case 'object':
				return this.readStruct(val);
		}

		throw new Error(`No parser found for '${JSON.stringify(val)}'`);
	}


	read(bits)
	{
		let bitCache = this.bitCache;

		if(bits === 0 || isNaN(bits))
			return bitCache.readBytesEnd();
		if(bits % 8 === 0)
			return bitCache.readBytes(bits / 8);
		

		let leadingBits = bits % 8;
		let leading = bitCache.read(leadingBits);
		leading = Buffer.from([leading]);

		let byteCount = Math.floor(bits / 8);
		let bytes = bitCache.readBytes(byteCount);

		return Buffer.concat([leading, bytes]);
	}

	readInt(bits, { endian, signed } = {})
	{
		let bigEndian = endian !== 'le' && endian !== 'little' && endian !== 'l' && endian !== false && endian !== 'false' && endian !== '0' && endian !== 0;
		signed = signed !== 'unsigned' && signed !== 'u' && signed !== '0' && signed !== 0 && signed !== 'false' && signed !== false;

		let value = 0;
		let buffer = this.read(bits);
		let signBit = signed && stripSignBit();

		let bignum = bits > 51;
		if(bignum)
		{
			value = new Big(0);
			appendByte = appendByteBig;
			applySign = applySignBig;
		}


		if(bigEndian)
		{
			for(let i = 0; i < buffer.length; ++i)
				appendByte(buffer[i]);
		}
		else
		{
			for(let i = buffer.length - 1; i >= 0; --i)
				appendByte(buffer[i]);
		}

		if(signBit)
			applySign();

		return value;


		function appendByte(byte)
		{
			value = (value << 8) | (byte & 0xFF);
		}
		function stripSignBit()
		{
			let signByteIdx = bigEndian ? 0 : buffer.length - 1;
			let signByte = buffer[signByteIdx];
			let signBitIdx = (bits - 1) % 8;
			let signBit = signByte >> signBitIdx;

			signByte &= 2 ** signBitIdx - 1;
			buffer[signBitIdx] = signByte;

			return signBit;
		}
		function applySign()
		{
			value -= 2 ** (bits - 1);
		}

		function appendByteBig(byte)
		{
			value = value.times(0x100).plus(byte);
		}
		function applySignBig()
		{
			value = value.minus(2 ** (bits - 1));
		}
	}
	readString(that, { length, encoding })
	{
		length = this.resolve(length, that);
		encoding = this.resolve(encoding, that);

		encoding = encoding || 'ascii';

		let buffer = this.read(length * 8);
		return buffer.toString(encoding);
	}
	readFloat()
	{
		let buffer = this.read(32);
		return buffer.readFloat();
	}
	readDouble()
	{
		let buffer = this.read(64);
		return buffer.readDouble();
	}

	readArray(that, { type, length })
	{
		type = this.resolve(type, that);
		length = this.resolve(length, that);

		if(length && typeof(length) !== 'number')
			throw new Error(`Length parameter must be a number`);

		let infinite = !length;

		let parse = this.getParser(type);

		let parsed = [];
		if(infinite)
		{
			while(!bitCache.endReached)
				readPiece();
		}
		else
		{
			for(let i = 0; i < length; ++i)
				readPiece();
		}

		return parsed;

		function readPiece()
		{
			let parsedPiece = parse(that);
			parsed.push(parsedPiece);
		}
	}
	readBuffer(that, length)
	{
		length = this.resolve(length, that);
		if(length && typeof(length) !== 'number')
			throw new Error(`Length parameter must be a number`);

		if(!length)
			return this.bitCache.readBytesEnd();

		return this.bitCache.readBytes(length);
	}

	readBits(that, length)
	{
		length = this.resolve(length, that);
		if(length && typeof (length) !== 'number')
			throw new Error(`Length parameter must be a number`);
		
		if(!length)
			return this.bitCache.readBitsEnd();
		
		return this.bitCache.readBits(length);
	}


	resolve(val, that)
	{
		while(typeof(val) === 'function')
			val = val.call(that, that);

		return val;
	}
}

BinaryParser.symbols = symbols;
BinaryParser.BitCache = BitCache;

module.exports = BinaryParser;
