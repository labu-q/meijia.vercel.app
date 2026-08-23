import { seedData } from '../data/defaultData';

const KEY = 'nail-studio-ledger-v1';

export function loadData() {
  try {
    const stored = localStorage.getItem(KEY);
    const data = stored ? JSON.parse(stored) : seedData;
    // 清理开发阶段写入浏览器的演示流水，生产版默认从空账本开始。
    const hasDemoData = data.transactions?.some((item) => item.id === 'r1' || item.id === 'e1');
    return hasDemoData ? seedData : data;
  } catch {
    return seedData;
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
