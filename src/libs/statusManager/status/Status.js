/**
 * Author: DrowsyFlesh
 * Create: 2019-05-15
 * Description:
 */
export class Status {
    pass = false;
    msg = '';
    relatedFeatures = [];
    hasChecked = false;

    error;
    description;

    constructor(name) {
        this.name = name;
        this.addListener();
    }

    get currentStatus() {
        return {pass: this.pass, msg: this.msg};
    }

    check() {
    }

    setStatus(pass, msg) {
        this.pass = pass;
        this.msg = msg;
    }

    updatePermission = (name, pass, msg) => {
        if (this.pass !== pass) {
            this.pass = pass;
            this.setStatus(pass, msg);
            chrome.runtime.sendMessage({
                command: 'permissionUpdate',
                permission: name,
                value: pass,
                msg,
            });
        }
        this.triggerListener(name, pass, msg);
    };

    // 当权限系统检测到变化时进行通知
    triggerListener = (name, value, msg) => {
        this.relatedFeatures.map((feature) => {
            feature.setPermission(name, value, msg);
        });
    };

    addListener() {

    }

    addFeature(feature) {
        this.relatedFeatures.push(feature);
        return this.relatedFeatures;
    }
}
