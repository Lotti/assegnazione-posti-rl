const log4js = require('log4js');
const log = log4js.getLogger('Pullman');
const cloneDeep = require('lodash.clonedeep');

const Seat = require('./Seat');

const COLS_PER_ROW = 17 + 7; // seats + spaces per line
const BONUS_GROUP_POINTS = 200;

class Pullman {
    constructor() {
        this.matrix = [
            this._seatsRow([1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]),
            this._seatsRow([1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]),
            this._seatsRow([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            this._seatsRow([1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]),
            this._seatsRow([1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1])
        ];
        this.cells = this.matrix.flat();
        this.seats = this.cells.filter((s) => !s.isVoid());
        this.bonusScore = 0;
    }

    /**
     * get pullman number of rows and cols
     * @returns {{rows: number, cols: number}}
     */
    getSizes() {
        return {rows: this.matrix.length, cols: COLS_PER_ROW};
    }

    /**
     * generate pullman seats rows
     * @param {[]} seats
     * @returns {Seat[]}
     */
    _seatsRow(seats) {
        if (seats.length !== COLS_PER_ROW) {
            throw new Error(`seats must be exactly ${COLS_PER_ROW}`);
        }
        const seatsRow = [];
        for (const v of seats) {
            seatsRow.push(v ? new Seat() : new Seat(true));
        }
        return seatsRow;
    }

    /**
     * get coords of seats to check
     * @param {number} row
     * @param {number} col
     * @returns {{row: number, col: number}[]}
     * @private
     */
    _getAroundSeatsCoords(row, col) {
        const coords = [];
        if (row - 1 >= 0) {
            coords.push({row: row - 1, col: col});
        }
        if (col - 1 >= 0) {
            coords.push({row: row, col: col - 1});
        }
        if (row + 1 < this.matrix.length) {
            coords.push({row: row + 1, col: col});
        }
        if (col + 1 < COLS_PER_ROW) {
            coords.push({row: row, col: col + 1});
        }
        return coords;
    }

    /**
     * get pullman cells
     * @returns {Seat[]}
     */
    getCells() {
        return this.cells;
    }

    /**
     * get pullman seats
     * @returns {Seat[]}
     */
    getSeats() {
        return this.seats;
    }

    /**
     * Return cells status for Agent
     * @param {string} label
     * @returns {number[]}
     */
    getSeatStatusByLabel(label) {
        const matrix = cloneDeep(this.matrix);
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < COLS_PER_ROW; col++) {
                const s = this.getSeat(row, col, matrix);

                if (this.getSeat(row, col, matrix).isOff()) {
                    let found = false;
                    const coords = this._getAroundSeatsCoords(row, col);
                    for (const c of coords) {
                        const nearSeat = this.getSeat(row, col, matrix);
                        if (nearSeat && nearSeat.isBusy() && !nearSeat.isGroup(label)) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        s.clear();
                    }
                }
            }
        }
        return matrix.flat().map((c) => {
            switch (c.getState()) {
                default:
                    throw new Error('Invalid seat state!');
                case Seat.OFF_SEAT_STATE:
                case Seat.VOID_SEAT_STATE:
                case Seat.BUSY_SEAT_STATE:
                    return 1;
                case Seat.FREE_SEAT_STATE:
                    return 0;
            }
        });
    }

    /**
     * get seats from the matrix
     * @param {number} row
     * @param {number} col
     * @param {Seat[]} matrix
     * @returns {Seat}
     */
    getSeat(row, col, matrix = this.matrix) {
        if (matrix[row] && matrix[row][col]) {
            return matrix[row][col];
        }
        throw new Error(`Matrix out of bounds ${row},${col}`);
    }

    /**
     * checks seat availability
     * @param {number} row
     * @param {number} col
     * @param {string} label
     * @returns {{seat: Seat, error: boolean}}
     * @private
     */
    _checkSeat(row, col, label) {
        const chosenSeat = cloneDeep(this.getSeat(row, col));
        if (chosenSeat.isFree()) {
            return {error: false, seat: chosenSeat};
        }

        if (chosenSeat.isOff() && label) {
            const coords = this._getAroundSeatsCoords(row, col);
            for (const c of coords) {
                const nearSeat = this.getSeat(c.row, c.col);
                if (nearSeat && nearSeat.isBusy() && !nearSeat.isGroup(label)) {
                    return {error: true, seat: chosenSeat};
                }
            }
            return {error: false, seat: chosenSeat};
        }
        return {error: true, seat: chosenSeat};
    }

    /**
     * tries to assign a seat
     * @param {number} row
     * @param {number} col
     * @param {string} label
     * @returns {{prevSeat: Seat, currSeat: Seat, error: boolean}}
     */
    pickSeat(row, col, label) {
        const check = this._checkSeat(row, col, label);
        if (check.error) {
            return {error: true, prevSeat: check.seat, currSeat: check.seat};
        }

        const seat = this.getSeat(row, col);
        seat.assign(label);
        const coords = this._getAroundSeatsCoords(row, col);
        for (const c of coords) {
            const nearSeat = this.getSeat(c.row, c.col);
            if (nearSeat && nearSeat.isFree()) {
                nearSeat.off();
            }
        }
        return {error: false, prevSeat: check.seat, currSeat: cloneDeep(seat)};
    }

    /**
     * get number of seats in pullman
     * @returns {number}
     */
    countSeats() {
        return this.seats.length;
    }

    /**
     * get number of free seats
     * @returns {number}
     */
    countFreeSeats() {
        return this.seats.filter((s) => s.isFree()).length;
    }

    /**
     * Computes pullman representation with strings
     * @returns {string[]}
     */
    display() {
        return [
            '_'.repeat(COLS_PER_ROW * 2),
            ...this.matrix.map((s) => `|${s.join(' ')}|`),
            '‾'.repeat(COLS_PER_ROW * 2 + 1),
        ];
    }
}

module.exports = Pullman;