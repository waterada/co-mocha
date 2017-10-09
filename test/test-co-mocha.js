const coMocha = require('..');
const assert = require('chai').assert;

const __catch = function (cb, onError) {
    return function(done) {
        cb(function (err) {
            try {
                onError(err ? `${err}` : 'エラーが発生しなかった');
                done();
            } catch (e) {
                done(e);
            }
        });
    };
};

describe('CoMocha', function () {
    describe('#wrap', function () {
        it('generator を使える', coMocha.wrap(function * () {
            let res103 = yield __generator(100);
            let res104 = yield __promise(res103);
            let res107 = yield __generator(res104);
            let res108 = yield __promise(res107);
            assert.equal(res108, 108);
        }));

        it('最後の行まで実行している', __catch(coMocha.wrap(function * () {
            let res103 = yield __generator(100);
            assert.equal(res103, 103);
            throw `念のために確認。ここまでちゃんと実行している:${res103}`;
        }), function (err) {
            assert.include(err, '念のために確認。ここまでちゃんと実行している:103');
        }));

        it('generator で AssertionError', __catch(coMocha.wrap(function * () {
            let res103 = yield __generator(100);
            let res104 = yield __promise(res103);
            let res107 = yield __generator(res104);
            let res108 = yield __promise(res107);
            assert.equal(res108, 109, 'ここでエラー');
        }), function (err) {
            assert.include(err, 'AssertionError: ここでエラー: expected 108 to equal 109');
        }));

    });

    describe('#catchThrown', function () {

        it('エラー発生するはずのコールバック(generator)が投げるエラーをキャッチしてチェックできる', coMocha.wrap(function * () {
            let thrown = yield coMocha.catchThrown(function * () {
                throw new Error('強制エラー');
            });
            thrown.assertThrows('強制エラー', 'エラーの内容を文字列でチェックできる');
            thrown.assertThrows(/強.{3}ー/, 'エラーの内容を正規表現でチェックできる');
            thrown.assertExistsInStack(__filename, {line: -4}, 'ファイル名と行番号がstackに存在している')
        }));

        it('エラーは文字列で投げられても良い', coMocha.wrap(function * () {
            let thrown = yield coMocha.catchThrown(function * () {
                throw '強制エラー';
            });
            thrown.assertThrows('強制エラー', 'エラーの内容を文字列でチェックできる');
            thrown.assertThrows(/強.{3}ー/, 'エラーの内容を正規表現でチェックできる');
        }));

        it('ただし、文字列エラーなら stack のチェックはできない', __catch(coMocha.wrap(function * () {
            let thrown = yield coMocha.catchThrown(function * () {
                throw '強制エラー';
            });
            thrown.assertExistsInStack(__filename, {line: -5}, '文字列で投げられた場合、stack は catchThrown の行を指すことになる')
        }), function (err) {
            assert.include(err, 'You cannot use assertExistsInStack() because the error does not have a stack. error: 強制エラー');
        }));

        it('発生するはずのエラーが発生しなかったら検出できる', __catch(coMocha.wrap(function * () {
            let thrown = yield coMocha.catchThrown(function * () {
                //throw '強制エラー'; //エラー発生しない
            });
            thrown.assertThrows('強制エラー', 'エラーが発生していることをチェックするが実際は発生しない');
        }), function (err) {
            assert.include(err, "expected [Function] to throw error including '強制エラー' but got 'No error was thrown!'");
        }));

        describe('assertThrows の詳細', function () {

            it('文字列で比較', __catch(coMocha.wrap(function * () {
                let thrown = yield coMocha.catchThrown(function * () {
                    throw new Error('強制エラー');
                });
                thrown.assertThrows('マッチしない文字列');
            }), function (err) {
                assert.include(err, "AssertionError: expected [Function] to throw error including 'マッチしない文字列' but got '強制エラー'");
            }));

            it('正規表現で比較', __catch(coMocha.wrap(function * () {
                let thrown = yield coMocha.catchThrown(function * () {
                    throw new Error('強制エラー');
                });
                thrown.assertThrows(/マッチしない文字列/);
            }), function (err) {
                assert.include(err, "AssertionError: expected [Function] to throw error matching /マッチしない文字列/ but got '強制エラー'");
            }));

            it('assertThrows() でメッセージを渡すこともできる', __catch(coMocha.wrap(function * () {
                let thrown = yield coMocha.catchThrown(function * () {
                    throw new Error('強制エラー');
                });
                thrown.assertThrows(/マッチしない文字列/, 'マッチしない');
            }), function (err) {
                assert.include(err, "AssertionError: マッチしない: expected [Function] to throw error matching /マッチしない文字列/ but got '強制エラー'");
            }));

        });
        describe('assertExistsInStack の詳細', function () {

            it('stack にファイル名と行番号(相対)が存在することをチェックできる', coMocha.wrap(function * () {
                let thrown = yield coMocha.catchThrown(function * () {
                    throw new Error('強制エラー');
                });
                thrown.assertExistsInStack(__filename, {line: -2});
            }));

            it('エラーが実際には発生しない場合はエラーになる', __catch(coMocha.wrap(function * () {
                let thrown = yield coMocha.catchThrown(function * () {
                    //throw new Error('強制エラー'); //発生しない
                });
                thrown.assertExistsInStack(__filename, {line: -2});
            }), function (err) {
                assert.include(err, "Error: You cannot use assertExistsInStack() because the error does not have a stack. error: No error was thrown!");
            }));

            it('エラーが発生したが行番号がズレていたらエラーになる', __catch(coMocha.wrap(function * () {
                let thrown = yield coMocha.catchThrown(function * () {
                    throw new Error('強制エラー');
                });
                thrown.assertExistsInStack(__filename, {line: -3});
            }), function (err) {
                assert.include(err, `AssertionError: Line number of the filename '${__filename}' in stack: expected 134 to equal 133`);
            }));

            it('assertExistsInStack() でメッセージを渡すこともできる', __catch(coMocha.wrap(function * () {
                let thrown = yield coMocha.catchThrown(function * () {
                    throw new Error('強制エラー');
                });
                thrown.assertExistsInStack(__filename, {line: -3}, 'メッセージ渡せる');
            }), function (err) {
                assert.include(err, `AssertionError: メッセージ渡せる: expected 143 to equal 142`);
            }));

            describe('LineNumDetector', function () {
                [
                    ['/file/path/delimited/by/slash.js', '/ 区切り'],
                    ['C:\\file\\path\\delimited\\by\\yen.js', '\\ 区切り'],
                ].forEach(data => {
                    let [PATH, PATH_TITLE] = data;
                    [
                        [`at ${PATH}:75:17`, 'パスが直書き'],
                        [`at funcName (${PATH}:75:17)`, '関数定義あり'],
                    ].forEach(data => {
                        let [STACK_LINE, STACK_TITLE] = data;
                        [
                            [0, '75', '相対パス 0'],
                            [1, '76', '相対パス+1'],
                            [-1, '74', '相対パス-1'],
                        ].forEach(data => {
                            let [RELATIVE_LINE, EXPECTED_LINE, TITLE_RELATIVE] = data;
                            it(`${PATH_TITLE}  ${STACK_TITLE}  ${TITLE_RELATIVE}`, function () {
                                let lineNumDetector = new coMocha.LineNumDetector(PATH);
                                let line = lineNumDetector.line(RELATIVE_LINE, [
                                    'Error: 強制エラー',
                                    `    ${STACK_LINE}`,
                                ].join("\n"));
                                assert.equal(line, EXPECTED_LINE);
                            });
                        });
                    });
                });

                it('そもそもファイルパスが stack に無い', __catch(coMocha.wrap(function * () {
                    let thrown = yield coMocha.catchThrown(function * () {
                        let e = new Error('強制エラー');
                        e.stack = [
                            'Error: 強制エラー',
                            '    at index.js:75:17',
                        ].join("\n");
                        throw e;
                    });
                    thrown.assertExistsInStack('file/does/not/exist.js', {line: -2}, 'メッセージ');
                }), function (err) {
                    assert.include(err, `Error: 行番号が取得できませんでした。\nmatch(/[ (]file\\/does\\/not\\/exist.js:(\\d+):/) にて取得を試みた stack: Error: 強制エラー\n    at index.js:75:17`);
                }));

            });
        });

        it('チェーン でも指定できる', coMocha.wrap(function * () {
            (yield coMocha.catchThrown(function * () {
                throw new Error('強制エラー');
            })).assertThrows('強制エラー').assertExistsInStack(__filename, {line: -1});
        }));
    });
});

const __promise = function * (param) {
    return new Promise(function (resolve, reject) {
        setImmediate(function () {
            if (param === 'err') {
                reject('err');
            } else {
                resolve(param + 1);
            }
        });
    });
};
const __generator = function * (param) {
    let res = yield __promise(param);
    res = yield __promise(res);
    res = yield __promise(res);
    return res;
};
