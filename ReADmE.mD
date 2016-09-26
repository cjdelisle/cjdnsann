# Cjdnsann
Library for parsing cjdns route announcement messages.

## Cjdnsann.parse(buffer)
Takes a buffer and parses (and validates) the announcement contained within.
Throws an error if the message fails to parse or if it has an invalid signature.

```javascript
> Cjdnsann.parse(new Buffer(
    '9dcdafaf6a129d4194eb52586ec81ecbf7f52abf183268a314e19e066baa' +
    '7bfbe01121ba42ff8fa41356420894d576ce0a0105577cca0e50d945283c' +
    '18d89c07f2e1d148ed18b09d16b5766e4250df7b4e83a5ccedd4cfde15f1' +
    'f474db1a5bc2fc928136dc1fe6e04ef6a6dd7187b85f0000157354c540c1' +
    '0107006114458100240100000000fffffffffffffc928136dc1fe6e04ef6' +
    'a6dd7187b85f0000000000000015', 'hex'));

{ signature: '9dcdafaf6a129d4194eb52586ec81ecbf7f52abf183268a314e19e066baa7bfbe01121ba42ff8fa41356420894d576ce0a0105577cca0e50d945283c18d89c07',
  pubSigningKey: 'f2e1d148ed18b09d16b5766e4250df7b4e83a5ccedd4cfde15f1f474db1a5bc2',
  snodeIp: 'fc92:8136:dc1f:e6e0:4ef6:a6dd:7187:b85f',
  nodePubKey: 'z15pzyd9wgzs2g5np7d3swrqc1533yb7xx9dq0pvrqrqs42uwgq0.k',
  nodeIp: 'fc49:11cb:38c2:8d42:9865:7b8e:0d67:11b3',
  ver: 1,
  isReset: false,
  timestamp: '00000157354c540c',
  peers:
   [ { type: 'Peer',
       ipv6: 'fc92:8136:dc1f:e6e0:4ef6:a6dd:7187:b85f',
       label: '0000.0000.0000.0015',
       mtu: 0,
       drops: 65535,
       latency: 65535,
       penalty: 65535,
       encodingFormNum: 0,
       flags: 0 } ],
  encodingScheme:
   { type: 'EncodingScheme',
     hex: '6114458100',
     scheme: [ { bitCount: 3, prefix: '01', prefixLen: 1 },
               { bitCount: 5, prefix: '02', prefixLen: 2 },
               { bitCount: 8, prefix: '00', prefixLen: 2 } ] },
  binary: <Buffer ...>  }
 ```

## Cjdns announcement message format:

Each cjdns announcement message contains a header and one or more entities. At the time of this
writing, valid entities include peer (indicating reachability) and encoding scheme which tells
the supernodes what the encoding scheme of this subnode happens to be.

### The Header

The header is 120 bytes lone and contains an ED25519 signature over the entire announcement,
the public signing key of the node which created the announcement (this can be converted into
their public encryption key using ED25519->Curve25519 conversion), the cjdns IPv6 address of
the supernode to which this subnode is announcing, a timestamp, version and a reset flag.

Here is the packet diagram:

