# binary-parse

`binary-parse` allows you to define a structure and parse binary data into that structure.


If you've ever analyzed a binary protocol or file format, you know how bloated and unreadable the source code is. It gets even worse when the protocol has funny things like integers that start or end in the middle of a byte, a mixture of little and big endian or structures that are not static but it is decided during parsing which fields are present.
`binary-parse` tries to provide an interface to analyze such binary formats declaratively without losing the ability to dynamically make decisions.

Let's take a look how an IPv4 packet could be parsed (leaving the IP options and the payload raw):
```js
const BinaryParser = require('binary-parse');

const structure =
{
	Header:
	{
		version: 4,
		headerLength: 4,
		tos: 8,
		length: 16,
		identification: ['buffer', 2],
		flags: ['bits', 3],
		fragmentOffset: 13,
		ttl: 8,
		protocol: 8,
		checksum: ['buffer', 2],
		sourceAddress: ['buffer', 4],
		destinationAddress: ['buffer', 4],
		options: ['buffer', (header) => (header.headerLength - 5) * 4],
	},

	Packet:
	{
		header: 'Header',
		body: 'buffer',
	},
};

let parser = new BinaryParser(structure);

let rawPacket = Buffer.from(/* ... */);
let packet = parser.parse(rawPacket, 'Packet');

/*
***Just sample data. Not a real IPv4-packet***
packet =>
{
	header:
	{
		version: 4,
		headerLength: 5,
		tos: 0,
		length: 1337,
		identification: Buffer <42 42>,
		flags: [0, 1, 0],
		fragmentOffset: 4711,
		ttl: 42,
		protocol: 0x10,
		checksum: Buffer <13 37>,
		sourceAddress: Buffer <0a 0d 25 2a>
		destinationAddres: Buffer <0a 0d 25 9f>,
		options: Buffer <...>,
	},
	body: Buffer <43 61 74 73 20 77 69 6c 6c 20 74 61 6b 65 20 6f 76 65 72 20 74 68 65 20 77 6f 72 6c 64 ...>,
}
*/
```


## Usage
To use the binary parser, you have to create a structure and pass it together with the data to parse to a `BinaryParser` instance. For examples, how to build such a structure, see examples below.
```js
const BinaryParser = require('binary-parse');

const structure = { /* See examples below */ };

let parser = new BinaryParser(structure);
let data = Buffer.from(/* ... */);

let parsedObject = parser.parse(data, '<NAME OF ROOT STRUCTURE>');
```

## Available types
If there's no endianess given, BigEndian is used
- `byte`: Int8, unsigned
- `int8`
- `uint8`
- `int16`
- `int16be`
- `int16le`
- `uint16`
- `uint16be`
- `uint16le`
- `int32`
- `int32be`
- `int32le`
- `uint32`
- `uint32be`
- `uint32le`
- `int64`
- `int64be`
- `int64le`
- `uint64`
- `uint64be`
- `uint64le`
- `int`: Generic int. See examples below for how to use this type  
Parameters: `[length (bits), endianess, signed]`
  - Values for Endianess: `b`, `be`, `big`, `bigendian`, `l`, `le`, `little`, `littleendian`  
  **Default**: `bigendian`
  - Values for Signed: `signed`, `s`, `1`, `true`, `unsigned`, `u`, `0`, `false`  
  **Default**: `unsigned`
- `float`: Float, 32 bit
- `double`: Double, 64 bit
- `string`  
Parameters `[length (bytes), encoding]`
  - Encoding: All encodings accepted by NodeJS `Buffer.toString`-method  
  **Default**: `ascii`
- `utf8String`  
Parameters: `[length (bytes)]`
- `utf16LEString`  
Parameters: `[length (bytes)]`
- `base64String`  
Parameters: `[length (bytes)]`  
This type reads binary data and **outputs** base64 string
- `hexString`  
Parameters: `[length (bytes)]`  
This type reads binary data and **outputs** a hex string
- `array`  
Parameters: `[type, length (elements)]`
- `buffer`  
Parameters: `[length (bytes)]`
- `bits`  
Parameters: `[length (bytes)]`  
Reads bits into an array of 0s and 1s
- Single numbers  
If a single number is used as type, it's interpreted as *unsigned*, *BigEndian* integer with that number of bits

