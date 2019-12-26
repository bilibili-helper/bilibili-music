/**
 * Author: DrowsyFlesh
 * Create: 2019/12/25
 * Description:
 */
import store from 'store';
import {Logger} from 'Utils/logger';

export class Store {
    constructor(name, options) {
        this.name = name;
        this.store = {
            default: {},
        };
        this.options = options || {
            local: false,
        };

        this.logger = new Logger(`Store-${name}`);

        this.init();
    }

    createStore(name, value = {}) {
        this.store[name] = value;
        return this.saveStoreKeys();
    }

    createStores(kv) {
        if (kv instanceof Array) {
            kv.forEach(({name, value}) => this.store[name] = value);
            return this.saveStoreKeys();
        } else {
            this.logger.error(`error params when create stores`);
        }
    }

    getStore(name) {
        return this.store[name];
    }

    setStore(name, value) {
        this.store[name] = value;
        return this;
    }

    storeKeys() {
        return store.get(`${this.name}-keys`);
    }

    saveStore(name) {
        if (this.store[name] !== undefined) {
            store.set(`${this.name}-${name}`, this.store[name]);
        } else {
            this.logger.debug(`store names ${name} is not exist`);
        }
        return this;
    }

    saveStoreKeys() {
        const keys = Object.keys(this.store);
        if (keys && keys instanceof Array) {
            store.set(`${this.name}-keys`, keys);
        }
        return this;
    }

    init(defaultKeys = []) {
        const storeKeys = this.storeKeys();
        if (storeKeys && storeKeys instanceof Array) {
            storeKeys.forEach(name => {
                const newStore = store.get(`${this.name}-${name}`);
                if (newStore) {
                    this.store[name] = newStore;
                } else {
                    this.logger.debug(`store names ${name} is not exist`);
                }
            });
        } else if (defaultKeys && defaultKeys instanceof Array && defaultKeys.length > 0) {
            this.createStores([...defaultKeys]);
        } else {
            this.store['default'] = {};
            this.saveStore('default').saveStoreKeys();
        }
    }
}
