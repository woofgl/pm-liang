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
				todoDso.create({subject: val}).then(function(){
					inputEl.value = "";
				});
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
			todoDso.update(entityRef.id, {done:done});			
		}, 

		// double clicking on a label makes it editable
		"dblclick; .editable": function(evt){
			editTodo.call(this, utils.entityRef(evt.target, "Todo"));
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
			view._dragHolderEl = d.closest(evt.target, ".drag-holder");
			view._dragTr = d.closest(view._dragHolderEl, ".ui-tr");
			view._dragTr.classList.add("dragging");
		}
		// --------- /todo-item UI Events --------- //		
	}, // .events

	docEvents: {
		"mousemove": function(){
			var view = this;
			if(view._dragHolderEl){
				
			}
		},

		"mouseup": function(){
			var view = this;
			if(view._dragHolderEl){
				
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

		// if the newSubject (in the input) is different, then, we update.
		if (data.subject !== data.newSubject){
			todoDso.update(entityRef.id, {subject: data.newSubject}).then(function(){
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


function editTodo(entityRef){
	var todoEl = entityRef.el;

	var labelEl = d.first(todoEl, "label");
	var currentSubject = labelEl.innerHTML;

	todoEl.classList.add("editing");

	// create the input HTML and add it to the entity element
	var inputHTML = render("TodoMainView-input-edit", {subject: currentSubject});
	todoEl.insertAdjacentHTML("beforeend", inputHTML);

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
// --------- /Private View Methods --------- //
