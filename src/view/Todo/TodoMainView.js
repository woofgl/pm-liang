var d = mvdom; // external/global lib
var render = require("../../js-app/render.js").render;
var utils = require("../../js-app/utils.js");
var dso = require("../../js-app/ds.js").dso;
var route = require("../../js-app/route.js");

var todoDso = dso("Todo");


d.register("TodoMainView",{

	create: function(data, config){
		return render("TodoMainView");
	}, 

	postDisplay: function(){
		var view = this; // best practice, set the view variable first. 


		view.newTodoIpt = d.first(view.el, "header .new-todo");
		view.newTodoIpt.focus();


		refreshViewFromRoute.call(view);
	},

	events: {
		"click; .btn-edit-mode": function(evt){
			var view = this;
			var target = evt.selectTarget;
			target.classList.toggle("active");
			view.el.classList.toggle("edit-mode");
		},
		"click; .btn-delete": function(evt){
			var view = this;
			var target = evt.selectTarget;
			var entityRef = utils.entityRef(target, "Todo");
			var name = d.first(entityRef.el, ".dx-subject").innerText;
			todoDso.remove(entityRef.id).then(function(){
				d.hub("notifHub").pub("notify", {type: "info", content: "<strong>Task deleted:</strong> " + name});				
			});
		},
		// all input - we disable the default Tab UI event handling, as it will be custom
		"keydown; input": function(evt){
			if (evt.key === "Tab"){
				evt.preventDefault();
			}
		}, 

		// --------- new todo UI Events --------- //
		// Handle the keyup on the input new-todo 
		// enter to create new, and tab to go to first item in the list.
		"keyup; input.new-todo": function(evt){
			var view = this;
			var inputEl = evt.target;

			// press enter
			if (evt.key === "Enter"){
				var val = inputEl.value;
				if (val.length > 0){
					todoDso.create({subject: val}).then(function(){
						inputEl.value = "";
						// send to the notification
						d.hub("notifHub").pub("notify", {type: "info", content: "<strong>New task created:</strong> " + val});				
					});
				}else{
					d.hub("notifHub").pub("notify", {type: "error", content: "<strong>ERROR:</strong> An empty task is not a task."});
				}
			}
			//press tab, make editable the first item in the list
			else if (evt.key === "Tab"){
				var todoEntityRef = utils.entityRef(d.first(view.el, ".items .todo-item"));
				if (todoEntityRef){
					editTodo.call(view, todoEntityRef);
				}
			}
		},
		// --------- /new todo UI Events --------- //

		// --------- todo-item UI Events --------- //
		// toggle check status
		"click; .ctrl-check": function(evt){
			var entityRef = utils.entityRef(evt.target, "Todo");

			// we toggle the done value (yes, from the UI state, as this is what the user intent)
			var done = !entityRef.el.classList.contains("todo-done");
			// we update the todo vas the dataservice API. 
			todoDso.update(entityRef.id, {done:done}).then(function(newEntity){
				if (done){
					d.hub("notifHub").pub("notify", {type: "info", content: "<strong>Task done:</strong> " + newEntity.subject});
				}else{
					d.hub("notifHub").pub("notify", {type: "warning", content: "<strong>Task undone:</strong> " + newEntity.subject});
				}			
			});		
		}, 

		// double clicking on a label makes it editable
		"dblclick; .editable": function(evt){
			editTodo.call(this, utils.entityRef(evt.target, "Todo"), evt.selectTarget);
		}, 

		// when the todo-item input get focus out (we cancel by default)
		"focusout; .todo-item input": function(evt){
			var view = this;
			var entityRef = utils.entityRef(evt.target, "Todo");

			// IMPORTANT: Here we check if the entityEl state is editing, if not we do nothing. 
			//            Ohterwise, we might do the remove inputEl twice with the blur event flow of this element.
			if (entityRef.el.classList.contains("editing")){
				cancelEditing.call(view, entityRef);	
			}	
		}, 

		// when user type enter or tab in the todo-item input
		"keyup; .todo-item input": function(evt){
			var view = this;
			var inputEl = evt.target;
			var entityRef = utils.entityRef(inputEl, "Todo");

			switch(evt.key){
			case "Enter":
				commitEditing.call(view, entityRef).then(function(){
					// focus the input on enter
					view.newTodoIpt.focus();
				});
				break;

			case "Tab":					
				commitEditing.call(view, entityRef).then(function(){
					var entityEl = d.first(view.el, ".items .todo-item[data-entity-id='" + entityRef.id + "']");
					var siblingTodoEl = (evt.shiftKey)?d.prev(entityEl,".todo-item"):d.next(entityEl,".todo-item");
					if (siblingTodoEl){
						var siblingTodoRef = utils.entityRef(siblingTodoEl, "Todo");	
						editTodo.call(this, siblingTodoRef);
					}else{
						// todo: need to focus on the first new-todo
						view.newTodoIpt.focus();
					}
				});
				break;
			}
		},

		"mousedown; .todo-item .drag-holder": function(evt){
			var view = this;
			view._holderTr = d.closest(evt.target, ".ui-tr");

			var html = view._holderTr.outerHTML;
			var node = document.createElement("div");
			node.innerHTML = html;
			view._dragTr = node.firstChild;
			var rowsConEl = d.closest(view._holderTr, ".items-con");
			rowsConEl.appendChild(view._dragTr);

			view._dragTr.style.width = view._dragTr.clientWidth + "px";
			view._dragTr.style.height = view._dragTr.clientHeight + "px";
			view._dragTr.classList.add("dragging");


			var holderOffset = getOffset.call(view, view._holderTr);
			view._dragOpts = {
				offsetX: evt.pageX - holderOffset.left,
				offsetY: evt.pageY - holderOffset.top
			};

			view._dragTr.style.left = evt.pageX - view._dragOpts.offsetX + "px";
			view._dragTr.style.top = evt.pageY- view._dragOpts.offsetY + "px";
			view.el.classList.add("dragging");

			view._holderTr.classList.add("tr-holder");
		},

		// --------- /todo-item UI Events --------- //		
	}, // .events

	docEvents: {
		"mousemove": function(evt){
			var view = this;
			if(view._dragTr){
				console.log(view._dragOpts);
				view._dragTr.style.left = evt.pageX - view._dragOpts.offsetX + "px";
				view._dragTr.style.top = evt.pageY- view._dragOpts.offsetY + "px";

				var rowsConEl = d.closest(view._holderTr, ".items-con");
				var rows = d.all(rowsConEl, ".todo-item:not(.dragging):not(.tr-holder)");
				for(var i = 0; i < rows.length; i++){
					var row = rows[i];
					var rowOffset = getOffset.call(view, row);
					if(evt.pageX > rowOffset.left && evt.pageY > rowOffset.top && evt.pageX < rowOffset.left + row.clientWidth && evt.pageY < rowOffset.top + row.clientHeight){
						if(evt.pageY > rowOffset.top + row.clientHeight / 2){
							rowsConEl.insertBefore(view._holderTr, row);
						}else{
							rowsConEl.insertBefore(row, view._holderTr);
						}
						break;
					}
				}
			}
		},

		"mouseup": function(evt){
			var view = this;
			if(view._dragTr){
				view._dragTr.style.width = "";
				view._dragTr.style.height = "";
				d.remove(view._dragTr);
				updateRank.call(view);
				view._dragTr = null;

				view._holderTr.classList.remove("tr-holder");
				view._holderTr = null;
				view.el.classList.remove("dragging");
				view._dragOpts = null;
			}
		}
	},


	hubEvents: {
		"dataHub; Todo": function(data, info){
			var view = this;
			refreshList.call(view);
		}, 

		"routeHub; CHANGE": function(routeInfo){
			var view = this;

			refreshViewFromRoute.call(view);
		}
	}

});

