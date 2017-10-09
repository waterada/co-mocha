CoMocha
=========
[![Build Status](https://travis-ci.org/waterada/co-mocha.svg?branch=master)](https://travis-ci.org/waterada/co-mocha)
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)


概要
------

[`co`](https://www.npmjs.com/package/co) 用に書かれた generator 関数や promise の関数を mocha でテストしやすくしたもの。

依存
-----

- `node 6.x` 以上
- `co`
- `mocha`
- `chai`


インストール
-------------

```sh
npm install --save-dev @waterada/co-mocha
```

実装
---------

```js
const coMocha = require('@waterada/co-mocha');

it('generator を使える', coMocha.wrap(function * () {
    let res103 = yield __generator(100);
    let res104 = yield __promise(res103);
    let res107 = yield __generator(res104);
    let res108 = yield __promise(res107);
    assert.equal(res108, 108);
}));

it('エラー発生するはずのコールバック(generator)が投げるエラーをキャッチしてチェックできる', coMocha.wrap(function * () {
    let thrown = yield coMocha.catchThrown(function * () {
        throw new Error('強制エラー');
    });
    thrown.assertThrows('強制エラー', 'エラーの内容を文字列でチェックできる');
    thrown.assertThrows(/強.{3}ー/, 'エラーの内容を正規表現でチェックできる');
    thrown.assertExistsInStack(__filename, {line: -4}, 'ファイル名と行番号(相対)がstackに存在している')
}));
```

詳細な使い方
------------

[テスト](test/test-co-mocha.js) を参考にしてください。


テスト実行方法
--------------

ローカルで動かす場合:

```sh
npm test
```

docker で動かす場合:

```sh
docker-compose run --rm node npm test
```
