const log4js = require('log4js');
const log = log4js.getLogger('Simulation');

const Pullman = require('./Pullman');

class Simulation {
    constructor() {
        this.pullman = new Pullman();
        this.fps = 60;
        this.delay = 1000 / this.fps;
        this.show = true;
        this.loopInterval = null;
    }

    async run() {
        log.info('Simulation is starting');
        this.loop();
        await this.sleep(1000);
        this.pullman.pickSeat(0,0, 'A');
        await this.sleep(1000);
        this.pullman.pickSeat(2,0, 'B');
        await this.sleep(1000);
        this.pullman.pickSeat(4,0, 'C');
        await this.stop();
        log.info('Simulation end. Score: ' + this.pullman.getScore());
    }

    sleep(amount = undefined) {
        return new Promise((resolve) => {
            if (this.show) {
                setTimeout(() => resolve(), amount || this.delay);
            } else {
                resolve();
            }
        });
    }

    loop() {
        if (this.show) {
            this.display(true);
            this.loopInterval = setInterval(() => {
                this.display();
            }, this.delay);
        }
    }

    async stop() {
        await this.sleep();
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
        }
    }

    display(first) {
        const lines = this.pullman.display();
        const goUpLines = `\x1b[<${lines.length}>A`;
        if (!first) {
            process.stdout.write(goUpLines);
        }
        for (const l of lines) {
            process.stdout.write(`${l}\n`);
        }
    }
}

module.exports = new Simulation();