// --------- Private View Methods --------- //
// private: commit the the .todo-item pointed by entityRef.el if needed and remove the editing steps
// @return: return a Promise of when it will be done. 
function commitEditing(entityRef){
	return new Promise(function(resolve, fail){
		// Get the name/value of the elements marked by class="dx"
		var data = d.pull(entityRef.el);
		var targetEl = d.first(entityRef.el, ".editing");
		var prop = targetEl.getAttribute("data-prop");

		// if the newSubject (in the input) is different, then, we update.
		if (data[prop] !== data.newValue){
			var obj = {};
			obj[prop] = data.newValue;
			todoDso.update(entityRef.id, obj).then(function(){
				// NOTE: no need to remove the editing state as the list will be rebuilt. 
				resolve();	
			});
		}
		// we cancel the editing (avoiding to do an uncessary update)
		else{
			cancelEditing.call(this,entityRef).then(function(){
				resolve();
			});
		}

	});
}

// Cancel an editing in process. 
// Note: This would not need to to return 
function cancelEditing(entityRef){
	return new Promise(function(resolve, fail){
		// remove the editing class
		entityRef.el.classList.remove("editing");

		// we can remove the input element
		var inputEl = d.first(entityRef.el, "input");
		inputEl.parentNode.removeChild(inputEl);
		return resolve();
	});
}


