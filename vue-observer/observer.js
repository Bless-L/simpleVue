function Observer(data){
	this.data = data;
	this.observe(data);
}

Observer.prototype = {
	observe: function(data){
		if (!data || typeof data !== 'object') {
			return;
		}
		Object.keys(data).forEach(function(key){
			this.defineReactive(data, key, data[key]);
		}.bind(this))
	},
	defineReactive: function(data, key, val){
		var dep = new Dep();
		var self = this;
		self.observe(val);

		Object.defineProperty(data, key, {
			enumerable: true,
			configureable: false,
			get: function(){
				Dep.target && dep.addSub(Dep.target);
				return val;
			},
			set: function(newVal){
				if(val === newVal){
					return;
				}
				val = newVal;
				self.observe(newVal);
				dep.notify();
			}
		})
	}
}

function Vue(options){
	this.$options = options;
	this.$el = typeof options.el === 'string'
			? document.querySelector(options.el)
			: options.el || document.body;

	var data = this._data = this.$options.data;
	
	var ob = new Observer(this._data);
	if(!ob) return;

	Object.keys(data).forEach(function(key){
		this._proxy(key);
	}.bind(this))

	new Compiler({el: this.$el, vm: this});
}

Vue.prototype = {
	_proxy: function(key){
		var self = this;
		Object.defineProperty(self, key, {
			configureable: false,
			enumerable: true,
			get: function(){
				return self._data[key];
			},
			set: function(val){
				self._data[key] = val;
			}
		})
	},
	$watch: function(expOrFn, cb){
		new Watcher(this, expOrFn, cb);
	}
}