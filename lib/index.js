const addon = require("../native");
const quicksort = require("./quickSort");

// 生成一个包含 100000 个随机数的数组
const unsortedArray = Array.from({ length: 10000 }, () =>
  Math.floor(Math.random() * 1000000)
);

// 多次运行以取平均值
const runs = 10;

let rustTotalTime = 0;
let jsTotalTime = 0;

for (let i = 0; i < runs; i++) {
    // JavaScript 快排
  const startTimeJs = process.hrtime();
  const jsSortedArray = quicksort([...unsortedArray]);
  const endTimeJs = process.hrtime(startTimeJs);
  jsTotalTime += endTimeJs[0] * 1e9 + endTimeJs[1];

  // Rust 快排
  const startTime = process.hrtime();
  const sortedArray = addon.sort([...unsortedArray]);
  const endTime = process.hrtime(startTime);
  rustTotalTime += endTime[0] * 1e9 + endTime[1];
}

const rustAvgTime = rustTotalTime / runs;
const jsAvgTime = jsTotalTime / runs;

console.log(`Average Rust sorting time: ${(rustAvgTime / 1e6).toFixed(2)} milliseconds`);
console.log(`Average JavaScript sorting time: ${(jsAvgTime / 1e6).toFixed(2)} milliseconds`);