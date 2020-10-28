const log4js = require('log4js');
const log = log4js.getLogger('Simulation');
const cloneDeep = require('lodash.clonedeep');
const NeuroEvolution = require('../libraries/Neuroevolution');
const Pullman = require('./Pullman');
const Booking = require('./Booking');
const Run = require('./Run');

const DEBUG = false;
const SHOW_OFF = 0;
const SHOW_SIMPLE = 1;
const SHOW_FULL = 2;
const SHOW_BEST_AGENT = true;

class Simulation {
    constructor() {
        this.pullman = new Pullman();
        this.fixedSeed = 1;
        this.fps = 60;
        this.delay = 1000 / this.fps;
        this.show = SHOW_FULL;
        this.loopInterval = null;
        this.countGeneration = 0;
        this.maxGeneration = DEBUG ? 2 : 10000;
        this.recordScore = 0;
        this.bestScore = 0;
        this.runs = [];
        this.runToDisplay = 0;
        this.running = 0;
        this.population = DEBUG ? 5 : 50;
        this.dead = 0;
        this.winners = 0;

        let inputNode = this.pullman.getCells().length; // for pullman cells status
        inputNode += 1; // for group sizing
        const outputNode = 2; // for row, col

        console.log('inputNode', inputNode);

        this.net = new NeuroEvolution({
            population: this.population,
            network: [inputNode, [100, 50, 25], outputNode],
        });
    }

    /**
     *
     */
    start() {
        log.info('Simulation is starting');
        this._runNextGeneration();

        this._loop(true);
        this.loopInterval = setInterval(() => {
            this._loop();
        }, this.delay);
    }


    /**
     *
     * @param first
     * @private
     */
    _loop(first) {
        this._checkScores();
        this._display(first);
    }

    /**
     *
     */
    stop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
        }
        log.info('Simulation end. Best Score: ' + this.recordScore);
    }

    /**
     *
     * @private
     */
    _runNextGeneration() {
        if (this.countGeneration < this.maxGeneration) {
            const gen = this.net.nextGeneration();
            const booking = new Booking(this.fixedSeed).generate();
            this.bestScore = 0;
            this.runToDisplay = 0;
            this.dead = 0;
            this.winners = 0;
            this.runs.forEach((r) => r.removeAllListeners());
            this.runs = [];
            gen.forEach((g, i) => {
                const r = new Run(g, cloneDeep(this.pullman), cloneDeep(booking));
                this.runs.push(r);
                r.once('died', (result) => this._runEnded(result));
                r.once('finish', (result) => this._runEnded(result));
                r.start();
            });
            this.countGeneration++;
        } else {
            this.stop();
        }
    }

    /**
     *
     * @private
     */
    _allRunsEnded() {
        this.runs.forEach((r) => this.net.networkScore(r.getAgent(), r.getScore()));
        this._runNextGeneration();
    }

    /**
     *
     * @param {string} reason
     * @param {number} score
     * @private
     */
    _runEnded({reason, score}) {
        switch (reason) {
            case 'died':
                this.dead++;
                break;
            case 'finish':
                this.winners++;
                break;
        }

        if (this.dead + this.winners >= this.population) {
            this._allRunsEnded();
        }
    }

    /**
     *
     * @private
     */
    _checkScores() {
        if (SHOW_BEST_AGENT) {
            let best = 0;
            for (let i = 0; i < this.runs.length; i++) {
                if (this._checkBestScore(this.runs[i].getScore())) {
                    best = i;
                }
            }
            this.runToDisplay = best;
        }
    }

    /**
     *
     * @param score
     * @returns {boolean}
     * @private
     */
    _checkBestScore(score) {
        if (score > this.recordScore) {
            this.recordScore = score;
        }

        if (score > this.bestScore) {
            this.bestScore = score;
            return true;
        }
        return false;
    }

    /**
     *
     * @param first
     * @private
     */
    _display(first) {
        if (this.show) {
            const run = this.runs[this.runToDisplay];
            process.stdout.write(`\x1b[2J`); // blank screen
            process.stdout.write(`Bookings: ${run.getBookings()}\n`);
            process.stdout.write(`Gen: ${this.countGeneration}/${this.maxGeneration} Agent: ${this.runToDisplay} Running: ${this.population - this.winners - this.dead} Winners: ${this.winners} Dead: ${this.dead}\n`);
            if (this.show === SHOW_FULL) {
                const pullmanDisplay = run.getPullman().display();
                for (const l of pullmanDisplay) {
                    process.stdout.write(`${l}\n`);
                }
            }
            process.stdout.write(`Score: ${run.getScore()} Best: ${this.bestScore} Record: ${this.recordScore} Free Seats: ${run.getPullman().countFreeSeats()} \n`);
        }
    }
}

module.exports = new Simulation();