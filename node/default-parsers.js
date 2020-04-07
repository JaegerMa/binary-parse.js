'use strict';

function create(binaryParse)
{
	let _ = binaryParse;

	let parsers =
	{
		int: (that, bits, endian, signed) => _.readInt(that, { bits, endian, signed }),
		byte: (that) => _.readInt(that, { bits: 8, signed: false }),
		int8: (that) => _.readInt(that, { bits: 8, signed: true }),
		uint8: (that) => _.readInt(that, { bits: 8, signed: false }),
		int16: (that) => _.readInt(that, { bits: 16, endian: 'be', signed: true }),
		int16be: (that) => _.readInt(that, { bits: 16, endian: 'be', signed: true }),
		int16le: (that) => _.readInt(that, { bits: 16, endian: 'le', signed: true }),
		uint16: (that) => _.readInt(that, { bits: 16, endian: 'be', signed: false }),
		uint16be: (that) => _.readInt(that, { bits: 16, endian: 'be', signed: false }),
		uint16le: (that) => _.readInt(that, { bits: 16, endian: 'le', signed: false }),
		int32: (that) => _.readInt(that, { bits: 32, endian: 'be', signed: true }),
		int32be: (that) => _.readInt(that, { bits: 32, endian: 'be', signed: true }),
		int32le: (that) => _.readInt(that, { bits: 32, endian: 'le', signed: true }),
		uint32: (that) => _.readInt(that, { bits: 32, endian: 'be', signed: false }),
		uint32be: (that) => _.readInt(that, { bits: 32, endian: 'be', signed: false }),
		uint32le: (that) => _.readInt(that, { bits: 32, endian: 'le', signed: false }),
		int64: (that) => _.readInt(that, { bits: 64, endian: 'be', signed: true }),
		int64be: (that) => _.readInt(that, { bits: 64, endian: 'be', signed: true }),
		int64le: (that) => _.readInt(that, { bits: 64, endian: 'le', signed: true }),
		uint64: (that) => _.readInt(that, { bits: 64, endian: 'be', signed: false }),
		uint64be: (that) => _.readInt(that, { bits: 64, endian: 'be', signed: false }),
		uint64le: (that) => _.readInt(that, { bits: 64, endian: 'le', signed: false }),
		float: () => _.readFloat(),
		double: () => _.readDouble(),
		string: (that, length, encoding) => _.readString(that, { length, encoding }),
		utf8String: (that, length) => _.readString({ length, encoding: 'utf8' }),
		utf16LEString: (that, length) => _.readString({ length, encoding: 'utf16le' }),
		base64String: (that, length) => _.readString({ length, encoding: 'base64' }),
		hexString: (that, length) => _.readString({ length, encoding: 'hex' }),
		cstring: (that, length, encoding) => _.readNullTerminatedString(that, { encoding }),
		utf8CString: (that, length) => _.readNullTerminatedString(that, { encoding: 'utf8' }),
		utf16LECString: (that, length) => _.readNullTerminatedString(that, { encoding: 'utf16le' }),
		base64CString: (that, length) => _.readNullTerminatedString(that, { encoding: 'base64' }),
		hexCString: (that, length) => _.readNullTerminatedString(that, { encoding: 'hex' }),
		array: (that, type, length) => _.readArray(that, { type, length }),
		buffer: (that, length) => _.readBuffer(that, length),
		bits: (that, length) => _.readBits(that, length),
		fixed: (that, fixed) => this.resolve(fixed, that),
	};

	return parsers;
}

create.create = create;

module.exports = create;
