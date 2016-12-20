function Watcher(vm, expOrFn, cb){
	this.vm = vm;
	this.exOrfn = expOrFn;
	this.value = null;
	this.update();
}

Watcher.prototype = {
	get: function(){
		Dep.target = this;
		var value = this.vm._data[this.expOrFn];
		Dep.target = null;
		return value;
	},
	update: function(){
		var newVal = this.get();
		if(newVal !== this.value){
			this.cb.call(this.vm, newVal, this.value);
			this.value = newVal;
		}
	}
}