function editTodo(entityRef, targetEl){
	var todoEl = entityRef.el;

	targetEl = targetEl || d.first(todoEl, "label");
	var currentValue = targetEl.getAttribute("data-value");

	todoEl.classList.add("editing");
	targetEl.classList.add("editing");

	// create the input HTML and add it to the entity element
	var inputHTML = render("TodoMainView-input-edit", {value: currentValue});
	targetEl.insertAdjacentHTML("afterend", inputHTML);

	// set the focus and selection on the input element
	var inputEl = d.first(todoEl, "input");
	inputEl.focus();
	inputEl.setSelectionRange(0, inputHTML.length);
}


// refresh the full view
function refreshViewFromRoute(){
	var view = this;

	// get the path1
	var routeInfo = route.getInfo();
	// get the path1
	var path1 = routeInfo.pathAt(1);
	path1 = (!path1)?"":path1;

	// if the path1 changed, we udpate the nav and refresh the list
	if (view.path1 !== path1){
		this.show = (path1)?path1:"all";

		d.all(view.el, "footer .filter-bar .filter.active").forEach(function(el){
			el.classList.remove("active");
		});

		var href = (path1)?'#todo/' + path1:'#todo';
		var toActiveEl = d.first(view.el, "footer .filter-bar .filter[href='" + href + "']");
		if (toActiveEl){
			toActiveEl.classList.add("active");
		}

		// refresh the list
		refreshList.call(view);

		view.path1 = path1;

	}
}


// private: refrensh the todo list of items
function refreshList(){
	var view = this;
	var filters = null;
	switch(view.show){
	case "all":
		// not filter
		break;
	case "active":
		// done can be null/undefined or false
		filters = [{done: null}, {done: false}];
		break;
	case "completed":
		filters = {done: true};
		break;
	}
	todoDso.list({filters: filters, orderBy: "rank"}).then(function(todos){
		var html = render("TodoMainView-todo-items",{items:todos});
		d.first(view.el,".items .items-con").innerHTML = html;
	});	
}

function updateRank(){
	var view = this;
	var items = [];
	var index = 0;
	d.all(view.el, ".todo-item").forEach(function(itemEl){
		var todoEntityRef = utils.entityRef(itemEl);
		todoEntityRef.rank = index;
		items.push({
			id: todoEntityRef.id,
			rank: index
		});
		index++;
	});
	todoDso.updateRank(items);
}

function getOffset(el){
	var view = this;
	var offset = {left: el.offsetLeft, top: el.offsetTop};
	if(el.offsetParent != null){
		var topOffset = getOffset.call(view, el.offsetParent);
		offset.left += topOffset.left;
		offset.top += topOffset.top;
	}
	return offset; 
}
// --------- /Private View Methods --------- //
