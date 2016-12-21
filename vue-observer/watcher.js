!function(window){
	var uid = 0;
	function Watcher(vm, expOrFn, cb){
		this.uid = uid++;
		this.$vm = vm;
		this.expOrFn = expOrFn;
		this.value = null;
		this.cb = cb;
		this.update();
	}
	Watcher.prototype = {
		get: function(){
			Dep.target = this;
			var value = this.$vm._data[this.expOrFn];
			Dep.target = null;
			return value;
		},
		update: function(){
			var newVal = this.get();
			if(newVal !== this.value){
				this.cb.call(this.$vm, newVal, this.value);
				this.value = newVal;
			}
		}
	}

	window.Watcher = Watcher;
}(window)