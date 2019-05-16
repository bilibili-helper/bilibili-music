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

    updatePermission = (pass, msg) => {
        if (this.pass !== pass) {
            this.pass = pass;
            this.setStatus(pass, msg);
            chrome.runtime.sendMessage({
                command: 'permissionUpdate',
                permission: this.name,
                value: pass,
                msg,
            });
        }
        this.triggerListener(pass);
    };

    // 当权限系统检测到变化时进行通知
    triggerListener = (value) => {
        this.relatedFeatures.map((feature) => {
            if (feature.permissionMap[this.name] !== value) {
                feature.setPermission(this.name, value);
            }
        });
    };

    addListener() {

    }

    addFeature(feature) {
        this.relatedFeatures.push(feature);
        return this.relatedFeatures;
    }
}
