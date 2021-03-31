class Watcher{
  constructor(vm, expr, cb){
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    this.oldVal = this.getOldVal()
  }
  getOldVal(){
    Dep.target = this;
    // 会触发get，添加watcher
    const oldVal = compileUtil.getVal(this.expr, this.vm)
    // 添加完watcher后，将Watcher清掉
    Dep.target = null;
    return oldVal
  }
  update(){
    const newVal = compileUtil.getVal(this.expr, this.vm);
    if(newVal !== this.oldVal){
      this.cb && this.cb(newVal)
    }
  }
}

class Dep{
  constructor() {
    this.subs = []
  }
  // 收集观察者
  addSub(watcher){
    this.subs.push(watcher)
  }
  // 通知观察者去更新
  notify(){
    console.log('---通知了观察者--', this.subs)
    this.subs.forEach(w=>w.update())
  }
}

class Observer{
  constructor(data){
    this.observer(data);
  }
  observer(data){
    if(data && typeof data === 'object'){
      Object.keys(data).forEach(key=>{
        this.defineReactive(data, key, data[key]);
      })
    }
  }
  defineReactive(data, key, value){
    // 递归遍历
    this.observer(value)
    const dep = new Dep()
    // 劫持并监听所有属性
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get(){
        // 订阅数据变化时，往dep中添加Watcher
        // console.log('..............', key, value, Dep.target)
        Dep.target && dep.addSub(Dep.target)
        return value;
      },
      set: (newVal)=>{
        // 挟持新的对象值
        this.observer(newVal);
        if(newVal !== value){
          value = newVal;
        }
        // 告诉Dep通知变化
        dep.notify()
      }
    })
  }
}