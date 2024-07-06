const SourceVersionControl = require("../../svc/main");
const Hashtable = require("../../utils/data-structure/hash-table");
const SmartArray = require("../../utils/data-structure/smart-array");
const HardwareController = require("./hardware-controller");
const HardwareException = require("./hardware-exception");

class HardwareBaseConstructor {
    modeTable = new Hashtable();
    modeCurrent = new SmartArray(0);

    set_register_by_name(name, value) {
        if (name in this.registers) {
            if (this.registers[name] instanceof BigUint64Array) {
                value = BigInt(value);
            }

            this.registers[name].set([value]);
        } else {
            HardwareException.except(`Register '${name}' not found`);
        }
    }

    mode(number) {
        const controller = new HardwareController();
        const drivers = controller.getListOfDrivers();

        if (number > drivers.length) {
            HardwareException.except(`Mode '${number}' not found`);
        }

        const svc = new SourceVersionControl();

        if (number == 0) {
            this.modeCurrent.pop();
            this.modeCurrent.push(0);
            let hash, commit;

            if ((hash = this.modeTable.last(0)) != undefined) {
                if ((commit = svc.repository_reset(hash))) {
                    this.registers = { ...commit.changes.registers };
                }
            }

        } else {
            const DRIVER_NAME = drivers[number - 1];
            const DRIVER_GET = controller.getDriver(DRIVER_NAME);
            
            if (DRIVER_GET) {
                const DRIVER_INSTANCE = new DRIVER_GET;
                const changes = { registers: this.registers };

                const hash = svc.repository_add(changes, `Set mode '${DRIVER_NAME}'`);
                svc.repository_push();
                this.modeTable.set(this.modeCurrent.last(), hash);
                this.modeCurrent.push(number);

                this.registers = { ...this.registers, ...DRIVER_INSTANCE.registers };
            } else {
                HardwareException.except(`Driver '${DRIVER_NAME}' not found`);
            }
        }
    }
}

module.exports = HardwareBaseConstructor;