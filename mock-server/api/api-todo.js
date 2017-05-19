const daos = require("../dao/daos");
const moment = require("moment");
const routes = []; 

const baseURI = "/api";

// This export One Extension that can have multiple routes 
// that will be loaded by server
module.exports = routes;

// --------- Usage APIs --------- //
routes.push({
	method: 'GET',
	path: baseURI + "/todo/list", 
	handler: {
		async: async function (request, reply) {
			var todoDao = daos.todo;
			var filters = null;
			if(request.url.query.opts){
				var opts = JSON.parse(request.url.query.opts);
				filters = opts.filters;
			}
			var list = await todoDao.list(filters);
			reply(list);
		}
	}
});

routes.push({
	method: 'GET',
	path: baseURI + "/todo/get",
	handler: {
		async: function(request, reply){
			var todoDao = daos.todo;
			var entity = todoDao.get(parseInt(request.url.query.id));
			reply(entity || {});
		}
	}
});

routes.push({
	method: 'POST',
	path: baseURI + "/todo/create",
	handler: {
		async: function(request, reply){
			var todoDao = daos.todo;
			var entity = JSON.parse(request.payload.entity);
			entity = Object.assign({}, entity, {lastUpdate: moment().format("YYYY-MM-DD HH:mm:ss")});
			var entityId = todoDao.create(entity);
			entity.id = entityId;
			reply(entity);
		}
	}
});

routes.push({
	method: 'POST',
	path: baseURI + "/todo/update", 
	handler: {
		async: function(request, reply){
			var todoDao = daos.todo;
			var entity = JSON.parse(request.payload.entity);
			var id = request.payload.id * 1;
			entity = Object.assign({}, entity, {lastUpdate: moment().format("YYYY-MM-DD HH:mm:ss")});
			entity = todoDao.update(id, entity);
			reply(entity);
		}
	}
});

routes.push({
	method: 'POST',
	path: baseURI + "/todo/delete", 
	handler: {
		async: function(request, reply){
			var todoDao = daos.todo;
			var entityId = todoDao.delete(request.payload.id);
			reply({id: entityId});
		}
	}
});
// --------- /Usage APIs --------- //