/*@flow*/
/*
 * You may redistribute this program and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

const BufferShift = require('buffershift');
const Cjdnskeys = require('cjdnskeys');
const Sodium = require('libsodium-wrappers');
const Peer = require('./Peer');
const EncodingScheme = require('./EncodingScheme');
const Version = require('./Version');

const MINSIZE = module.exports.MINSIZE = 120;

const parseEntities = (x, bytes) => {
    const out = [];
    while (x < bytes.length) {
        if (bytes[x] === 0) { throw new Error("0 length entity in message"); }
        if (bytes[x] === 1) { x++; continue; }
        if (bytes[x+1] === Peer.TYPE) {
            out.push(Peer.parse(bytes.slice(x, x += bytes[x])));
        } else if (bytes[x+1] === EncodingScheme.TYPE) {
            out.push(EncodingScheme.parse(bytes.slice(x, x += bytes[x])));
        } else if (bytes[x+1] === Version.TYPE) {
            out.push(Version.parse(bytes.slice(x, x += bytes[x])));
        } else {
            console.log("unrecognized message of length [" + bytes[x] + "] and type [" +
                bytes[x+1] + "]");
            x += bytes[x];
        }
    }
    if (x !== bytes.length) { throw new Error('garbage after the last announcement entity'); }
    return out;
};

const parse = module.exports.parse = (hdrBytes /*:Buffer*/) => {
    if (hdrBytes.length < MINSIZE) { throw new Error("runt"); }
    let x = 0;
    const signature = hdrBytes.slice(x, x += 64);
    const pubSigningKey = hdrBytes.slice(x, x += 32);
    const snodeIpBytes = hdrBytes.slice(x, x += 16);
    const timestampVersionFlagsBytes = new Buffer(hdrBytes.slice(x, x += 8));
    const ver = timestampVersionFlagsBytes[7] & 7;
    const isReset = 1 === ((timestampVersionFlagsBytes[7] >> 3) & 1);
    timestampVersionFlagsBytes[7] &= 0xf0;
    BufferShift.shr(timestampVersionFlagsBytes, 4);
    const timestamp = timestampVersionFlagsBytes.toString('hex');

    if (!Sodium.crypto_sign_verify_detached(signature, hdrBytes.slice(64), pubSigningKey)) {
        throw new Error('signature verification failed');
    }

    const curve25519KeyBin =
        Sodium.crypto_sign_ed25519_pk_to_curve25519(pubSigningKey, 'uint8array');
    const nodePubKey = Cjdnskeys.keyBytesToString(curve25519KeyBin);
    const nodeIp = Cjdnskeys.publicToIp6(nodePubKey);

    if (nodeIp.indexOf('fc') !== 0) { throw new Error('node starting with non fc addr'); }
    if (snodeIpBytes[0] !== 0xfc) { throw new Error('snode starting with non fc addr'); }

    const entities = parseEntities(x, hdrBytes);
    const peers = entities.filter((e) => (e.type === 'Peer')).map(Object.freeze);
    const encodingScheme = entities.filter((e) => (e.type === 'EncodingScheme'))[0];

    return Object.freeze({
        signature: signature.toString('hex'),
        pubSigningKey: pubSigningKey.toString('hex'),
        snodeIp: Cjdnskeys.ip6BytesToString(snodeIpBytes),
        nodePubKey: nodePubKey,
        nodeIp: nodeIp,
        ver: ver,
        isReset: isReset,
        timestamp: timestamp.toString(),
        entities: Object.freeze(entities),
        binary: hdrBytes
    });
};