## Examples
### Single struct
```js
const structure =
{
	MyStruct:
	{
		field1: 'int8',
		field2: 'uint16',
		field3: 'int16le',
	},
};

let parsedObject = parser.parse(data, 'MyStruct');
/* =>
{
	field1: 13,
	field2: 37,
	field3: 42,
}
*/
```
### Include other structs
```js
const structure =
{
	MyStruct:
	{
		field1: 'int8',
		field2: 'uint16',
		field3: 'int16le',
	},

	StructShell:
	{
		field1: 'int32',
		field2: 'double',
		child3: 'MyStruct',
		field4: 'byte',
		child5: 'MyStruct',
	},
};
/* =>
{
	field1: 111,
	field2: 222,
	child3:
	{
		field1: 13,
		field2: 37,
		field3: 42,
	},
	field4: 789,
	chidd5:
	{
		field1: 31,
		field2: 73,
		field3: 24,
	},
}
*/
```
### Nested structs
```js
const structure =
{
	StructShell:
	{
		field1: 'int32',
		field2: 'double',
		child3:
		{
			field1: 'int8',
			field2: 'uint16',
			field3: 'int16le',
		},
		field4: 'byte',
		child5: 'MyStruct',
	},
};
```

### Reading single bits as number
```js
const structure =
{
	MyStruct:
	{
		field1: 3, //3 Bits
		field2: 'uint16', //16 bit are read across byte boundaries
		field3: 5, //5 Bits
		//In total, 3 bytes have been read
	},
};
```
### Reading single bits
```js
const structure =
{
	MyStruct:
	{
		field1: ['bits', 3],
		field2: ['bits', 5],
		field3: 'bits',
	},
};
/* =>
{
	field1: [1, 1, 0],
	field2: [1, 0, 0, 0, 1],
	field3: [0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, ...],
},
*/
```

### Buffers
```js
const structure =
{
	MyStruct:
	{
		field1: 3,
		buffer2: ['buffer', 4], //Buffer with 4 bytes, also reading across byte boundaries
		field3: 5,
	},
};
/* =>
{
	field1: 1,
	buffer2: Buffer <11 22 33 44>,
	field3: 42,
},
*/
```
### Arrays
```js
const structure =
{
	MyStruct:
	{
		array1: ['array', 'int32', 3],
		array2: ['array', ['buffer', 4], 3],
	},

	StructShell:
	{
		structs: ['array', 'MyStruct', 2],
	},
};
/* =>
{
	structs:
	[
		{
			array1: [13, 37, 42],
			array2:
			[
				Buffer <a1 bb cc dd>,
				Buffer <a2 bb cc dd>,
				Buffer <a3 bb cc dd>,
			]
		},
		{
			array1: [73, 73, 73],
			array2:
			[
				Buffer <00 12 34 56>,
				Buffer <00 13 34 56>,
				Buffer <00 14 34 56>,
			]
		}
	]
	lines:
	[
		1234,
		5678,
		1111,
		2222,
		3333,
	],
},
*/
```
### Custom ints
```js
const structure =
{
	PacketHeader:
	{
		//Endians: b, be, big, bigendian, l, le, little, littleendian
		//Signed: signed, s, 1, true, unsigned, u, 0, false
		int1: ['int', 4, 'be', 'unsigned'],
		int2: ['int', 5, 'l', 'u'],
		int3: ['int', 8, 'big', 1],
	},
};
```
### Read remaining data
```js
const structure =
{
	Header:
	{
		field1: 'int8',
		field2: 'int16',
		field3: 'int16',
	},

	Packet:
	{
		header: 'Header',
		body: 'buffer'
/* or */        body: ['buffer']
/* or */        body: ['buffer', 0]
	},
};
/* =>
{
	header:
	{
		field1: 5,
		field2: 67,
		field3: 89,
	},
	body: Buffer <12 34 56 ...>,
}
*/
```
### Dynamic values
Each value except the struct definitions at root-level are allowed to be functions.
In this example only fixed values are shown. But obvioulsly the functions can execute and return what they want.
```js
const structure =
{
	Header:
	{
		field1: () => 'int8',
		field2: () => ['buffer', 4]
		field3: [() => 'array', 'int16', () => 5],
	},

	Packet:
	{
		header: () => 'Header',
		body: 'buffer'
	},
};
```
### Calculations
```js
const structure =
{
	Header:
	{
		field1: 'int8',
		field2: 'int16',
		headerLength: 'uint16',
		//HeaderLength - 5 bits from previous fields *8 as single numbers are interpreted as bit-count
		headerOptions: (header) => (header.headerLength - 5) * 8 
		//Instead of arrow-functions which have to use the passed object-instance, normal functions
		//can be used in which `this` points to the current object
/* or */        headerOptions: function() { return (this.headerLength - 5) * 8; }
/* or */        headerOptions: ['buffer', (header) => header.headerLength - 5]
	},
};
```
### Fixed values
```js
const structure =
{
	MyStruct:
	{
		field1: 'int8',
		field2: 'uint16',
		field3: 'uint16',
		fixed4: ['fixed', 424242]
/* or */        fixed4: ['fixed', (header) => { /* ... */ return someFinalValue; }]
	}
};
/* =>
{
	field1: 13,
	field2: 37,
	field3: 42,
	fixed4: 424242,
},
}
*/
```

