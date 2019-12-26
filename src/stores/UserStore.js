/**
 * Author: DrowsyFlesh
 * Create: 2019/12/25
 * Description:
 */
import {Store} from 'Libs/Store';

export class UserStore extends Store {
    constructor() {
        super('user');
        this.currentUser = null;
    }

    init() {
        super.init([
            {
                name: 'bilibili',
                value: [],
            },
        ]);
    }

    addListener() {

    }

    initUser() {
        // bilibili

    }

    //login(username, password) {
    //
    //}

    logout() {

    }
}
