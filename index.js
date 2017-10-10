'use strict';

const assert = require('chai').assert;

class LineNumDetector {
    constructor(filename) {
        this.filename = filename;
    }

    /**
     * @param {int} plus
     * @param {string} [stack]
     * @return {int}
     */
    line(plus, stack) {
        stack = stack || new Error().stack.replace(/ at __line .*?\n/, '');
        //console.log(stack);
        let regexp = new RegExp(`[ (]${this.filename.replace(/\\/g, '\\\\').replace(/\//g, '\\/').replace(/^(.*[\/\\])/, '(?:$1)?')}:(\\d+):`);
        let matches = stack.match(regexp);
        if (matches && matches[1]) {
            return parseInt(matches[1]) + plus;
        } else {
            let msg = `行番号が取得できませんでした。\nmatch(${regexp}) にて取得を試みた stack: ${stack}`;
            //console.error(msg);
            throw new Error(msg);
        }
    };
}

class GetThrownRes {
    constructor(e) {
        this.e = e;
    }

    /**
     * @param {RegExp|string} errMsgMatcher
     * @param {string} [message]
     * @return {GetThrownRes}
     */
    assertThrows(errMsgMatcher, message) {
        let e = (this.e.stack ? this.e : new Error(this.e));
        assert.throws(() => { throw e; }, null, errMsgMatcher, message);
        return this;
    }

    /**
     * @param {string} filename
     * @param {object} opt
     * @param {int} opt.line
     * @param {string} [message]
     * @return {GetThrownRes}
     */
    assertExistsInStack(filename, opt, message) {
        if (!this.e.stack) {
            throw new Error(`You cannot use assertExistsInStack() because the error does not have a stack. error: ${this.e}`);
        }
        let lineNumDetector = new LineNumDetector(filename);
        assert.equal(lineNumDetector.line(0, this.e.stack), lineNumDetector.line(opt.line), message || `Line number of the filename '${filename}' in stack`);
        return this;
    }
}

class CoMocha {
    constructor() {
        this.LineNumDetector = LineNumDetector; //クラスを公開しておく
    }

    /**
     * @param fn
     * @return {GetThrownRes}
     */
    async catchThrown(fn) {
        try {
            await fn();
            return new GetThrownRes('No error was thrown!');
        } catch (e) {
            return new GetThrownRes(e);
        }
    }
}

/**
 * @param {string} filename
 * @return {CoMocha}
 */
module.exports = new CoMocha();