## Parameters
Some types accept parameters. These can be passed using `[]`. Example:
- Type: `array`
- Parameters: `type`, `length`
- Syntax: `['array', <MY TYPE>, <MY LENGTH>]`

As showed in examples `Dynamic values`, functions can be used instead of hard-coded values.  
For every parameter of the listed predefined types, functions can be used:
```js
//...
someField: ['array', () => { return someType; }, () => { return someLength; }]
//...
someField: ['string', () => { return someEncoding; }, () => { return someLength; }]
//...
```

## Reading to end
Using any type which accepts a length (`int`, `string`, `array`, `buffer`, `bits`) with no length, length `0` or length `NaN` will lead them to read the data until the end.
The rule which all of these types follow is:
> Is there any data, even a single bit, left? If yes, read the next element. If no, stop

That means, if, for example, you're reading an array of `int32` with length `0` and there's one byte left at the end, the array tries to read another `int32` which is not possible and an exception will be thrown. This also happens when reading a buffer or a string if there are single bits left.
The only safe parser (for reading to the end) is `Bits`, since it obviously reads single bits and so doesn't get into the case where it tries to read more data than is available.

## Big numbers
As integers in JavaScript are only safe up to 52 bit, all numbers which are read with more than 51 bit are represented using BigNums from `big.js`.

## Parents
You can access data of the current object when using functions (see examples `Dynamic values` and `Calculations`).
If you need to use the data of parent objects, you can use the key `BinaryParser.symbols.parent` to access that object:
```js
//...
someDynamicField: (currentObject) => currentObject[BinaryParser.symbols.parent].someHeaderField
//...
```

## Symbols as keys
**Symbols as keys are not supported and will be completely ignored.**

In general, this library is using a feature of many JavaScript engines which is not defined by ECMAScript: When iterating over an object, the keys are given in the order they were defined.

As symbols aren't taken into account when iterating over an object, it's not possible to find out there positions in relation to the normal keys.

## API

### `new BinaryParser(structure)`

#### arguments
- `structure: object`

### `BinaryParser.parse(data, rootStructure)`

#### arguments

- `data: Buffer | byte[] | Uint8Array`
- `rootStructure: string`

#### returns

- `object`
