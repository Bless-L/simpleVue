var depUid = 0;

function Dep(){
	this.uid = depUid++;
	this.subs = [];
}

Dep.prototype = {
	addSub: function(sub){
		this.subs.push(sub);
	},
	notify: function(){
		this.subs.forEach(function(sub){
			sub.update();
		})
	}
}