const path = require('path');
const log4js = require('log4js');
log4js.configure(path.join(__dirname, 'log4js.json'));
const log = log4js.getLogger('index');

const simulation = require('./classes/Simulation');

simulation.start();