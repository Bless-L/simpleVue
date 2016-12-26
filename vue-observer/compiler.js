function Compiler(options){
	this.$el = options.el;

	this.$vm = options.vm;

	if (this.$el) {
		this.$fragment = nodeToFragment(this.$el);
		this.compiler(this.$fragment);
		this.$el.appendChild(this.$fragment);
	}
}

Compiler.prototype = {
	compiler: function(node, scope){
		var childs = [].slice.call(node.childNodes);
		childs.forEach(function(child){
			if (child.nodeType === 3) {
				this.compileElementNode(child, scope);
			}else if(child.nodeType === 1){
				this.compileTextNode(child, scope);
			}
		}.bind(this))
	},

	compileTextNode: function(textNode, scope){
		var text = textNode.textContent.trim();
		if(!text) return;

		var exp = parseTextExp(text);
		scope = scope || this.$vm;

		this.textHandler(textNode, exp, scope);
	},

	compileElement: function(ElementNode, scope){

	},

	textHandler: function(textNode, exp, scope){
		new Watcher(this.$vm, exp, function(newVal, oldVal){
			textNode.textContent = !newVal ? '' + oldVal : newVal + oldVal;
		})
	}
}













function parseTextExp(text) {
    var regText = /\{\{(.+?)\}\}/g;
    var pieces = text.split(regText);
    //console.log(pieces);

    var matches = text.match(regText);
    //console.log(matches);
    var tokens = [];
    pieces.forEach(function (piece) {
        if (matches && matches.indexOf('{{' + piece + '}}') > -1) {    // 注意排除无{{}}的情况
            tokens.push(piece);
        } else if (piece) {
            tokens.push('`' + piece + '`');
        }
    });
    return tokens.join('+');
}

function nodeToFragment(node){
	var fragment = document.createDocumentFragment(), child;
	while(child = node.firstChild){
		if (isIgnorable(child)){
			node.removeChild(child);
		}else {
			fragment.appendChild(child);
		}
	}
	return fragment;
}

function isIgnorable(node){
	var regIgnorable = /^[\t\n\r]+/;
	return (node.nodeType == 8) || ((node.nodeType == 3) && (regIgnorable.test(node.textContent)));
}