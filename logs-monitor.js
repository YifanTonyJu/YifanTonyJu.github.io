#!/usr/bin/env node

/**
 * Vercel 日志监控脚本
 * 实时从 Vercel 拉取日志并保存到本地文件
 * 使用方法: node logs-monitor.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOG_FILE = path.join(__dirname, 'vercel-logs.txt');
const TIMESTAMP_FILE = path.join(__dirname, '.logs-last-timestamp');
let lastTimestamp = null;

// 初始化日志文件
function initLogFile() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, `=== Vercel Logs Monitor Started ===\n`);
    fs.writeFileSync(LOG_FILE, `Time: ${new Date().toISOString()}\n\n`, { flag: 'a' });
  }
}

// 读取上次的时间戳
function loadLastTimestamp() {
  if (fs.existsSync(TIMESTAMP_FILE)) {
    try {
      lastTimestamp = fs.readFileSync(TIMESTAMP_FILE, 'utf8').trim();
    } catch (e) {
      lastTimestamp = null;
    }
  }
}

// 保存时间戳
function saveLastTimestamp(timestamp) {
  fs.writeFileSync(TIMESTAMP_FILE, timestamp);
}

// 获取日志
function fetchLogs() {
  try {
    console.log('📡 Fetching logs from Vercel...');
    
    let command = 'vercel logs --limit 50';
    const output = execSync(command, { encoding: 'utf8' });
    
    return output;
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
    return null;
  }
}

// 格式化日志
function formatLogs(output) {
  if (!output) return '';
  
  const lines = output.split('\n');
  const formatted = [];
  
  formatted.push('\n' + '='.repeat(80));
  formatted.push(`📊 Logs Updated: ${new Date().toISOString()}`);
  formatted.push('='.repeat(80));
  formatted.push(output);
  
  return formatted.join('\n');
}

// 写入日志文件
function writeToLogFile(content) {
  if (!content) return;
  
  try {
    fs.writeFileSync(LOG_FILE, content + '\n', { flag: 'a' });
    console.log('✅ Logs updated:', LOG_FILE);
  } catch (error) {
    console.error('❌ Error writing to log file:', error.message);
  }
}

// 主函数
function main() {
  initLogFile();
  loadLastTimestamp();
  
  console.log('🚀 Starting Vercel Logs Monitor');
  console.log('📁 Log file:', LOG_FILE);
  console.log('⏱️  Update interval: 5 seconds\n');
  
  // 立即获取一次
  const logs = fetchLogs();
  if (logs) {
    writeToLogFile(formatLogs(logs));
  }
  
  // 定时更新
  setInterval(() => {
    const logs = fetchLogs();
    if (logs) {
      writeToLogFile(formatLogs(logs));
    }
  }, 5000); // 每 5 秒更新一次
}

main();
