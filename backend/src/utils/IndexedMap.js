class IndexedMap extends Map {
  constructor(args) {
    super(args);
    // key - index number mapping
    if (args) {
      for (let i = 0; i < args.length; i++) {
        const tuple = args[i];
        this.set(String(i), { [tuple[0]]: tuple[1] });
      }
    }
  }

  isNumber(key) {
    return Boolean(String(key).match(/^[0-9]{1,}$/));
  }

  findEmptyNumber(array) {
    const temp = [];
    const numbering = array
      .filter(([k, v]) => this.isNumber(String(k)))
      .map((arg) => arg[0])
      .sort();
    for (let i = 0; i < numbering.length - 1; i++) {
      const expectNextNumber = numbering[i] + 1;
      const nextIndex = numbering[i + 1];
      if (expectNextNumber !== nextIndex) {
        for (let j = expectNextNumber; j < nextIndex; j++) {
          temp.push(j);
        }
      }
    }
    if (temp.length === 0) {
      temp.push(numbering.length);
    }
    return temp[0] || 0;
  }

  hasSameIndex(key) {
    const index = this.findIndexByKey(key);
    if (index === -1) return false;

    for (let [k] of this) {
      if (k === index) {
        return index;
      }
    }
    return false;
  }

  toArray() {
    const temp = [];
    for (let i of this) {
      temp.push(i);
    }
    return temp;
  }

  set(...args) {
    if (args.length === 2) {
      const [key, value] = args;
      super.set(key, value);
      if (key) {
        const emptyNumber =
          this.hasSameIndex(key) !== -1
            ? this.hasSameIndex(key) || this.findEmptyNumber(this.toArray())
            : 0;
        super.set(Number(emptyNumber), {
          [key]: value,
        });
      }
    } else if (args.length === 3) {
      const [num, key, value] = args;
      super.set(key, value);
      super.set(Number(num), {
        [key]: value,
      });
    }
  }

  get(key) {
    return super.get(key);
  }

  findValueByIndex(index) {
    const found = this.get(index);
    if (found) {
      return found;
    }
    return undefined;
  }

  findIndexByKey(key) {
    for (let [k, v] of this) {
      if (this.isNumber(k)) {
        if (v.hasOwnProperty(key)) {
          return Number(k);
        }
      }
    }
    return -1;
  }

  delete(key) {
    if (this.isNumber(key)) {
      const [k] = Object.entries(this.findValueByIndex(key)).flat(1);
      super.delete(key);
      super.delete(k);
    } else {
      const index = this.findIndexByKey(key);
      super.delete(key);
      super.delete(index);
    }
  }
}

module.exports = IndexedMap;
