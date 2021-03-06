var d = mvdom; // external lib
var route = require("./route.js");
var ds = require("./ds.js");
var DsoRest = require("./dsoRest.js");
var ajax = require("./ajax.js");
var DsoTodoRest = require("./dsoTodoRest.js");

/**
 * This module do not externalize anything, but just start the application. 
 * We put it on DOMContentLoader (i.e. $.ready for modern browsers) to make sure it is run after all js are loaded.
 **/ 



// --------- DataService Initialization --------- //
// For the demo, we will have the Memory Dso fallback for any type the application might use. 	
ds.fallback(function(type){
	return new DsoRest(type);
});

ds.register("Todo", new DsoTodoRest("Todo"));

// For production, you might want to have some Entity DSO object that you would register as follow
// ds.register("Task", new TaskDso());
// --------- /DataService Initialization --------- //

// --------- Load svg icons --------- //
// NOTE: We start the loading as soon as possible (before the DOMContentLoaded)
var svgSymbolsPromise = ajax.get("svg/sprite.svg", null, {contentType: "application/xml"});
// --------- /Load svg icons --------- //	


document.addEventListener("DOMContentLoaded", function(event) {

	// we make sure the the ajax for the svg/sprites.svg returns
	svgSymbolsPromise.then(function(xmlDoc){

		// add the symbols to the head (external linking works but has issues - styling, and caching -)
		var firstChildElement = xmlDoc.firstChildElement || xmlDoc.childNodes[0]; // edge does not seem to have .firstChildElement, at least for xlmDoc
		document.querySelector("head").appendChild(firstChildElement);


		//// We can display the MainView now
		var bodyEl = d.first("body");
		// first make sure we empty eventual body.
		d.empty(bodyEl);

		// then add this new MainView
		d.display("MainView", bodyEl).then(function(){

			// initialize the route, which will trigger a "CHANGE" on the routeHub hub. 
			// Note: we do that once the MainView has been added to the DOM so that it can react accordingly
			route.init();
		});

	});


});