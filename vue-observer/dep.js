var depUid = 0;

function Dep(){
	this.uid = depUid++;
	this.subs = {};
}

Dep.prototype = {
	addSub: function(sub){
		if(!this.subs[sub.uid]){
			this.subs[sub.uid] = sub;
		}
	},
	notify: function(){
		for(var uid in this.subs){
			this.subs[uid].update();
		}
	}
}