const log4js = require('log4js');
const log = log4js.getLogger('Seat');

class Seat {
    static VOID_SEAT_STATE = 0;
    static FREE_SEAT_STATE = 1;
    static OFF_SEAT_STATE = 2;
    static BUSY_SEAT_STATE = 3;
    static ERROR_SEAT_STATE = 4;

    /**
     *
     * @param {number} row
     * @param {number} col
     * @param {boolean} isFree
     */
    constructor(row, col, isFree) {
        this.row = row;
        this.col = col;
        this.state = isFree ? Seat.FREE_SEAT_STATE : Seat.VOID_SEAT_STATE;
        this.label = null;
    }

    /**
     * returns seat coords in row, col
     * @returns {{col: number, row: number}}
     */
    getCoords() {
        return {row: this.row, col: this.col};
    }

    /**
     * get seat possible states
     * @returns {number[]}
     */
    getPossibleStates() {
        return [Seat.VOID_SEAT_STATE, Seat.FREE_SEAT_STATE, Seat.OFF_SEAT_STATE, Seat.BUSY_SEAT_STATE];
    }

    /**
     * get seat state
     * @returns {number}
     */
    getState() {
        return this.state;
    }

    /**
     * set seat state
     * @returns {Seat}
     */
    setState(state) {
        this.state = state;
        return this;
    }

    /**
     * checks if seat is VOID
     * @returns {boolean}
     */
    isVoid() {
        return this.state === Seat.VOID_SEAT_STATE;
    }

    /**
     * checks if seat is FREE
     * @returns {boolean}
     */
    isFree() {
        return this.state === Seat.FREE_SEAT_STATE;
    }

    /**
     * checks if seat is OFF
     * @returns {boolean}
     */
    isOff() {
        return this.state === Seat.OFF_SEAT_STATE;
    }

    /**
     * checks if seat is BUSY
     * @returns {boolean}
     */
    isBusy() {
        return this.state === Seat.BUSY_SEAT_STATE;
    }

    /**
     * check if seat can be grouped
     * @param label
     * @returns {boolean}
     */
    isGroup(label) {
        return this.label === label;
    }

    /**
     * empties seat if not VOID
     */
    clear() {
        if (this.state !== Seat.VOID_SEAT_STATE) {
            this.state = Seat.FREE_SEAT_STATE;
        }
    }

    /**
     * assign seat if not VOID
     * @param label
     */
    assign(label) {
        if (this.state !== Seat.VOID_SEAT_STATE) {
            this.state = Seat.BUSY_SEAT_STATE;
            this.label = label;
        }
    }

    /**
     * set seat OFF if not VOID
     */
    off() {
        if (this.state !== Seat.VOID_SEAT_STATE) {
            this.state = Seat.OFF_SEAT_STATE;
        }
    }

    /**
     *
     * @returns {string}
     */
    toString() {
        switch (this.state) {
            case Seat.FREE_SEAT_STATE:
                return '_';
            case Seat.BUSY_SEAT_STATE:
                return `\x1b[32m${this.label}\x1b[0m`;
            case Seat.OFF_SEAT_STATE:
                return '\x1b[41m \x1b[0m';
            default:
            case Seat.VOID_SEAT_STATE:
                return ' ';
        }
    }
}

module.exports = Seat;

