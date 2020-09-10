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

const TYPE = module.exports.TYPE = 3;

const SLOTS = module.exports.SLOTS = 18;

const VarInt_pop = (iter) => {
    let out = 0;
    //uint8_t* bytes = iter->ptr;
    const len = iter.buf.length - iter.i;
    const byte = iter.buf[iter.i];
    if (len < 9) {
        if (len < 5) {
            if (len < 3) {
                if (len < 1) { throw new Error("runt"); }
                if (byte >= 0xfd) { throw new Error("runt"); }
            } else if (byte >= 0xfe) { throw new Error("runt"); }
        } else if (byte >= 0xff) { throw new Error("runt"); }
    }
    switch (byte) {
        case 0xff:
            out += iter.buf[++iter.i]; out *= 256;
            out += iter.buf[++iter.i]; out *= 256;
            out += iter.buf[++iter.i]; out *= 256;
            out += iter.buf[++iter.i]; out *= 256;
            /* falls through */
        case 0xfe:
            out += iter.buf[++iter.i]; out *= 256;
            out += iter.buf[++iter.i]; out *= 256;
            /* falls through */
        case 0xfd:
            out += iter.buf[++iter.i]; out *= 256;
            iter.i++;
            /* falls through */
        default:
            out += iter.buf[iter.i++];
    }
    //iter->ptr = bytes;
    //if (_out) { *_out = out; }
    return out;
};

module.exports.parse = (hdrBytes /*:Buffer*/) => {
    if (hdrBytes.length < 3) { throw new Error("runt"); }
    let x = 0;
    const length = hdrBytes[x++];
    if (length !== hdrBytes.length) { throw new Error("unexpected length"); }
    const type = hdrBytes[x++];
    const pads = hdrBytes[x++];
    if (type !== TYPE) { throw new Error("invalid type"); }
    for (let i = 0; i < pads; i++) {
        if (hdrBytes[x++]) { throw new Error("non-zero pad entry"); }
    }

    const it = { buf: hdrBytes, i: x };
    const out = {
        type: 'LinkState',
        nodeId: VarInt_pop(it),
        startingPoint: VarInt_pop(it),
        lagSlots: Array(SLOTS),
        dropSlots: Array(SLOTS),
        kbRecvSlots: Array(SLOTS),
    };
    for (let i = out.startingPoint; ; i = (i + 1) % SLOTS) {
        if (it.i === hdrBytes.length) { break; }
        out.lagSlots[i] = VarInt_pop(it);
        out.dropSlots[i] = VarInt_pop(it);
        out.kbRecvSlots[i] = VarInt_pop(it);
    }

    return Object.freeze(out);
};
