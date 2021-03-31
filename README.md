# MVue
简易版的双向绑定功能

主要实现了整合Compile、Observer、Watcher，通过Observer来监听model数据变化，通过Compile来解析编译模板指令，最终利用Watcher搭起Observer，Compile之间的通信桥梁，
达到数据变化=>视图更新； 视图交互变化=>数据model变更的双向绑定效果。

