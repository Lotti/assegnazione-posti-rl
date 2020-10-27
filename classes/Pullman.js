const log4js = require('log4js');
const log = log4js.getLogger('Pullman');

const {Seat, Void} = require('./Seat');

const maxTile = 17+7;
const seatsRow = (seats) => {
    if (seats.length > maxTile) {
        throw new Error(`seats must be <= ${maxTile}`);
    }
    const seatsRow = [];
    for (const v of seats) {
        seatsRow.push(v ? new Seat() : new Void());
    }
    return seatsRow;
}

class Pullman {
    constructor() {
        const pullmanLayer = [
            seatsRow([1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1]),
            seatsRow([1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1]),
            seatsRow([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
            seatsRow([1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1]),
            seatsRow([1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1])
        ];

        this.seatsConfig = pullmanLayer;
        this.seats = pullmanLayer.flat().filter((s) => s instanceof Seat);
    }

    getScore() {
        return this.seats.reduce((points = 0, s) => {
            if (points instanceof Seat) {
                return points.getPoints() + s.getPoints();
            }
            return points + s.getPoints();
        });
    }

    getSeat(row, col) {
        if (this.seatsConfig[row] && this.seatsConfig[row][col]) {
            return this.seatsConfig[row][col];
        }
        return undefined;
    }

    checkSeat(row,col) {
        const chosenSeat = this.getSeat(row, col);
        return chosenSeat.isAvailable();
    }

    pickSeat(row, col, label) {
        if (this.checkSeat(row, col)) {
            this.getSeat(row, col).setAssign(label);
            if (this.getSeat(row + 1, col)) {
                this.getSeat(row + 1, col).setOff();
            }
            if (this.getSeat(row, col + 1)) {
                this.getSeat(row, col + 1).setOff();
            }
            if (this.getSeat(row - 1, col)) {
                this.getSeat(row - 1, col).setOff();
            }
            if (this.getSeat(row, col - 1)) {
                this.getSeat(row, col - 1).setOff();
            }
        } else {
            throw new Error(`can't pick seat (${row},${col}) because is not available!`);
        }
    }

    display() {
        return [
            '_'.repeat(maxTile*2-1),
            ...this.seatsConfig.map((s) => `|${s.join(' ')}|`),
            '‾'.repeat(maxTile*2+1),
        ];
    }
}

module.exports = Pullman;