```
                       1               2               3
       0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    0 |                                                               |
      +                                                               +
    4 |                                                               |
      +                                                               +
    8 |                                                               |
      +                                                               +
   12 |                                                               |
      +                                                               +
   16 |                                                               |
      +                                                               +
   20 |                                                               |
      +                                                               +
   24 |                                                               |
      +                                                               +
   28 |                                                               |
      +                           Signature                           +
   32 |                                                               |
      +                                                               +
   36 |                                                               |
      +                                                               +
   40 |                                                               |
      +                                                               +
   44 |                                                               |
      +                                                               +
   48 |                                                               |
      +                                                               +
   52 |                                                               |
      +                                                               +
   56 |                                                               |
      +                                                               +
   60 |                                                               |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   64 |                                                               |
      +                                                               +
   68 |                                                               |
      +                                                               +
   72 |                                                               |
      +                                                               +
   76 |                                                               |
      +                     Public Signing Key                        +
   80 |                                                               |
      +                                                               +
   84 |                                                               |
      +                                                               +
   88 |                                                               |
      +                                                               +
   92 |                                                               |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   96 |                                                               |
      +                                                               +
  100 |                                                               |
      +                        SuperNode IP                           +
  104 |                                                               |
      +                                                               +
  108 |                                                               |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  112 |                                                               |
      +                         Timestamp                     +-+-+-+-+
  116 |                                                       |R| ver |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

* **Signature**: A curve25519 signature over the entire message (including entities)
* **Public Signing Key**: The key which was used to sign the message, this library converts the key
upon parsing into a Curve25519 key and the related cjdns IPv6 address.
* **SuperNode IP**: The cjdns IPv6 of the supernode to which this node is announcing.
* **Timestamp**: The time (according to the subnode) when the message was created.
* **R**: (reset) If this flag is set then the subnode would like all supernodes to discard any
information which they previously kept about said subnode and begin fresh.
* **ver**: (version) Version of the announcement protocol, currently 1.


### Entity

Every entity message begins with two bytes, indicating length and type, at the time of this writing
the types of entities are:

* EncodingScheme 0
* Peer 1
* Version 2

Entity messages all begin with the length of the entity such that future entities can be added and
skipped over by older versions of the parser. Entities longer than 255 or shorter than 1 byte are
invalid. If the entity length field is exactly 1 byte, it is a *pad* entity and that byte should
be skipped over. Pad entities can be useful to byte-align messages with oddly sized entities.

#### EncodingScheme Entity

An EncodingScheme entity contains the first two bytes, length and type followed by the
EncodingScheme which is serialized according to cjdns EncodingScheme serialization. Please refer
to https://github.com/cjdelisle/cjdnsencoding for more information about how this is parsed.
As EncodingScheme serialization does not have a fixed width in bytes, EncodingScheme entities are
prefixed with a number of *pad* entities in order that their length will be a multiple of four
bytes.

#### Peer Entity

Each Peer entity announcement contains roughly the information which is needed to reach the
announcer from a given peer. It is important to note that this is not about ability to reach the
*peer* but to reach the announcer if one can already reach said peer.

The packet diagram is as follows:

```
                       1               2               3
       0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    0 |     length    |      type     | encodingForm  |     flags     |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    4 |      MTU (8 byte units)       |             drops             |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    8 |           latency             |            penalty            |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   12 |                                                               |
      +                                                               +
   16 |                                                               |
      +                           Peer IPv6                           +
   20 |                                                               |
      +                                                               +
   24 |                                                               |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   28 |                             label                             |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

* **length**: As per the Entity definition, peer length is always 36
* **type**: As per the Entity definition, peer type is 1
* **encodingForm**: This is the number of the form within the encodingScheme which is the smallest
form that can represent the Director for reaching the peer from the announcer. Yes, you read that
right, even though this announcement is designed for reaching the announcer from the peer, in order
to chain links for making a label, one must have the inverse encoding form for each hop such that
the reverse label will be the same size as the forward label.
* **flags**: A field for flags for future use such as whether the link is simplex or other
information. Currently there are no flags.
* **MTU8**: The maximum message size for messages going to the announcer from the peer. If this
is set to zero it indicates the announcer is not aware of the MTU.
* **drops**: The fraction of dropped messages out of 65 thousand in the previous time-window.
0xffff means the announcer does not know.
* **latency**: Average number of milliseconds for a round-trip ping between the announcer and the
peer along this link. 0xffff means the announcer does not know.
* **penalty**: A number which indicates the cost of sending a packet along this link, higher values
indicate there is a bottleneck and there is a higher likelihood of the packet being dropped,
especially if the sender sends a lot of traffic. See cjdns/switch/Penalty.h
* **Peer IPv6**: The cjdns IPv6 of the peer from which this node can be reached.
* **Label**: The label fragment (Director) which should be used for constructing a label for
reaching the announcer from the peer. This may need to be recoded depending on the encodingForm
of the announcement for the link which was used to reach the peer. A label of 0 indicates that the
route is being withdrawn and it is nolonger usable. This is limited to 32 bits because 32 bits is
the largest Director that can be represented in an EncodingScheme.


#### Version Entity

This type of entity tells the protocol version of the node sending it.

```
                       1               2               3
       0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    0 |     length    |      type     |             version           |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

* **length**: As per the Entity definition, always 4
* **type**: As per the Entity definition, always 2
* **version**: Big endian representation of the protocol version of the node
