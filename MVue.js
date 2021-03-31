const compileUtil = {
  getVal(expr, vm){
    // console.log('//////////', expr)
    // 兼容对象
    return expr.split('.').reduce((data, currentVal)=>{
      return data[currentVal]
    }, vm.$data)
  },
  setVal(expr, vm, inputVal){
    expr.split('.').reduce((data, currentVal)=>{
      // 最后一层才更新数据
      if(typeof data[currentVal] !== 'object'){
        data[currentVal] = inputVal
      }
      return data[currentVal]
    }, vm.$data)
  },
  getContentVal(expr, vm){
      return expr.replace(/\{\{(.+?)\}\}/g, (...args)=>{
        return this.getVal(args[1], vm); 
      })
  },
  text(node, expr, vm){ // expr:msg
    let value;
    if(expr.indexOf('{{') !== -1){
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args)=>{
        // console.log(args)
        // 绑定观察者
      new Watcher(vm, args[1], ()=>{
        this.updater.textUpdater(node, this.getContentVal(expr, vm));
      })
        return this.getVal(args[1], vm); 
      })
      // console.log('//////', value)
    }else{
      // 添加观察者
      new Watcher(vm, expr, (newVal)=>{
        this.updater.textUpdater(node, newVal);
      })
      value = this.getVal(expr, vm);
    }
    this.updater.textUpdater(node, value);
  },
  html(node, expr, vm){
    const value = this.getVal(expr, vm)
    // 添加观察者
    new Watcher(vm, expr, (newVal)=>{
      this.updater.htmlUpdater(node, newVal);
    })
    this.updater.htmlUpdater(node, value)
  },
  model(node, expr, vm){
    const value = this.getVal(expr, vm)
    // 绑定更新函数  数据=>视图 
    new Watcher(vm, expr, (newVal)=>{
      this.updater.modelUpdater(node, newVal);
    })
    // 视图=> 数据
    node.addEventListener('input', e=>{
      // 设置值
      this.setVal(expr, vm, e.target.value);
    })
    this.updater.modelUpdater(node, value)
  },
  on(node, expr, vm, eventName){
    const fn = vm.$option.methods && vm.$option.methods[expr]
    node.addEventListener(eventName, fn.bind(vm), false)
  },
  updater: {
    modelUpdater(node, value){
      node.value = value
    },
    textUpdater(node, value){
      node.textContent = value
    },
    htmlUpdater(node, value){
      node.innerHTML = value;
    }
  }
}

class Compile{
  constructor(el, vm){
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    // 1.获取文档碎片对象 放入内存中会减少页面的回流和重绘
    const fragment = this.node2Fragment(this.el);
    // 2. 编译模板
    this.compile(fragment)
    // 3. 追加子元素到根元素
    this.el.appendChild(fragment)
  }
  compile(fragment){
      // 1.获取子节点
      const childNodes = fragment.childNodes;
      [...childNodes].forEach(child=>{
        // console.log(child)
        if(this.isElementNode(child)){
          // 是元素节点
          // 编译元素节点
          this.compileElement(child)
        }else{
          // 文本节点
          // 编译文本节点
          this.compileText(child)
        }

        if(child.childNodes && child.childNodes.length){
          this.compile(child)
        }
      })
  }

  compileElement(node){
    // console.log('---el--', node)
    // <div v-text='msg'></div>
    const attributes = node.attributes;
    [...attributes].forEach(attr=>{
      const {name, value} = attr
      if(this.isDirective(name)){ // 是一个指令 v-text v-html v-model v-on:click
        const [, directive] = name.split('-');  // text html model on:click
        const [dirName, eventName] =  directive.split(':')  // text model on
        // 更新数据 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName)

        // 删除有指令的标签上的属性
        node.removeAttribute('v-' + directive);
      }else if(this.isEventName(name)){  // @click="handleClick"
        const [, eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName)
      }
    })
  }

  compileText(node){
    // console.log('---text--', node)
    const content = node.textContent;
    // 匹配{{}}中的内容
    if(/\{\{(.+?)\}\}/.test(content)){
      compileUtil['text'](node, content, this.vm)
    }
  }

  node2Fragment(el){
    // 创建文档碎片
    const f = document.createDocumentFragment();
    let firstChild;
    while(firstChild = el.firstChild){
      /*
        appendChild() 方法可向节点的子节点列表的末尾添加新的子节点。
        如果文档树中已经存在了 newchild，它将从文档树中删除，然后重新插入它的新位置。
        如果 newchild 是 DocumentFragment 节点，则不会直接插入它，而是把它的子节点按序插入当前节点的 childNodes[] 数组的末尾。
      */
      f.appendChild(firstChild)
    }
    return f
  }

  isEventName(attrName){
    return attrName.startsWith('@')
  }

  isDirective(attrName){
    return attrName.startsWith('v-');
  }

  isElementNode(node){
    return node.nodeType === 1
  }
}

class MVue{
  constructor(options){
    this.$el = options.el 
    this.$data = options.data 
    this.$option = options
    if(this.$el){
      // 1.实现一个数据观察者
      new Observer(this.$data)
      // 2.实现一个指令解析器
      new Compile(this.$el, this)
      // 用this代理 this.$data
      this.proxyData(this.$data);
    }
  }
  proxyData(data){
    for(const key in data){
      Object.defineProperty(this, key, {
        get(){
          return data[key];
        },
        set(newVal){
          data[key] = newVal
        }
      })
    }
  }
}