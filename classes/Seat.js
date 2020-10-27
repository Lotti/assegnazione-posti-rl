const log4js = require('log4js');
const log = log4js.getLogger('Seat');

const EMPTY_SEAT_STATE = 0;
const BUSY_SEAT_STATE = 1;
const OFF_SEAT_STATE = 2;
const VOID_STATE = 4;
const EMPTY_SEAT_POINTS = 0;
const BUSY_SEAT_POINTS = 10;
const OFF_SEAT_POINTS = 5;

class Void {
    getState() {
        return VOID_STATE;
    }

    isAvailable() {
        return false;
    }

    setClear() {
    }

    setAssign(label) {
    }

    setOff() {
    }

    getPoints() {
        return EMPTY_SEAT_STATE;
    }

    toString() {
        return ' ';
    }
}

module.exports.Void = Void;

class Seat extends Void {
    constructor() {
        super();
        this.state = EMPTY_SEAT_STATE;
        this.label = null;
    }

    getState() {
        return this.state;
    }

    isAvailable() {
        return this.state === EMPTY_SEAT_STATE;
    }

    setClear() {
        this.state = EMPTY_SEAT_STATE;
    }

    setAssign(label) {
        this.state = BUSY_SEAT_STATE;
        this.label = label;
    }

    setOff() {
       this.state = OFF_SEAT_STATE;
    }

    getPoints() {
        switch (this.state) {
            case EMPTY_SEAT_STATE:
                return EMPTY_SEAT_POINTS;
            case BUSY_SEAT_STATE:
                return BUSY_SEAT_POINTS;
            case OFF_SEAT_STATE:
                return OFF_SEAT_POINTS;
        }
    }

    toString() {
        switch (this.state) {
            case EMPTY_SEAT_STATE:
                return '_';
            case BUSY_SEAT_STATE:
                return this.label;
            case OFF_SEAT_STATE:
                return 'X';
        }
    }
}

module.exports.Seat = Seat;

