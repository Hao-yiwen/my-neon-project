const addon = require("../native");

// 测试 Rust 版本
const numSamples = 100000000;
console.log("Estimating Pi with Rust...");
console.time("Rust Pi Calculation");
const piRust = addon.calculate_pi(numSamples);
console.timeEnd("Rust Pi Calculation");
console.log(`Estimated Pi (Rust): ${piRust}`);

// JavaScript 实现（包含前面的 JavaScript 实现）
function estimatePi(numSamples) {
  let insideCircle = 0;

  for (let i = 0; i < numSamples; i++) {
    const x = Math.random();
    const y = Math.random();
    if (x * x + y * y <= 1) {
      insideCircle++;
    }
  }

  return (insideCircle / numSamples) * 4;
}

console.log("Estimating Pi with JavaScript...");
console.time("JavaScript Pi Calculation");
const piJs = estimatePi(numSamples);
console.timeEnd("JavaScript Pi Calculation");
console.log(`Estimated Pi (JavaScript): ${piJs}`);