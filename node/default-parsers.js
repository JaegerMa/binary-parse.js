'use strict';

function create(binaryParse)
{
	let _ = binaryParse;

	let parsers =
	{
		int: (that, bits, endian, signed) => _.readInt(bits, { endian, signed }),
		byte: () => _.readInt(8, { signed: false }),
		int8: () => _.readInt(8, { signed: true }),
		uint8: () => _.readInt(8, { signed: false }),
		int16: () => _.readInt(16, { endian: 'be', signed: true }),
		int16be: () => _.readInt(16, { endian: 'be', signed: true }),
		int16le: () => _.readInt(16, { endian: 'le', signed: true }),
		uint16: () => _.readInt(16, { endian: 'be', signed: false }),
		uint16be: () => _.readInt(16, { endian: 'be', signed: false }),
		uint16le: () => _.readInt(16, { endian: 'le', signed: false }),
		int32: () => _.readInt(32, { endian: 'be', signed: true }),
		int32be: () => _.readInt(32, { endian: 'be', signed: true }),
		int32le: () => _.readInt(32, { endian: 'le', signed: true }),
		uint32: () => _.readInt(32, { endian: 'be', signed: false }),
		uint32be: () => _.readInt(32, { endian: 'be', signed: false }),
		uint32le: () => _.readInt(32, { endian: 'le', signed: false }),
		int64: () => _.readInt(64, { endian: 'be', signed: true }),
		int64be: () => _.readInt(64, { endian: 'be', signed: true }),
		int64le: () => _.readInt(64, { endian: 'le', signed: true }),
		uint64: () => _.readInt(64, { endian: 'be', signed: false }),
		uint64be: () => _.readInt(64, { endian: 'be', signed: false }),
		uint64le: () => _.readInt(64, { endian: 'le', signed: false }),
		float: () => _.readFloat(),
		double: () => _.readDouble(),
		string: (that, length, encoding) => _.readString(that, { length, encoding }),
		utf8String: (that, length) => _.readString({ length, encoding: 'utf8' }),
		utf16LEString: (that, length) => _.readString({ length, encoding: 'utf16le' }),
		base64String: (that, length) => _.readString({ length, encoding: 'base64' }),
		hexString: (that, length) => _.readString({ length, encoding: 'hex' }),
		array: (that, type, length) => _.readArray(that, { type, length }),
		buffer: (that, length) => _.readBuffer(that, length),
		bits: (that, length) => _.readBits(that, length),
		fixed: (that, fixed) => this.resolve(fixed, that),
	};

	return parsers;
}

create.create = create;

module.exports = create;
