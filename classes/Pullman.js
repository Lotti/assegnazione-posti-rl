const log4js = require('log4js');
const log = log4js.getLogger('Pullman');
const cloneDeep = require('lodash.clonedeep');

const Seat = require('./Seat');

const COLS_PER_ROW = 17 + 7; // seats + spaces per line

class Pullman {
  constructor() {
    this.matrix = [
      this._seatsRow(0, [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]),
      this._seatsRow(1, [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]),
      this._seatsRow(2, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      this._seatsRow(3, [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]),
      this._seatsRow(4, [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1])
    ];
    this.cells = this.matrix.flat();
    this.seats = this.cells.filter((s) => !s.isVoid());
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
   * @param {number} row
   * @param {number[]} seats
   * @returns {Seat[]}
   */
  _seatsRow(row, seats) {
    if (seats.length !== COLS_PER_ROW) {
      throw new Error(`seats must be exactly ${COLS_PER_ROW}`);
    }
    const seatsRow = [];
    seats.forEach((value, col) => seatsRow.push(new Seat(row, col, value === 1)))
    return seatsRow;
  }

  /**
   * get coords of seats to check by row, col
   * @param {number} row
   * @param {number} col
   * @param {Seat[]} matrix
   * @returns {Seat[]}
   * @private
   */
  _getAroundSeatsCoords(row, col, matrix = this.matrix) {
    const seats = [];
    if (row - 1 >= 0) {
      seats.push(this.getSeat(row - 1, col, matrix));
    }
    if (col - 1 >= 0) {
      seats.push(this.getSeat(row, col - 1, matrix));
    }
    if (row + 1 < matrix.length) {
      seats.push(this.getSeat(row + 1, col, matrix));
    }
    if (col + 1 < COLS_PER_ROW) {
      seats.push(this.getSeat(row, col + 1, matrix));
    }
    return seats;
  }

  /**
   * get coords of seats to check by index
   * @param {number} pos
   * @param {Seat[]} seats
   * @returns {Seat[]}
   * @private
   */
  _getAroundSeatsCoordsByIndex(pos, seats = this.seats) {
    const s = seats[pos];
    const {row, col} = s.getCoords();

    return this._getAroundSeatsCoords(row, col, this.matrix);
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
  getSeatsStatusByLabel(label) {
    const matrix = cloneDeep(this.matrix);
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < COLS_PER_ROW; col++) {
        const s = this.getSeat(row, col, matrix);

        if (this.getSeat(row, col, matrix).isOff()) {
          let found = false;
          const seats = this._getAroundSeatsCoords(row, col, matrix);
          for (const nearSeat of seats) {
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

    return matrix.flat().filter((c) => !c.isVoid()).map((c) => {
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
   * get seats from the matrix by row, col
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
   * get seats from the matrix by index
   * @param {number} pos
   * @param {Seat[]} seats
   * @returns {Seat}
   */
  getSeatByIndex(pos, seats = this.seats) {
    if (seats[pos]) {
      return seats[pos];
    }
    throw new Error(`Array out of bounds ${pos}`);
  }

  /**
   * checks seat availability by row, col
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
      const seats = this._getAroundSeatsCoords(row, col);
      for (const nearSeat of seats) {
        if (nearSeat && nearSeat.isBusy() && !nearSeat.isGroup(label)) {
          return {error: true, seat: chosenSeat};
        }
      }
      return {error: false, seat: chosenSeat};
    }
    return {error: true, seat: chosenSeat};
  }

  /**
   * checks seat availability by index
   * @param {number} pos
   * @param {string} label
   * @returns {{seat: Seat, error: boolean}}
   * @private
   */
  _checkSeatByIndex(pos, label) {
    const chosenSeat = cloneDeep(this.getSeatByIndex(pos));
    if (chosenSeat.isFree()) {
      return {error: false, seat: chosenSeat};
    }

    if (chosenSeat.isOff() && label) {
      const seats = this._getAroundSeatsCoordsByIndex(pos);
      for (const nearSeat of seats) {
        if (nearSeat && nearSeat.isBusy() && !nearSeat.isGroup(label)) {
          return {error: true, seat: chosenSeat};
        }
      }
      return {error: false, seat: chosenSeat};
    }
    return {error: true, seat: chosenSeat};
  }

  /**
   * tries to assign a seat by row, col
   * @param {number} row
   * @param {number} col
   * @param {string} label
   * @returns {{prevSeat: Seat, currSeat: Seat, prevNearSeats: Seat[], currNearSeats: Seat[], error: boolean}}
   */
  pickSeat(row, col, label) {
    const check = this._checkSeat(row, col, label);
    if (check.error) {
      return {error: true, prevSeat: check.seat, currSeat: check.seat, prevNearSeats: [], currNearSeats: []};
    }

    const seat = this.getSeat(row, col);
    seat.assign(label);
    const seats = this._getAroundSeatsCoords(row, col);
    const prevNearSeats = cloneDeep(seats);
    for (const nearSeat of seats) {
      if (nearSeat && nearSeat.isFree()) {
        nearSeat.off();
      }
    }
    return {error: false, prevSeat: check.seat, currSeat: seat, prevNearSeats: prevNearSeats, currNearSeats: seats};
  }

  /**
   * tries to assign a seat by index
   * @param {number} pos
   * @param {string} label
   * @returns {{prevSeat: Seat, currSeat: Seat, prevNearSeats: Seat[], currNearSeats: Seat[], error: boolean}}
   */
  pickSeatByIndex(pos, label) {
    const check = this._checkSeatByIndex(pos, label);
    if (check.error) {
      return {error: true, prevSeat: check.seat, currSeat: check.seat, prevNearSeats: [], currNearSeats: []};
    }

    const seat = this.getSeatByIndex(pos);
    seat.assign(label);
    const seats = this._getAroundSeatsCoordsByIndex(pos);
    const prevNearSeats = cloneDeep(seats);
    for (const nearSeat of seats) {
      if (nearSeat && nearSeat.isFree()) {
        nearSeat.off();
      }
    }
    return {error: false, prevSeat: check.seat, currSeat: seat, prevNearSeats: prevNearSeats, currNearSeats: seats};
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