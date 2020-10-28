const log4js = require('log4js');
const log = log4js.getLogger('Simulation');
const EventEmitter = require('events');

class Run extends EventEmitter {
    /**
     *
     * @param {object} agent
     * @param {Pullman} pullman
     * @param {Booking} booking
     */
    constructor(agent, pullman, booking) {
        super();
        this.agent = agent;
        this.pullman = pullman;
        this.bookings = booking;
        this.score = 0;
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
        this._loop().catch((error) => {
            log.error(error);
            this.end('error');
        });
    }

    /**
     * Agent move
     * @param row
     * @param col
     * @param label
     * @private
     */
    async _move(row, col, label) {
        await this._sleep(0);
        if (!this.pullman.pickSeat(row, col, label)) {
            this.end('died');
            this.score = -100;
        } else {
            this.score = this.pullman.countScore();
        }
    }

    /**
     * Main loop
     * @private
     */
    async _loop() {
        const booking = this.bookings.getNext();

        if (!booking || this.pullman.countFreeSeats() === 0) {
            this.end('finish');
        } else {
            const {people, label} = booking;
            for (let i = 1; i <= people; i++) {
                const agentInput = this._getInputsForAgent(i, people, label);
                const agentOutput = this.agent.compute(agentInput);
                const output = this._getOutputsFromAgent(agentOutput);
                await this._move(output.row, output.col, label);
            }
        }
        if (this.isRunning()) {
            await this._loop();
        }
    }

    /**
     * ends run
     * @param event
     */
    end(event) {
        this.running = false;
        this.emit(event, {reason: event, score: this.pullman.countScore()});
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
        inputs.push(i/people);
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

    _sleep(millisecond) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), millisecond);
        })
    }
}

module.exports = Run;