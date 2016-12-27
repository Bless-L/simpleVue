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
			var value = computeExpression(this.$vm, this.expOrFn);
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

	//精髓在于with与eval的应用，用with指定scope作用域，然后用eval执行表达式
	function computeExpression(scope, exp){
		try{
			with(scope){
				return eval(exp);
			}
		} catch(e){
			console.error('ERROR', e);
		}
	}
	window.Watcher = Watcher;
}(window)