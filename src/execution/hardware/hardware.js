const RuntimeException = require("../exception/runtime.exception");
const HardwareException = require("./hardware-exception");

class Hardware {
    constructor () { 
        this.startPoint = 0x0000_0000;
        this.maxsize = 0xFFFFFFFF;
        this.size = this.maxsize / 5;
        this.kernel = new Uint8Array(this.size);
        this.memory = new Uint16Array(this.size);
        this.stack = new Uint16Array(this.size);
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

        this.usedHeapSize = 0x0000_0000;
        this.usedPointersForHeap = [];

        this.registers = {
            $ax: new Uint16Array(1),
            $sp: new Uint16Array(1)
        };

        this.NULL_TERMINATOR = 0x00;

        if (Hardware.instance) {
            return Hardware.instance;
        }
        
        Hardware.instance = this;
    }

    #typeid = {
        uint8: 'uint8', uint16: 'uint16',  uint32: 'uint32', uint64: 'uint64'
    }

    set_register_$ax(value) {
        this.registers.$ax.set([value]);
    }

    get_register_$ax() {
        return this.registers.$ax[0];
    }

    set_register_$sp(value) {
        this.registers.$sp.set([value]);
    }

    #set_register_$sp() {
        this.registers.$sp.set([this.stackPhysicalPointer]);
    }

    get_register_$sp() {
        return this.registers.$sp[0];
    }

    get_register_by_name(name) {
        if (name in this.registers) {
            return this.registers[name];
        }

        HardwareException.except(`Register '${name}' not found`);
    }

    randomAddress() {
        return Math.floor(Math.random() * 0x1000_0000);
    }

    randomAddressByRange(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    #gen_random_uint16() {
        return Math.floor(Math.random() * 65536);
    }

    ostream_stdout() {
        const value_ptr = this.stack_pop();

        if (this.#memory_micro_operation_pull_byte_by_pointer(value_ptr) == 0x00) {
            const bytes = this.memory_dump(value_ptr + 0x1);

            if (bytes.length > 1) {
                console.log(`[${bytes.map(b => `0x${b.toString(16)}`).join(', ')}]`);
            } else {
                console.log(`0x${bytes[0].toString(16)}`);
            }
        } else {
            const bytes = this.memory_dump(value_ptr);
            console.log(bytes.map(b => String.fromCharCode(b)).join(''));
        }
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
            HardwareException.except("Stack overflow");
        }

        // instert address in stack for memory reading
        this.#stack_micro_operation_push(this.memoryPhysicalPointer);
        this.#set_register_$sp();

        if (value instanceof Uint16Array) {
            if (value.length == 1) {
                this.#memory_micro_operation_push(this.NULL_TERMINATOR);
                this.#memory_micro_operation_push(value[0]);
            }
        } else if (typeof value === "string") {
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
        this.#set_register_$sp();
        return ptr_;
    }

    memory_dump(ptr) {
        let bytes = [];

        while (this.#memory_micro_operation_pull_byte_by_pointer(ptr)) {
            bytes.push(this.#memory_micro_operation_pull_byte_by_pointer(ptr));
            ptr = (ptr + 0x1) & this.maxsize;
        }

        return bytes;
    }

    #fetch_typeid(size) {
        if (size > 0 && size < 256) {
            return this.#typeid.uint8;
        } else if (size >= 256 && size < 65536) {
            return this.#typeid.uint16;
        } else if (size >= 65536 && size < 0x10000_0000) {
            return this.#typeid.uint32;
        } else if (size >= 0x10000_0000) {
            return this.#typeid.uint64;
        } else {
            HardwareException.except(`Invalid size: ${size}`);
        }
    }

    malloc(size) {
        if (this.usedHeapSize >= this.commonAreaSize) {
            HardwareException.except(`Heap overflow`);
        }

        const malloc_value_type = this.#fetch_typeid(size);

        if (![this.#typeid.uint8, this.#typeid.uint16].includes(malloc_value_type)) {
            HardwareException.except(
                `first argument of '${this.#typeid.uint16} malloc(${this.#typeid.uint8} size)' should be '${this.#typeid.uint8}'`,
                `first argument of '${this.#typeid.uint16} malloc(${this.#typeid.uint16} size)' should be '${this.#typeid.uint16}'`
            );
        }

        let ptr_uint16 = this.#gen_random_uint16();

        if (malloc_value_type === this.#typeid.uint8) {
            while (this.usedPointersForHeap.includes(ptr_uint16)) {
                ptr_uint16 = this.#gen_random_uint16();
            }

            this.usedPointersForHeap.push(ptr_uint16);
            this.usedPointersForHeap.push(ptr_uint16 + 0x1);

            this.usedHeapSize += 0x3;
        } else if (malloc_value_type === this.#typeid.uint16) {
            while ([
                this.usedPointersForHeap.includes(ptr_uint16),
                this.usedPointersForHeap.includes(ptr_uint16 + 0x1)
            ].every(Boolean)) {
                ptr_uint16 = this.#gen_random_uint16();
            }

            this.usedPointersForHeap.push(ptr_uint16);
            this.usedPointersForHeap.push(ptr_uint16 + 0x1);
            this.usedPointersForHeap.push(ptr_uint16 + 0x2);

            this.usedHeapSize += 0x4;
        }

        this.usedPointersForHeap.push(0x0);
        
        // instert address in stack for heap reading
        this.#stack_micro_operation_push(ptr_uint16);
        this.#set_register_$sp();

        return ptr_uint16;
    }
}

module.exports = Hardware;