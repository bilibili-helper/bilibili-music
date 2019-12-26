/**
 * Author: DrowsyFlesh
 * Create: 2019/12/25
 * Description:
 */
export class Logger {
    constructor(namespace, level) {
        this.namespace = namespace;
        this.level = level;
    }

    generateMessage(message) {
        return `${this.namespace}: ${message}`;
    }

    debug(message) {
        //eslint-disable-next-line no-console
        console.debug(this.generateMessage(message));
    }

    info(message) {
        console.info(this.generateMessage(message));
    }

    notice(message) {
        console.warn(this.generateMessage(message));
    }

    warn(message) {
        console.warn(this.generateMessage(message));
    }

    error(message) {
        console.error(this.generateMessage(message));
    }
}
