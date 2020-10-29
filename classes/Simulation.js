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

class Simulation {
    constructor() {
        this.pullman = new Pullman();
        this.fixedSeed = 1;
        this.fps = 120;
        this.delay = 1000 / this.fps;
        this.show = SHOW_FULL;
        this.loopInterval = null;
        this.countGeneration = 0;
        this.recordScore = 0;
        this.bestScore = 0;
        this.runs = [];
        this.runToDisplay = 0;
        this.running = 0;
        this.dead = 0;
        this.winners = 0;


        let inputNode = this.pullman.getCells().length; // for pullman cells status
        inputNode += 1; // for group sizing
        const outputNode = 2; // for row, col

        this.maxGeneration = DEBUG ? 2 : 10000;
        this.population = DEBUG ? 5 : 50;
        this.net = new NeuroEvolution({
            population: this.population,
            network: [inputNode, [100, 50, 10], outputNode],
            elitism: 0.2, // Best networks kepts unchanged for the next
            // generation (rate).
            randomBehaviour: 0.2, // New random networks for the next generation
            // (rate).
            mutationRate: 0.2, // Mutation rate on the weights of synapses.
            mutationRange: 0.5, // Interval of the mutation changes on the
            // synapse weight.
            historic: 0, // Latest generations saved.
            lowHistoric: false, // Only save score (not the network).
            scoreSort: -1, // Sort order (-1 = desc, 1 = asc).
            nbChild: 3 // Number of children by breeding.
        });
    }

    /**
     *
     */
    start() {
        log.info('Simulation is starting');
        this._loop(true);
        this.loopInterval = setInterval(() => {
            this._loop();
        }, this.delay);

        this._runNextGeneration();
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
            const generation = this.net.nextGeneration();
            const booking = new Booking(this.fixedSeed).generate();
            this.bestScore = 0;
            // this.runToDisplay = 0;
            this.dead = 0;
            this.winners = 0;
            this.runs = {};
            generation.forEach((agent, i) => {
                const r = new Run(i, agent, cloneDeep(this.pullman), cloneDeep(booking));
                this.runs[i] = r;
                r.once('dead', (result) => this._runEnded(result));
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
        this._runNextGeneration();
    }

    /**
     * @param {number} index
     * @param {string} reason
     * @param {object} agent
     * @param {number} score
     * @private
     */
    _runEnded({reason, index, agent, score}) {
        if (reason === 'dead') {
            this.dead++;
        } else if (reason === 'finish') {
            this.winners++;
        } else {
            throw new Error('unmanaged reason');
        }

        if (score > this.recordScore) {
            this.recordScore = score;
        }
        this.net.networkScore(agent, score);
        this.runs[index].removeAllListeners();
        delete this.runs[index];
        if (this.howManyRunning() === 0) {
            this._allRunsEnded();
        }
    }

    howManyRunning() {
        return Object.keys(this.runs).length;
    }

    /**
     *
     * @private
     */
    _checkScores() {
        let best = this.runToDisplay;
        this.bestScore = 0;
        const keys = Object.keys(this.runs);
        for (const i of keys) {
            const score = this.runs[i].getScore();
            if (score > this.bestScore) {
                this.bestScore = score;
                best = i;
            }
        }
        this.runToDisplay = best;
    }

    /**
     *
     * @param first
     * @private
     */
    _display(first) {
        if (this.show !== SHOW_OFF && this.howManyRunning() > 0) {
            const run = this.runs[this.runToDisplay];
            process.stdout.write(`\x1b[2J`); // blank screen
            process.stdout.write(`Gen: ${this.countGeneration}/${this.maxGeneration} Agent: ${this.runToDisplay} Running: ${this.howManyRunning()} Winners: ${this.winners} Dead: ${this.dead}\n`);
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