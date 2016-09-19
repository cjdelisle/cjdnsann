const Reachability = require('./index');

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

console.log(JSON.stringify(Reachability.parse(ANNOUNCEMENT), null, '  '));
