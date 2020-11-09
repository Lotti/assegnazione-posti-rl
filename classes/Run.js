const log4js = require('log4js');
const log = log4js.getLogger('Simulation');
const EventEmitter = require('events');

class Run extends EventEmitter {
    static BUSY_SEAT_POINTS = 50;
    static OFF_SEAT_POINTS = 100;
    static STARTING_SCORE = 100;
    static ERROR_PENALTY = -25;
    static MAX_ERRORS = 5;

    /**
     *
     * @param {number} index
     * @param {object} agent
     * @param {Pullman} pullman
     * @param {Booking} booking
     */
    constructor(index, agent, pullman, booking) {
        super();
        this.index = index;
        this.agent = agent;
        this.pullman = pullman;
        this.bookings = booking;
        this.score = Run.STARTING_SCORE;
        this.running = false;
        this.errors = 0;
        this.currentBooking = null;
    }

    /**
     * get current agent
     * @returns {Object}
     */
    getAgent() {
        return this.agent;
    }

    /**
     * is running?
     * @returns {boolean}
     */
    isRunning() {
        return this.running;
    }

    /**
     * get current score
     * @returns {number}
     */
    getScore() {
        return this.score;
    }

    /**
     * get pullman ref
     * @returns {Pullman}
     */
    getPullman() {
        return this.pullman;
    }

    getBookings() {
        return this.bookings;
    }

    /**
     * starts run
     */
    start() {
        this.running = true;
        this._loop();
    }

    /**
     * stops run
     */
    stop() {
        this.running = false;
    }

    /**
     * Agent move
     * @param people
     * @param label
     * @private
     */
    _move(people, label) {
        const results = [];
        let error = false;
        for (let i = 0; i < people; i++) {
            const agentInput = this._getInputsForAgent(i, people, label);
            const agentOutput = this.agent.compute(agentInput);
            const output = this._getOutputsFromAgent(agentOutput);
            // const result = this.pullman.pickSeat(output.row, output.col, label);
            const result = this.pullman.pickSeatByIndex(output.pos, label);
            this._scoring(result);
            results.unshift(result);
            if (result.error) {
                error = true;
                break;
            }
        }

        if (error) {
            // reverting pullman's seats status
            for (const r of results) {
                r.currSeat.setState(r.prevSeat.getState());
                for (let i = 0; i < r.currNearSeats.length; i++) {
                    r.currNearSeats[i].setState(r.prevNearSeats[i].getState());
                }
            }
        }
        return error;
    }

    /**
     *
     * @param error
     * @param prevSeat
     * @param currSeat
     * @private
     */
    _scoring({error, prevSeat, currSeat}) {
        if (error) {
            this.score += Run.ERROR_PENALTY;
            this.errors++;
            if (this.errors >= Run.MAX_ERRORS) {
                // this.score = Math.round(this.score / 2);
                this._end('dead');
            }
        } else if (currSeat.isBusy()) {
            this.score += Run.BUSY_SEAT_POINTS;
            if (prevSeat.isOff()) {
                this.score += Run.OFF_SEAT_POINTS;
            }
        }
        return error;
    }

    /**
     * Main loop
     * @private
     */
    _loop() {
        if (this.isRunning()) {
            setImmediate(() => {
                if (this.currentBooking === null) {
                    this.currentBooking = this.bookings.getNext();
                }
                if (this.currentBooking === undefined || this.pullman.countFreeSeats() === 0) {
                    this._end('finish');
                } else {
                    const {people, label} = this.currentBooking;
                    const error = this._move(people, label);
                    if (!error) {
                        this.currentBooking = this.bookings.getNext();
                    }
                }
                this._loop();
            });
        }
    }

    /**
     * ends run
     * @param event
     */
    _end(event) {
        this.stop();
        setImmediate(() => {
            this.emit(event, {reason: event, index: this.index, agent: this.agent, score: this.score});
        });
    }

    /**
     * retrieves and converts inputs that will be used with agent
     * @param {number} i
     * @param {number} people
     * @param {string} label
     * @returns {number[]}
     * @private
     */
    _getInputsForAgent(i, people, label) {
        const inputs = [];
        // adding pullman cells status
        const normalizedCells = this.pullman.getSeatsStatusByLabel(label);
        inputs.push(...normalizedCells);
        // adding current booking info
        inputs.push(i / people);
        return inputs;
    }

    /**
     * converts output coming from agent
     * @param {number[]} agentOutput
     // * @returns {{col: number, row: number}}
     * @returns {{pos: number}}
     * @private
     */
    _getOutputsFromAgent(agentOutput) {
        // const {rows, cols} = this.pullman.getSizes();
        const seats = this.pullman.getSeats().length
        /*
        return {
            row: Math.floor(agentOutput[0] * rows),
            col: Math.floor(agentOutput[1] * cols),
        };
        */
        return {
            pos: Math.floor(agentOutput[0] * seats),
        }
    }
}

module.exports = Run;