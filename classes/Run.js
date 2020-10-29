const log4js = require('log4js');
const log = log4js.getLogger('Simulation');
const EventEmitter = require('events');

class Run extends EventEmitter {
    static BUSY_SEAT_POINTS = 10;
    static OFF_SEAT_POINTS = 15;
    static STARTING_SCORE = 10;
    static ERROR_PENALTY = -1;

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
     * @param i
     * @param people
     * @param label
     * @private
     */
    _move(i, people, label) {
        const agentInput = this._getInputsForAgent(i, people, label);
        const agentOutput = this.agent.compute(agentInput);
        const output = this._getOutputsFromAgent(agentOutput);
        const result = this.pullman.pickSeat(output.row, output.col, label);
        this._scoring(result);
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
        } else {
            if (currSeat.isBusy()) {
                this.score += Run.BUSY_SEAT_POINTS;
                if (prevSeat.isOff()) {
                    this.score += Run.OFF_SEAT_POINTS;
                }
            }
        }

        if (this.score === 0) {
            this._end('dead');
        }
    }


    /**
     * Main loop
     * @private
     */
    _loop() {
        if (this.isRunning()) {
            setImmediate(() => {
                const booking = this.bookings.getNext();
                if (!booking || this.pullman.countFreeSeats() === 0) {
                    this._end('finish');
                } else {
                    const {people, label} = booking;
                    for (let i = 1; i <= people; i++) {
                        this._move(i, people, label);
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
        const normalizedCells = this.pullman.getSeatStatusByLabel(label);
        inputs.push(...normalizedCells);
        // adding current booking info
        inputs.push(i / people);
        return inputs;
    }

    /**
     * converts output coming from agent
     * @param {number[]} agentOutput
     * @returns {{col: number, row: number}}
     * @private
     */
    _getOutputsFromAgent(agentOutput) {
        const {rows, cols} = this.pullman.getSizes();
        return {
            row: Math.floor(agentOutput[0] * rows),
            col: Math.floor(agentOutput[1] * cols),
        };
    }
}

module.exports = Run;