const typeid = require("../types/typeid");
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

        this.registers = {
            $ax: new Uint16Array(1),
            $sp: new Uint16Array(1),
            $eax: new Uint32Array(1),
            $ebx: new Uint32Array(1),
            $ecx: new Uint32Array(1),
            $edx: new Uint32Array(1),
            $esi: new Uint32Array(1),
            $edi: new Uint32Array(1),
            $esp: new Uint32Array(1),
            $ebp: new Uint32Array(1),
            $rax: new BigUint64Array(1),
            $rbx: new BigUint64Array(1),
            $rcx: new BigUint64Array(1),
            $rdx: new BigUint64Array(1),
            $rsi: new BigUint64Array(1),
            $rdi: new BigUint64Array(1),
            $rsp: new BigUint64Array(1),
            $rbp: new BigUint64Array(1)
        };

        this.flags = {
            $zf: new Uint8Array(1),
            $cf: new Uint8Array(1),
            $of: new Uint8Array(1)
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

    #typeid_movement = {
        reg: 'reg', mem: 'mem', imm: 'imm'
    }

    types = this.#typeid;
    types_movement = this.#typeid_movement;
    ostream_stdout_signals = { stream: 'stream' };

    #usedPointersForHeap = [];
    #usedPointersForMemory = [];

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

    set_register_$eax(value) {
        this.registers.$eax.set([value]);
    }

    set_register_$edx(value) {
        this.registers.$edx.set([value]);
    }

    set_flag_$zf(value) {
        this.flags.$zf.set([value]);
    }

    set_flag_$cf(value) {
        this.flags.$cf.set([value]);
    }

    set_flag_$of(value) {
        this.flags.$of.set([value]);
    }

    get_flag_$zf() {
        return this.flags.$zf[0];
    }

    get_register_by_name(name) {
        if (name in this.registers) {
            return this.registers[name];
        }

        HardwareException.except(`Register '${name}' not found`);
    }

    set_register_by_name(name, value) {
        if (name in this.registers) {
            this.registers[name].set([value]);
        } else {
            HardwareException.except(`Register '${name}' not found`);
        }
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

    #math_micro_operation_add(a, b) {
        return a + b;
    }

    #math_micro_operation_sub(a, b) {
        return a - b;
    }

    #math_micro_operation_mul(a, b) {
        return a * b;
    }

    #math_micro_operation_div(a, b) {
        return a / b;
    }
    
    math(opcode, args) {
        if (args.length > 0x06) {
            HardwareException.except(`Too many arguments in ${opcode}`);
        }

        for (let index = 0; index < args.length; index++) {
            const num_t = this.#fetch_typeid(args[index]);

            if (typeof num_t == 'number') {
                continue;
            }

            if (!Object.values(this.#typeid).includes(num_t)) {
                HardwareException.except(`Cannot find type ${num_t}`);
            }
        }

        let result_raw = args[0];
        args.shift();

        switch (opcode) {
            case 'add':
                result_raw = args.reduce(this.#math_micro_operation_add, result_raw);
                break;

            case 'sub':
                result_raw = args.reduce(this.#math_micro_operation_sub, result_raw);
                break;

            case 'mul':
                result_raw = args.reduce(this.#math_micro_operation_mul, result_raw);
                break;

            case 'div':
                result_raw = args.reduce(this.#math_micro_operation_div, result_raw);
                break;

            default:
                break;
        }

        const result_t = this.#fetch_typeid(result_raw);
        let $eax, $edx;

        if (result_t == this.#typeid.uint64) {
            $eax = result_raw >> 32;
            $edx = result_raw & 0x0000_0000_0000_ffff;
        } else {
            $eax = result_raw;
            $edx = 0x0000_0000;
        }

        this.set_register_$eax($eax);
        this.set_register_$edx($edx);

        return [$eax, $edx];
    }

    inc(arg) {
        if (arg?.type != this.#typeid_movement.reg) {
            HardwareException.except(
                'Expected register',
                `first argument of 'inc $reg' instruction should be '$reg'`
            );
        }

        const register_value = this.get_register_by_name(arg.name)[0];

        if ((register_value + 1) == this.#fetch_maxsize_typeid_by_name(this.#fetch_typeid(this.get_register_by_name(arg.name)))) {
            this.set_register_by_name(arg.name, 0);
        } else {
            this.set_register_by_name(arg.name, register_value + 1);
        }
    }

    dec(arg) {
        if (arg?.type != this.#typeid_movement.reg) {
            HardwareException.except(
                'Expected register',
                `first argument of 'dec $reg' instruction should be '$reg'`
            );
        }

        const register_value = this.get_register_by_name(arg.name)[0];

        if ((register_value - 1) == -1) {
            this.set_register_by_name(arg.name, 0);
        } else {
            this.set_register_by_name(arg.name, register_value - 1);
        }
    }

    ostream_stdout(stdsig_t) {
        const value_ptr = this.stack_pop();
        
        if (this.#memory_micro_operation_pull_byte_by_pointer(value_ptr) == this.NULL_TERMINATOR) {
            const bytes = this.memory_dump(value_ptr + 0x01);

            if (bytes.length == 0) {
                console.log("null");
                return;
            } else if (bytes.length == 1) {
                // 16-bit or 8-bit
                const num_t = bytes[0];

                if (stdsig_t == this.ostream_stdout_signals.stream) {
                    process.stdout.write(`${num_t}`);
                } else {
                    console.log(`0x${num_t.toString(16).padStart(8, 0)}`);
                }

            } else if (bytes.length == 2) {
                // 32-bit
                const num_t = (bytes[1] << 16) | bytes[0];

                if (stdsig_t == this.ostream_stdout_signals.stream) {
                    process.stdout.write(`${num_t}`);
                } else {
                    console.log(`0x${num_t.toString(16).padStart(8, 0)}`);
                }

            } else if (bytes.length == 3) {
                // 64-bit
                const high = (bytes[4] << 24) | (bytes[3] << 16) | (bytes[2] << 8) | bytes[1];
                const low = (bytes[5] << 24) | (bytes[6] << 16) | (bytes[7] << 8) | bytes[8];

                if (stdsig_t == this.ostream_stdout_signals.stream) {
                    process.stdout.write(`${high}${low}`);
                } else {
                    console.log(`0x${high.toString(16).padStart(8, 0)}${low.toString(16).padStart(8, 0)}`);
                }

            } else {
                console.log("null");
                return;
            }

        } else {
            const bytes = this.memory_dump(value_ptr);

            if (stdsig_t == this.ostream_stdout_signals.stream) {
                process.stdout.write(bytes.map(b => String.fromCharCode(b)).join(''));
            } else {
                console.log(bytes.map(b => String.fromCharCode(b)).join(''));
            }
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
            HardwareException.except("Stack underflow");
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

        if ([value instanceof Uint16Array, value instanceof Uint8Array].includes(true)) {
            if (value.length == 1) {
                this.#memory_micro_operation_push(this.NULL_TERMINATOR);
                this.#memory_micro_operation_push(value[0]);
            }

        } else if (value instanceof Uint32Array) {
            if (value.length == 1) {
                this.#memory_micro_operation_push(this.NULL_TERMINATOR);
                value = value[0];
                this.#memory_micro_operation_push(value & 0xFFFF);
                this.#memory_micro_operation_push((value >> 16) & 0xFFFF);
            }

        } else if (typeof value === "string") {
            for (let i = 0; i < value.length; i++) {
                let charCode = value.charCodeAt(i);
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
        if (size instanceof Uint8Array) {
            return this.#typeid.uint8;
        } else if (size instanceof Uint16Array) {
            return this.#typeid.uint16;
        } else if (size instanceof Uint32Array) {
            return this.#typeid.uint32;
        }

        if (size == 0) {
            return this.#typeid.uint8;
        }

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

    #fetch_typeid_by_bytes(size) {
        if (size == 1) {
            return this.#typeid.uint8;
        } else if (size == 2) {
            return this.#typeid.uint16;
        } else if (size == 4) {
            return this.#typeid.uint32;
        } else if (size == 8) {
            return this.#typeid.uint64;
        } else {
            HardwareException.except(`Invalid size: ${size}`);
        }
    }

    #fetch_sizeof_by_name(name) {
        if (name == this.#typeid.uint8) {
            return 1;
        } else if (name == this.#typeid.uint16) {
            return 2;
        } else if (name == this.#typeid.uint32) {
            return 4;
        } else if (name == this.#typeid.uint64) {
            return 8;
        } else {
            HardwareException.except(`Invalid type: ${name}`);
        }
    }

    #fetch_greater_typeid_by_name(type_a, type_b) {
        return this.#fetch_sizeof_by_name(type_a) > this.#fetch_sizeof_by_name(type_b);
    }

    #fetch_less_typeid_by_name(type_a, type_b) {
        return this.#fetch_sizeof_by_name(type_a) < this.#fetch_sizeof_by_name(type_b);
    }

    #fetch_maxsize_typeid_by_name(name) {
        if (name == this.#typeid.uint8) {
            return (2 ** 8) - 1;
        } else if (name == this.#typeid.uint16) {
            return (2 ** 16) - 1;
        } else if (name == this.#typeid.uint32) {
            return (2 ** 32) - 1;
        } else if (name == this.#typeid.uint64) {
            return (2 ** 64) - 1;
        } else {
            return 0x00;
        }
    }

    #tostring16(num_t) {
        return num_t.toString(16);
    }

    sizeof(name_t) {
        let size_t = 0x00;

        if ([Uint8Array, Uint16Array, Uint32Array].map(t_ => name_t instanceof t_).includes(true)) {
            return name_t.BYTES_PER_ELEMENT;
        } else if (name_t in this.registers) {
            return this.registers[name_t].BYTES_PER_ELEMENT;
        } else if (name_t instanceof typeid) {
            if (Object.values(this.#typeid).includes(name_t.name)) {
                return this.#fetch_sizeof_by_name(name_t.name);
            }

        } else if (typeof name_t === 'number') {
            return this.#fetch_sizeof_by_name(this.#fetch_typeid(name_t));
        }

        return size_t;
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
            while (this.#usedPointersForHeap.includes(ptr_uint16)) {
                ptr_uint16 = this.#gen_random_uint16();
            }

            this.#usedPointersForHeap.push(ptr_uint16);
            this.#usedPointersForHeap.push(ptr_uint16 + 0x1); // for FILL NULL TERMINATOR

            this.usedHeapSize += 0x3;
        } else if (malloc_value_type === this.#typeid.uint16) {
            while ([
                this.#usedPointersForHeap.includes(ptr_uint16),
                this.#usedPointersForHeap.includes(ptr_uint16 + 0x1)
            ].every(Boolean)) {
                ptr_uint16 = this.#gen_random_uint16();
            }

            this.#usedPointersForHeap.push(ptr_uint16);
            this.#usedPointersForHeap.push(ptr_uint16 + 0x1);
            this.#usedPointersForHeap.push(ptr_uint16 + 0x2); // for FILL NULL TERMINATOR

            this.usedHeapSize += 0x4;
        }

        // NULL TERMINATOR
        this.#usedPointersForHeap.push(0x0);
        
        // instert address in stack for heap reading
        this.#stack_micro_operation_push(ptr_uint16);
        this.#set_register_$sp();

        return ptr_uint16;
    }

    calloc(count_of_elements, size_of_element) {
        if (this.memoryPhysicalPointer >= this.commonAreaSize) {
            HardwareException.except(`Memory overflow`);
        }

        const count_t = this.#fetch_typeid(count_of_elements);
        const size_t = this.#fetch_typeid_by_bytes(size_of_element);

        const ptr_uint16 = this.memoryPhysicalPointer;
        let ptr_uint16_copy = ptr_uint16;

        if (![this.#typeid.uint8, this.#typeid.uint16].includes(count_t)) {
            HardwareException.except(
                `first argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint8} count, ${this.#typeid.uint8} size)' should be '${this.#typeid.uint8}'`,
                `first argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint8} count, ${this.#typeid.uint16} size)' should be '${this.#typeid.uint8}'`,
                `first argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint16} count, ${this.#typeid.uint8} size)' should be '${this.#typeid.uint16}'`,
                `first argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint16} count, ${this.#typeid.uint16} size)' should be '${this.#typeid.uint16}'`
            );
        }

        if (![this.#typeid.uint8, this.#typeid.uint16].includes(size_t)) {
            HardwareException.except(
                `second argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint8} count, ${this.#typeid.uint8} size)' should be '${this.#typeid.uint8}'`,
                `second argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint8} count, ${this.#typeid.uint16} size)' should be '${this.#typeid.uint8}'`,
                `second argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint16} count, ${this.#typeid.uint8} size)' should be '${this.#typeid.uint16}'`,
                `second argument of '${this.#typeid.uint16} calloc(${this.#typeid.uint16} count, ${this.#typeid.uint16} size)' should be '${this.#typeid.uint16}'`
            );
        }

        for (let i = 0; i < count_of_elements; i++) {
            this.#usedPointersForMemory.push(ptr_uint16_copy);
            ptr_uint16_copy += 0x01;
        }

        // NULL TERMINATOR
        this.#usedPointersForMemory.push(this.NULL_TERMINATOR);

        this.#stack_micro_operation_push(ptr_uint16);
        this.#set_register_$sp();

        return ptr_uint16;
    }

    free(ptr) {
        const ptr_uint16 = ptr instanceof Uint16Array ? ptr[0] : ptr;
        const type_of_ptr = this.#fetch_typeid(ptr_uint16);

        if (type_of_ptr != this.#typeid.uint16) {
            HardwareException.except(
                `first argument of 'void free(${this.#typeid.uint16} ptr)' should be '${this.#typeid.uint16}'`
            );
        }

        const index_t = this.#usedPointersForHeap.indexOf(ptr_uint16);

        if (index_t == -1) {
            HardwareException.except(`Pointer '${ptr_uint16}' is not in heap`);
        }

        while (this.#usedPointersForHeap[index_t] != 0x0) {
            this.#usedPointersForHeap.splice(index_t, 1);
            this.usedHeapSize -= 0x1;
        }

        this.usedHeapSize -= 0x1;
    }

    mem_free(ptr) {
        const type_of_ptr = this.#fetch_typeid(ptr);
        const ptr_uint16 = ptr[0];

        if (type_of_ptr != this.#typeid.uint16) {
            HardwareException.except(
                `first argument of 'void mem_free(${this.#typeid.uint16} ptr)' should be '${this.#typeid.uint16}'`
            );
        }

        const index_t = this.#usedPointersForMemory.indexOf(ptr_uint16);

        if (index_t == -1) {
            HardwareException.except(`Pointer '${ptr_uint16}' is not in memory`);
        }

        while (this.#usedPointersForMemory[index_t] != 0x0) {
            this.#usedPointersForMemory.splice(index_t, 1);
        }
    }

    mov(destination, source) {
        if (destination?.type == this.#typeid_movement.reg) {
            if (source?.type == this.#typeid_movement.imm) {
                this.set_register_by_name(destination.name, source.value);
            } else if (source?.type == this.#typeid_movement.reg) {
                this.set_register_by_name(destination.name, this.get_register_by_name(source.name));
            } else if (source?.type == this.#typeid_movement.mem) {
                let type_of_ptr, ptr_uint16;

                if (source.ptr_t  == this.#typeid_movement.imm) {
                    type_of_ptr = this.#fetch_typeid(parseInt(source.ptr));
                    ptr_uint16 = parseInt(source.ptr);
                } else if (source.ptr_t  == this.#typeid_movement.reg) {
                    type_of_ptr = this.#fetch_typeid(this.get_register_by_name(source.ptr));
                    ptr_uint16 = this.get_register_by_name(source.ptr);
                }

                if (type_of_ptr != this.#typeid.uint16) {
                    HardwareException.except(
                        `second argument of 'mov $reg, [${this.#typeid.uint16} ptr]' should be '${this.#typeid.uint16}'`
                    );
                }

                this.set_register_by_name(destination.name, this.memory_dump(ptr_uint16));
            }
        } else {
            HardwareException.except('first argument of mov should be $reg');
        }
    }

    #movzx_micro_operation_cast(destination_t, source_val) {
        const destination_maxsize = this.#tostring16(this.#fetch_maxsize_typeid_by_name(destination_t));
        return parseInt('0x' + source_val.toString(16).padStart(destination_maxsize.length, 0));
    }

    #movsx_micro_operation_cast(destination_t, source_val) {
        const destination_maxsize = this.#tostring16(this.#fetch_maxsize_typeid_by_name(destination_t));
        return parseInt('0x' + source_val.toString(16).padStart(destination_maxsize.length, 'f'));
    }

    movzx(destination, source) {
        if (destination?.type == this.#typeid_movement.reg) {
            let source_val;

            if (source?.type == this.#typeid_movement.imm) {
                source_val = parseInt(source.value);
            } else if (source?.type == this.#typeid_movement.reg) {
                source_val = this.get_register_by_name(source.name);
            } else if (source?.type == this.#typeid_movement.mem) {
                HardwareException.except('this is not implemented yet');
            }
                
            const destination_t = this.#fetch_typeid(this.get_register_by_name(destination.name));
            const source_t = this.#fetch_typeid(source_val);

            if (destination_t == source_t) {
                HardwareException.except(
                    `Unexpected error: two arguments of 'movzx $reg, $reg' should be different types`
                );
            }

            if (this.#fetch_greater_typeid_by_name(destination_t, source_t)) {
                this.set_register_by_name(destination.name, this.#movzx_micro_operation_cast(destination_t, source_val));
            } else {
                HardwareException.except(`Source type is larger than destination type in movzx instruction`);
            }

        } else {
            HardwareException.except('first argument of movzx should be $reg');
        }
    }

    movsx(destination, source) {
        if (destination?.type == this.#typeid_movement.reg) {
            let source_val;

            if (source?.type == this.#typeid_movement.imm) {
                source_val = parseInt(source.value);
            } else if (source?.type == this.#typeid_movement.reg) {
                source_val = this.get_register_by_name(source.name);
            } else if (source?.type == this.#typeid_movement.mem) {
                HardwareException.except('this is not implemented yet');
            }
                
            const destination_t = this.#fetch_typeid(this.get_register_by_name(destination.name));
            const source_t = this.#fetch_typeid(source_val);

            if (destination_t == source_t) {
                HardwareException.except(
                    `Unexpected error: two arguments of 'movsx $reg, $reg' should be different types`
                );
            }

            if (this.#fetch_greater_typeid_by_name(destination_t, source_t)) {
                this.set_register_by_name(destination.name, this.#movsx_micro_operation_cast(destination_t, source_val));
            } else {
                HardwareException.except(`Source type is larger than destination type in movsx instruction`);
            }

        } else {
            HardwareException.except('first argument of movsx should be $reg');
        }
    }

    cmp(a, b) {  
        if ([typeof a == 'number', typeof b == 'number'].includes(false)) {
            HardwareException.except(`Unexpected error: two arguments of 'cmp imm, imm' should be numbers`);
        }

        const result_raw = a - b;

        this.set_flag_$zf(result_raw == 0);
        this.set_flag_$cf(b > a);
        this.set_flag_$of(!Number.isSafeInteger(result_raw));
    }
}

module.exports = Hardware;