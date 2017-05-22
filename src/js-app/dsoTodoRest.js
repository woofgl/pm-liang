var utils = require("./utils.js");
var DsoRest = require("./dsoRest.js");
var ajax = require("./ajax");

function DsoTodoRest(type){
	DsoTodoRest._super.constructor.call(this, type);
}
module.exports = DsoTodoRest;
utils.inherit(DsoTodoRest, DsoRest);


DsoTodoRest.prototype.updateRank = function(items){
	return ajax.post("/api/todo/updateRank", {items: JSON.stringify(items)}).then(function(entity){
		// we public the dataservice event
		d.hub("dataHub").pub("Todo", "update", items);
		return entity;
	});
};
