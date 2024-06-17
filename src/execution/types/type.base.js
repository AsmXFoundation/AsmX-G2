class TypeBaseConstructor {
    constructor() {
        this.type = this.constructor.name;
        this.value = null;
        return this;
    }

    set(value) {
        this.value = value;
        return this;
    }
}

module.exports = TypeBaseConstructor;