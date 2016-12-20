function Observer(data){
	this.data = data;
	this.observe(data);
}

Observer.prototype = {
	observe: function(){

	},
	defineReactive: function(data, key, val){
		var dep = new Dep();
		var seft = this;

		Object.defineProperty(data, key, {
			enumerable: true,
			configureable: false,
			get: function(){
				Dar.target && dep.addSub(Dar.target);
				return val;
			},
			set: function(newVal){
				if(val === newVal){
					return;
				}
			}
		})
	}
}