/*@flow*/
const Cjdnsann = require('./index');

const ANNOUNCEMENT = new Buffer(
    // header
    '9dcdafaf6a129d4194eb52586ec81ecbf7f52abf183268a314e19e066baa' +
    '7bfbe01121ba42ff8fa41356420894d576ce0a0105577cca0e50d945283c' +
    '18d89c07f2e1d148ed18b09d16b5766e4250df7b4e83a5ccedd4cfde15f1' +
    'f474db1a5bc2fc928136dc1fe6e04ef6a6dd7187b85f0000157354c540c1' +

    // pad
    '01' +

    // encodingScheme
    '07006114458100' +

    // peer
    '240100000000fffffffffffffc928136dc1fe6e04ef6a6dd7187b85f0000000000000015',

    'hex'
);

// console.log(JSON.stringify(Cjdnsann.parse(ANNOUNCEMENT), null, '  '));

console.log(Cjdnsann.parse(new Buffer(
    '3a2349bd342608df20d999ff2384e99f1e179dbdf4aaa61692c2477c011c' +
    'fe635b42d3cdb8556d94f365cdfa338dc38f40c1fabf69500830af915f41' +
    'bed71b09f2e1d148ed18b09d16b5766e4250df7b4e83a5ccedd4cfde15f1' +
    'f474db1a5bc2fc928136dc1fe6e04ef6a6dd7187b85f00001576462f6f69' +
    '04020012' +
    '01' +
    '07006114458100' +
    '200100000000fffffffffffffc928136dc1fe6e04ef6a6dd7187b85f00000015',

    'hex')));

// See: cjdns/subnode/test/LinkState_test.c / staticTest()
let x = Cjdnsann.LinkState.parse(new Buffer(
    '200306000000000000' +
    '04' + '10' +
    '13' + '00' + '01' +
    '12' + '00' + '02' +
    '13' + '00' + '02' +
    '13' + '00' + '00' +
    '14' + '00' + '03' +
    '12' + '00' + '01' +
    '13' + '00' + '01', 'hex'));
const n = null;
const gold = {
  type: 'LinkState',
  nodeId: 4,
  startingPoint: 16,
  lagSlots: [ 19, 19, 20, 18, 19, n, n, n, n, n, n, n, n, n, n, n, 19, 18 ],
  dropSlots: [ 0, 0, 0, 0, 0, n, n, n, n, n, n, n, n, n, n, n, 0, 0 ],
  kbRecvSlots: [ 2, 0, 3, 1, 1, n, n, n, n, n, n, n, n, n, n, n, 1, 2 ]
};
if (JSON.stringify(x) !== JSON.stringify(gold)) { throw new Error(); }
//console.log(x);