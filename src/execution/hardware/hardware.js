const RuntimeException = require("../exception/runtime.exception");

class Hardware {
    constructor () { 
        this.startPoint = 0x0000_0000;
        this.maxsize = 0xFFFFFFFF;
        this.size = this.maxsize / 5;
        this.kernel = new Uint8Array(this.size);
        this.memory = new Uint8Array(this.size);
        this.stack = new Uint8Array(this.size);
        this.heap = new Uint8Array(this.size);
        this.restrictedArea = new Uint8Array(this.size);

        this.commonAreaSize = this.size;

        this.memoryPointer = this.startPoint;
        this.stackPointer = this.memoryPointer + this.size;
        this.heapPointer = this.stackPointer + this.size;
        this.restrictedAreaPointer = this.heapPointer + this.size;

        this.memoryPhysicalPointer = 0x0000_0000;
        this.stackPhysicalPointer = 0x0000_0000;
        this.heapPhysicalPointer = 0x0000_0000;
        this.restrictedAreaPhysicalPointer = 0x0000_0000;

        this.NULL_TERMINATOR = 0x00;

        if (Hardware.instance) {
            return Hardware.instance;
        }
        
        Hardware.instance = this;
    }

    randomAddress() {
        return Math.floor(Math.random() * 0x1000_0000);
    }

    randomAddressByRange(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    #stack_micro_operation_push(value) {
        this.stack.set([value], this.stackPhysicalPointer);
        this.stackPhysicalPointer = (this.stackPhysicalPointer + 1) & this.maxsize;
    }

    #memory_micro_operation_push(value) {
        this.memory.set([value], this.memoryPhysicalPointer);
        this.memoryPhysicalPointer = (this.memoryPhysicalPointer + 1) & this.maxsize;
    }

    #stack_micro_operation_pull_address() {
        if (this.stackPhysicalPointer < 0) {
            RuntimeException.exceptMessage("Stack underflow");
        }

        return this.stack.at(this.stackPhysicalPointer - 1);
    }

    #memory_micro_operation_pull_byte_by_pointer(pointer) {
        return this.memory.at(pointer);
    }

    #stack_micro_operation_inc_address() {
        this.stackPhysicalPointer = (this.stackPhysicalPointer + 1) & this.maxsize;
    }

    #stack_micro_operation_dec_address() {
        this.stackPhysicalPointer = (this.stackPhysicalPointer - 1) & this.maxsize;
    }

    stack_push(value) {
        if (this.stackPhysicalPointer >= this.stackPointer) {
            RuntimeException.exceptMessage("Stack overflow");
        }

        // instert address in stack for memory reading
        this.#stack_micro_operation_push(this.memoryPhysicalPointer);

        if (typeof value === "string") {
            for (let i = 0; i < value.length; i++) {
                let charCode = value.charCodeAt(i);

                if (charCode > 0xFF) {
                    this.#memory_micro_operation_push(this.NULL_TERMINATOR);
                }
            
                this.#memory_micro_operation_push(charCode);
            }

            this.#memory_micro_operation_push(this.NULL_TERMINATOR);
        } else {
            value = value & 0xFF;
    
            this.#memory_micro_operation_push(value);
            this.#memory_micro_operation_push(this.NULL_TERMINATOR);
        }
    }
    
    stack_pop() {
        const ptr_ = this.#stack_micro_operation_pull_address();
        this.#stack_micro_operation_dec_address();
        return ptr_;
    }

    memory_dump(ptr) {
        let bytes = [];

        while (this.#memory_micro_operation_pull_byte_by_pointer(ptr)) {
            bytes.push(this.#memory_micro_operation_pull_byte_by_pointer(ptr));
            ptr = (ptr + 1) & this.maxsize;
        }

        return bytes;
    }
}

module.exports = Hardware;