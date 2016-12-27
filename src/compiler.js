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
	//分两类，节点和文本节点，同时进行递归
	compiler: function(node, scope){
		var childs = [].slice.call(node.childNodes);
		childs.forEach(function(child){
			if (child.nodeType === 1) {
				this.compileElementNode(child, scope);
			}else if(child.nodeType === 3){
				this.compileTextNode(child, scope);
			}
		}.bind(this))
	},

	compileTextNode: function(textNode, scope){
		var text = textNode.textContent.trim();
		if(!text) return;

		//将文本中的{{a + 'bbb'}} asdsd 转换成 scope.a + 'bbb' + asdsd 的形式
		var exp = parseTextExp(text);
		scope = scope || this.$vm;

		this.textHandler(textNode, exp, scope);
	},

	compileElementNode: function(elementNode, scope){
		var attrs = [].slice.call(elementNode.attributes);
		var lazyCompileDir, lazyCompileExp;
		scope = scope || this.$vm;

		attrs.forEach(function(attr){
			
			var name = attr.name;
			var exp = attr.value;

			var dir = checkDirective(name);

			if (dir.type) {
				if (dir.type === 'if' || dir.type === 'for') {
					lazyCompileDir = dir.type;
					lazyCompileExp = exp;
				} else {
					var handler = this[dir.type + 'Handler'].bind(this);  // 不要漏掉bind(this)，否则其内部this指向会出错
					if (handler) {
						handler(elementNode, exp, dir.prop, scope);
					} else {
						console.error('找不到' + dir.type + '指令');
					}
				}
				elementNode.removeAttribute(name);
			}
		}.bind(this))

		lazyCompileDir ? this[lazyCompileDir + 'Handler'](elementNode, lazyCompileExp, scope) : this.compiler(elementNode, scope);

	},

	//Handler全部是进行指令解析及绑定操作
	textHandler: function(textNode, exp, scope){
		new Watcher(scope, exp, function(newVal){
			textNode.textContent = !newVal ? '' : newVal ;
		})
	},

	bindHandler: function(node, exp, attr, scope){
		new Watcher(scope, exp, function(newVal){
			newVal = !newVal ? '' : newVal ;
			node.setAttribute(attr, newVal);
		})
	},

	onHandler: function(node, exp, eventType, scope){
		if (!eventType) {
			console.warn(eventType, '事件不存在或绑定失败');
			return;
		}
		var fn = scope[exp];

		if (typeof fn === 'function') {
			node.addEventListener(eventType, fn.bind(scope, $event))
		}else {
			node.addEventListener(eventType, function($event){
				//对于v-on:xxx=fn('a')的表达式要做event的参数传递处理
				//给scope带上一个$event属性，在表达式上显式写上fn('a', $event)，作为参数传入
				scope.$event = $event;
				computeExpression(exp, scope);
				scope.$event = null; //执行完后清空
			})
		}
	},

	modelHandler: function(node, exp, prop, scope){
		if(node.tagName.toLowerCase() === 'input'){
			switch (node.type) {
				case 'checkbox':

					break;
				case 'radio':

					break;
				case 'file':

					break;
				default:
					new Watcher(scope, exp, function(newVal){
						//没有输入的时候才更新值
						if (!node.isInputting) {
							node.value = !newVal ? '' : newVal ;
						}
						node.isInputting = false;
					})
					node.addEventListener('input', function (e) {
						node.isInputting = true;   // 由于上面绑定了自动更新，循环依赖了，中文输入法不能用。这里加入一个标志避开自动update
						var calExp = exp + '=`' + e.target.value + '`';
						with (scope) {
							eval(calExp);
						}
					});
			}
		}
	},

	ifHandler: function(node, exp, scope){
		this.compiler(node);

		var refNode = document.createTextNode('');
		node.parentNode.insertBefore(refNode, node);
		var current = node.parentNode.removeChild(node);

		new Watcher(scope, exp, function(newVal, oldVal){
			if (newVal) {
				refNode.parentNode.insertBefore(current, refNode);
			}else{
				!newVal === !oldVal ? void(0) : refNode.parentNode.removeChild(current);
			}
		})
	},

	forHandler: function(node, exp, scope){
		var self = this;
		var itemName = exp.split('in')[0].replace(/\s/g, '');
		var arrNames = exp.split('in')[1].replace(/\s/g, '');
		var parentNode = node.parentNode;
		var startNode = document.createTextNode('');
		var endNode = document.createTextNode('');
		var range = document.createRange();
		parentNode.replaceChild(endNode, node); // 去掉原始模板
		parentNode.insertBefore(startNode, endNode);
		new Watcher(scope, arrNames, function (newArray) {
			// 目前是全量更新，@todo 可以根据options传过来的method和args像操作数组一样操作dom
			range.setStart(startNode, 0);
			range.setEnd(endNode, 0);
			range.deleteContents();
			newArray.forEach(function (item, index) {
				var cloneNode = node.cloneNode(true);
				parentNode.insertBefore(cloneNode, endNode);
				var forScope = Object.create(scope);  // for循环内作用域绑定在当前作用域之下，注意每次循环要生成一个新对象
				forScope.$index = index;   // 增加$index下标
				forScope[itemName] = item;  // 绑定item作用域
				self.compiler(cloneNode, forScope);  // @FIXME 同样的编译应该有缓存机制
			});
		});
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

function checkDirective(attrName){
	attrName = attrName.toLowerCase();
	var dir = {};
	if (attrName.indexOf('v-') === 0) {
		var parse = attrName.substring(2).split(':');
		dir.type = parse[0];
		dir.prop = parse[1];
	}else if (attrName.indexOf('@') === 0) {
		dir.type = 'on';
		dir.prop = attrName.substring(1);
	}else if(attrName.indexOf(':') === 0){
		dir.type = 'bind';
		dir.prop = attrName.substring(1);
	}

	return dir;
}