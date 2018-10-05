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

const Cjdnskeys = require('cjdnskeys');

const SIZE = module.exports.SIZE = 32;
const TYPE = module.exports.TYPE = 1;

const parse = module.exports.parse = (hdrBytes /*:Buffer*/) => {
    if (hdrBytes.length < SIZE) { throw new Error("runt"); }
    let x = 0;
    const length = hdrBytes[x++];
    const type = hdrBytes[x++];
    if (length !== SIZE) { throw new Error("invalid length " + length); }
    if (type !== TYPE) { throw new Error("invalid type"); }
    const encodingFormNum = hdrBytes[x++];
    const flags = hdrBytes[x++];
    const mtu8 = hdrBytes.readUInt16BE(x); x += 2;
    const peerNum = hdrBytes.readUInt16BE(x); x += 2;
    const unused = hdrBytes.readUInt32BE(x); x += 4;
    const ipv6Bytes = hdrBytes.slice(x, x += 16);
    const labelBytes = hdrBytes.slice(x, x += 4);
    if (x !== SIZE) { throw new Error(); }

    const mtu = mtu8 * 8;
    const ipv6 = Cjdnskeys.ip6BytesToString(ipv6Bytes);
    const label = '0000.0000.' +
        labelBytes.toString('hex').replace(/[0-9a-f]{4}/g, (x) => (x + '.')).slice(0,-1);

    return Object.freeze({
        type: 'Peer',
        ipv6: ipv6,
        label: label,
        mtu: mtu,
        peerNum: peerNum,
        unused: unused,
        encodingFormNum: encodingFormNum,
        flags: flags
    });
};
