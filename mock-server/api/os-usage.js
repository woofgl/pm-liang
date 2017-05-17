const top = require("os-top");

const routes = []; 

const baseURI = "/api";

// This export One Extension that can have multiple routes 
// that will be loaded by server
module.exports = routes;



// // --------- Data Capture --------- //
// var lastRequestedMs = null;
// var maxIdle = 3000; // time to stop the fetch if nobody is requesting the data

// var arrayLimit = 10;
// var delay = 1000; // delay in beteween top.fetch

// var cpuStats = [];
// var memStats = [];
// var procs = [];

// var on = false;


// // the lastRequestedMs scheme allow to run the expensive Top command every delay only if it is being requested.
// function touchLastRequested(){
// 	lastRequestedMs = new Date().getTime();

// 	// if it was not running, we run it
// 	if (!on){
// 		on = true;
// 		console.log("os-usage.js - starting top.fetch every " + (delay/1000) + "s");
// 		topFetch();
// 	}

// }

// function topFetch(){
// 	var nowMs = new Date().getTime();

// 	// if the lastRequested was > than maxIdel, then, we pause the loop
// 	if (lastRequestedMs == null || (nowMs - lastRequestedMs) > maxIdle){
// 		on = false;
// 		console.log("os-usage.js - stopping topFetch");
// 		return;
// 	}

// 	top.fetch().then(function(data){
// 		_addData(cpuStats, data.stats.cpu);
// 		_addData(memStats, data.stats.mem);
// 		procs = data.procs;
// 		// TODO: need to have the topCpuProcs and the topMemProcs

// 		setTimeout(topFetch, delay);
// 	}).catch(function(ex){
// 		console.log("FAIL - top.fetch - " + ex);
// 	});
// }





// // private function that add an new data item to its list, add time, max the list at usageLimit 
// function _addData(list, data){
// 	const nowMs = new Date().getTime();

// 	data.time = nowMs;
// 	list.push(data);

// 	if (list.length > arrayLimit){
// 		list.splice(0,1);
// 	}	
// }

// // --------- /Data Capture --------- //

// // --------- Usage APIs --------- //
// routes.push({
// 	method: 'GET',
// 	path: baseURI + "/cpuUsage", 
// 	handler: {
// 		async: function(request, reply){
// 			touchLastRequested();
// 			reply(cpuStats);
// 		}
// 	}
// });

// routes.push({
// 	method: 'GET',
// 	path: baseURI + "/topCpuProcs", 
// 	handler: {
// 		async: function(request, reply){
// 			touchLastRequested();
// 			reply(procs);
// 		}
// 	}
// });


// routes.push({
// 	method: 'GET',
// 	path: baseURI + "/memUsage", 
// 	handler: {
// 		async: function(request, reply){
// 			touchLastRequested();
// 			reply(memStats);
// 		}
// 	}
// });



// routes.push({
// 	method: 'GET',
// 	path: baseURI + "/topMemProcs", 
// 	handler: {
// 		async: function(request, reply){
// 			touchLastRequested();
// 			reply(procs);
// 		}
// 	}
// });
// --------- /Usage APIs --------- //