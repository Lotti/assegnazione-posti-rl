const log4js = require('log4js');
const log = log4js.getLogger('Seat');

const VOID_SEAT_STATE = 0;
const FREE_SEAT_STATE = 1;
const OFF_SEAT_STATE = 2;
const BUSY_SEAT_STATE = 3;
const EMPTY_SEAT_POINTS = 0;
const BUSY_SEAT_POINTS = 50;
const OFF_SEAT_POINTS = -25;

class Seat {
    constructor(isVoid) {
        this.state = isVoid ? VOID_SEAT_STATE : FREE_SEAT_STATE;
        this.label = null;
    }

    /**
     * get seat possible states
     * @returns {number[]}
     */
    getPossibleStates() {
        return [VOID_SEAT_STATE, FREE_SEAT_STATE, OFF_SEAT_STATE, BUSY_SEAT_STATE];
    }

    /**
     * get seat state
     * @returns {number}
     */
    getState() {
        return this.state;
    }

    /**
     * checks if seat is VOID
     * @returns {boolean}
     */
    isVoid() {
        return this.state === VOID_SEAT_STATE;
    }

    /**
     * checks if seat is FREE
     * @returns {boolean}
     */
    isFree() {
        return this.state === FREE_SEAT_STATE;
    }

    /**
     * checks if seat is OFF
     * @returns {boolean}
     */
    isOff() {
        return this.state === OFF_SEAT_STATE;
    }

    /**
     * checks if seat is BUSY
     * @returns {boolean}
     */
    isBusy() {
        return this.state === BUSY_SEAT_STATE;
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
        if (this.state !== VOID_SEAT_STATE) {
            this.state = FREE_SEAT_STATE;
        }
    }

    /**
     * assign seat if not VOID
     * @param label
     */
    assign(label) {
        if (this.state !== VOID_SEAT_STATE) {
            this.state = BUSY_SEAT_STATE;
            this.label = label;
        }
    }

    /**
     * set seat OFF if not VOID
     */
    off() {
        if (this.state !== VOID_SEAT_STATE) {
            this.state = OFF_SEAT_STATE;
        }
    }

    /**
     * gets seat's points
     * @returns {number}
     */
    getPoints() {
        switch (this.state) {
            case VOID_SEAT_STATE:
            case FREE_SEAT_STATE:
                return EMPTY_SEAT_POINTS;
            case BUSY_SEAT_STATE:
                return BUSY_SEAT_POINTS;
            case OFF_SEAT_STATE:
                return OFF_SEAT_POINTS;
        }
    }

    /**
     *
     * @returns {string}
     */
    toString() {
        switch (this.state) {
            default:
            case VOID_SEAT_STATE:
                return ' ';
            case FREE_SEAT_STATE:
                return '_';
            case BUSY_SEAT_STATE:
                return `\x1b[32m${this.label}\x1b[0m`;
            case OFF_SEAT_STATE:
                return '\x1b[41m \x1b[0m';
        }
    }
}

module.exports = Seat;

