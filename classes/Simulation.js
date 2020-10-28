const log4js = require('log4js');
const log = log4js.getLogger('Simulation');
const cloneDeep = require('lodash.clonedeep');
const NeuroEvolution = require('../libraries/Neuroevolution');
const Pullman = require('./Pullman');
const Booking = require('./Booking');
const Run = require('./Run');

const DEBUG = false;

class Simulation {
    constructor() {
        this.pullman = new Pullman();
        this.fps = 60;
        this.delay = 1000 / this.fps;
        this.show = true;
        this.loopInterval = null;
        this.countGeneration = 0;
        this.maxGeneration = DEBUG ? 1 : 1000;
        this.recordScore = 0;
        this.maxScore = 0;
        this.runs = [];
        this.runToDisplay = 0;
        this.running = 0;
        this.population = DEBUG ? 1 : 30;

        let inputNode = this.pullman.getCells().length; // for pullman cells status
        inputNode += 1; // for group sizing
        const outputNode = 2; // for row, col

        this.net = new NeuroEvolution({
            population: this.population,
            //TODO sperimentare diverse forme di rete
            network: [inputNode, [15, 15, 15], outputNode],
            elitism: 0.3,
            nbChild: 2
        });
    }

    /**
     *
     */
    start() {
        log.info('Simulation is starting');
        this._prepareNewRuns();
        this.runs.forEach((r) => {
            r.start();
            this.running++;
        });

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

        if (this.show) {
            this._display(first);
        }
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
    _prepareNewRuns() {
        if (this.countGeneration < this.maxGeneration) {
            const gen = this.net.nextGeneration();
            const booking = new Booking().generate();
            this.maxScore = 0;
            this.runToDisplay = 0;
            this.running = 0;
            this.runs.forEach((r) => r.removeAllListeners());
            this.runs = [];
            gen.forEach((g, i) => {
                const r = new Run(g, cloneDeep(this.pullman), cloneDeep(booking));
                r.once('died', (result) => this._runEnded(result));
                r.once('finish', (result) => this._runEnded(result));
                this.runs.push(r);
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
        this._prepareNewRuns();
    }

    /**
     *
     * @param {string} reason
     * @param {number} score
     * @private
     */
    _runEnded({reason, score}) {
        // log.info(`An agent ${reason} with score: ${score}`);
        this.running--;

        if (this.running === 0) {
            this._allRunsEnded();
        }
    }

    /**
     *
     * @private
     */
    _checkScores() {
        this.runs.forEach((r, i) => {
            if (this._checkBestScore(r.getScore())) {
                this.runToDisplay = i;
            }
        });
    }

    /**
     *
     * @param score
     * @returns {boolean}
     * @private
     */
    _checkBestScore(score) {
        if (score > this.maxScore) {
            this.maxScore = score;
            if (score > this.recordScore) {
                this.recordScore = score;
            }
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
        const run = this.runs[this.runToDisplay];
        const pullmanDisplay = run.getPullman().display();
        const lines = pullmanDisplay.length + 2;
        const goUpLines = `\x1b[<${lines}>A`;
        if (!first) {
            process.stdout.write(goUpLines);
        }

        process.stdout.write(`Gen: ${this.countGeneration}/${this.maxGeneration} Agent: ${this.runToDisplay} Living: ${this.running}/${this.population}\n`);
        for (const l of pullmanDisplay) {
            process.stdout.write(`${l}\n`);
        }
        process.stdout.write(`Score: ${run.getScore()} Free: ${run.getPullman().countFreeSeats()} Record: ${this.recordScore}\n`);
    }
}

module.exports = new Simulation();