type Tresponse = 'SUCCESS' | 'FAIL';

class CachedQue {
  millisecondsToLive: number;
  maxAllowedProcesses: number;
  cache: { [key: string]: number };
  lastCallDate: Date;

  constructor(maxAllowedProcesses = 1, minutesToLive = 10) {
    this.millisecondsToLive = minutesToLive * 60 * 1000;
    this.maxAllowedProcesses = maxAllowedProcesses;
    this.cache = {};
    this.addProcessId = this.addProcessId.bind(this);
    this.hasProcessId = this.hasProcessId.bind(this);
    this.getProcessId = this.getProcessId.bind(this);
    this.removeProcessId = this.removeProcessId.bind(this);
    this.queIsFull = this.queIsFull.bind(this);
    this.resetCache = this.resetCache.bind(this);
    this.isCacheExpired = this.isCacheExpired.bind(this);
    this.lastCallDate = new Date();
  }
  isCacheExpired() {
    return (
      this.lastCallDate.getTime() + this.millisecondsToLive <
      new Date().getTime()
    );
  }
  queIsFull() {
    return Object.keys(this.cache).length >= this.maxAllowedProcesses;
  }
  hasProcessId(key: string): Tresponse {
    if (this.cache[key]) {
      return 'SUCCESS';
    }
    return 'FAIL';
  }
  getProcessId(key: string): number | Tresponse {
    if (this.cache[key]) {
      return this.cache[key];
    }
    return 'FAIL';
  }
  addProcessId(process: { key: string; id: number }): Tresponse {
    if (this.isCacheExpired()) {
      this.resetCache();
    }
    if (Object.keys(this.cache).length < this.maxAllowedProcesses) {
      this.cache[process.key] = process.id;
      return 'SUCCESS';
    }
    return 'FAIL';
  }
  removeProcessId(key): Tresponse {
    if (this.isCacheExpired()) {
      this.resetCache();
    }
    if (this.cache[key]) {
      delete this.cache[key];
      return 'SUCCESS';
    }
    return 'FAIL';
  }
  private resetCache() {
    this.lastCallDate = new Date();
    this.cache = {};
  }
}

export default new CachedQue();
