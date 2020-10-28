const log4js = require('log4js');
const log = log4js.getLogger('Booking');

const Chance = require('chance');


/**
 * @typedef {Object} booking
 * @property {string} label
 * @property {number} people
 */

class Booking {
    constructor(seed = undefined) {
        this.chance = new Chance(seed);
        this.bookings = [];
        this.pointer = -1;
        this.labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789¶■§♠♥♦♣@#¥€$%&*abcdefghijklmnopqrstuvwxyz'.split('');
    }

    /**
     *
     * @returns {Booking}
     */
    generate() {
        this.bookings = [];
        this.pointer = -1;
        for (let i = 0; i < this.labels.length; i++) {
            const people = this.chance.integer({min: 1, max: 3});
            this.bookings.push({
                label: this.labels[i],
                people,
            });
        }
        return this;
    }

    /**
     * get next booking
     * @returns {booking|boolean}
     */
    getNext() {
        if (!this.bookings || this.bookings.length <= 0) {
            log.fatal(this.bookings);
            throw new Error(`you must call generate() method before getNext() method!`);
        }

        this.pointer++;
        if (this.pointer > this.bookings.length) {
            return undefined;
        }
        return this.bookings[this.pointer];
    }

    toString() {
        return this.bookings.map((b) => `${b.people}x${b.label}`).join(',');
    }
}

module.exports = Booking;

