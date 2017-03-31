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

const SIZE = module.exports.SIZE = 4;
const TYPE = module.exports.TYPE = 2;

const parse = module.exports.parse = (hdrBytes /*:Buffer*/) => {
    if (hdrBytes.length < SIZE) { throw new Error("runt"); }
    let x = 0;
    const length = hdrBytes[x++];
    const type = hdrBytes[x++];
    if (length !== SIZE) { throw new Error("invalid length"); }
    if (type !== TYPE) { throw new Error("invalid type"); }
    const version = hdrBytes.readUInt16BE(x);

    return Object.freeze({
        type: 'Version',
        version: version
    });
};
