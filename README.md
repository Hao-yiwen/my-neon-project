# my-neon-project

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](package.json)
[![Neon](https://img.shields.io/badge/Neon-0.10.1-orange.svg)](https://github.com/neon-bindings/neon)
[![Rust edition](https://img.shields.io/badge/Rust-edition%202018-black.svg)](native/Cargo.toml)

用 [Neon](https://github.com/neon-bindings/neon) 0.10 把两段 Rust 写成 Node.js 原生模块，再和仓库里对应的 JavaScript 实现比耗时。这是一份学习记录 / 演示，用来感受原生扩展的调用方式和量级差异，不是可发布的算法库。

仓库里只有两个对照：

- 快速排序：对同一份随机整数数组各跑 10 次，打印平均耗时。
- 蒙特卡洛估算圆周率：各取 1 亿个随机点，打印估算值和耗时。

## 内容

| 入口 | 做什么 | 怎么跑 |
| --- | --- | --- |
| [`lib/index.js`](lib/index.js) | `npm start` 的入口。生成 **10,000** 个 `[0, 1_000_000)` 的随机整数，调用 Rust `sort` 和 JS `quicksort`，各 10 次，输出平均毫秒数。 | `npm start` |
| [`lib/calculate_pi.js`](lib/calculate_pi.js) | 用 100,000,000 个样本估算 π。先跑 Rust `calculate_pi`，再跑文件内的 JavaScript 实现。 | `node lib/calculate_pi.js` |
| [`native/src/lib.rs`](native/src/lib.rs) | 导出 `sort` 与 `calculate_pi`。 | 由 `neon build` 编进 `native/index.node` |

`package.json` 的 `start` 只执行 `node lib/index.js`。圆周率脚本需要单独运行。

源码注释里写的是「100000 个随机数」，数组长度实际是 `10000`。两边都对这份长度为 1 万的数组排序。

## 两边实现并不相同

计时包含「把数组交给对应实现并拿回结果」的全过程，适合看量级，不宜当成同算法的语言基准。

**快排**

- JavaScript（[`lib/quickSort.js`](lib/quickSort.js)）：每次递归新建 `left` / `right` 数组。枢轴是末尾元素；小于枢轴的放左边，其余放右边。
- Rust（[`native/src/lib.rs`](native/src/lib.rs)）：原地 Lomuto 划分，枢轴同样取末尾；小于等于枢轴的交换到左侧。JS 数组在进 Rust 前会被收成 `Vec<i32>`，排完再写回 `JsArray`。

**圆周率**

两边都是单位正方形里的蒙特卡洛：点落在四分之一圆内则计数，返回 `4 * inside / samples`。

- Rust 使用 `rand` 的 `SmallRng`（`from_entropy`）。
- JavaScript 使用 `Math.random()`。
- 传给 Rust 的样本数会转成 `u32`，因此必须落在 `0 .. 2^32`。当前脚本的 `100000000` 在这个范围内。

## 技术栈

| 部分 | 版本 | 来源 |
| --- | --- | --- |
| Node 原生绑定 | Neon `0.10.1`、`neon-build` `0.10.1`、`neon-cli` `0.10.1` | [`native/Cargo.toml`](native/Cargo.toml)、[`package.json`](package.json) |
| 随机数 | `rand` `0.8.5`（feature `small_rng`） | [`native/Cargo.lock`](native/Cargo.lock) |
| Rust edition | 2018，crate `my_neon_project`，`crate-type = ["cdylib"]` | [`native/Cargo.toml`](native/Cargo.toml) |
| 包管理 | npm，lockfileVersion 2 | [`package-lock.json`](package-lock.json) |
| 许可 | MIT（写在 `package.json` / `Cargo.toml`；仓库根目录没有单独的 `LICENSE` 文件） | — |

`npm install` 的生命周期脚本是 `neon build --release`。没有测试脚本，也没有 CI 配置。

## 目录

```text
.
├── lib
│   ├── index.js          # 快排计时入口（npm start）
│   ├── quickSort.js      # JavaScript 快排
│   └── calculate_pi.js   # 圆周率对照（需单独执行）
├── native
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── build.rs          # 调用 neon_build::setup()
│   └── src/lib.rs        # sort、calculate_pi
├── package.json
├── package-lock.json
└── README.md
```

构建产物不入库：`node_modules/`、`native/target/`、`native/index.node`、`native/artifacts.json`（见 [`.gitignore`](.gitignore)）。

## 环境

- Node.js。本仓库没有 `engines` 字段。下面的命令在 **Node.js v22.23.4 / npm 10.9.9** 上跑通。
- Rust 工具链（`rustc`、`cargo`）。验证时为 **rustc 1.83.0**。
- C 编译器和 C++ 标准库。Neon 0.10 的链接行会带 `-lstdc++`。验证时安装了 **g++ 13.3.0**。
- 能访问 Rust crates.io，以及下面「安装」一节里实际使用的 npm 源。

## 安装与运行

在仓库根目录执行。

能访问 `package-lock.json` 里记录的源（`http://registry.npm.release.ctripcorp.com/`）时：

```bash
npm install
npm start
node lib/calculate_pi.js
```

`npm install` 会执行 `neon build --release`，在 `native/index.node` 生成原生模块。

当前 lockfile 把每个依赖的 tarball 地址写死在上述内网源。这台环境解析该主机失败（`ENOTFOUND`），直接 `npm install` 装不下来。改用公共 npm 安装、并且不改写 lockfile 后可以继续构建：

```bash
npm install --package-lock=false --ignore-scripts
npx neon build --release
npm start
node lib/calculate_pi.js
```

若链接器报 `cannot find -lstdc++`，先安装 `g++`，并把当前 GCC 的库目录放进 `LIBRARY_PATH`（版本号按本机 `g++ --version` 调整）：

```bash
export LIBRARY_PATH="/usr/lib/gcc/x86_64-linux-gnu/13${LIBRARY_PATH:+:$LIBRARY_PATH}"
npx neon build --release
```

只改过 Rust 或需要重新编译时，再执行一次 `npx neon build --release`。清理构建产物：

```bash
npx neon clean
```

### 本环境一次实测

机器：Linux，Node.js v22.23.4，rustc 1.83.0，release 构建。耗时随机器和随机数据变化，下面只说明命令确实跑完、输出形状是什么。

快排（`npm start`，10,000 个数 × 10 次）：

```text
Average Rust sorting time: 1.47 milliseconds
Average JavaScript sorting time: 2.92 milliseconds
```

圆周率（`node lib/calculate_pi.js`，各 1 亿个样本）：

```text
Estimating Pi with Rust...
Rust Pi Calculation: 253.077ms
Estimated Pi (Rust): 3.14178244
Estimating Pi with JavaScript...
JavaScript Pi Calculation: 1.444s
Estimated Pi (JavaScript): 3.14196856
```

## 参考

- [Neon 文档](https://github.com/neon-bindings/neon)
- 模块注册与导出：[`native/src/lib.rs`](native/src/lib.rs) 末尾的 `register_module!`，导出名为 `sort`、`calculate_pi`
