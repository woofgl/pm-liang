'use strict';
const fs = require('fs-extra-plus');
const path = require('path');
var dataPath = "../../data/";

class BaseDao{

	constructor(entity){
		this._entity = entity;
		this._seq = 1;
	}

	async get(key){
		var data = await getJsonData.call(this);
		return data[key];
	}

	// create an entity, and return id.
	async create(dataEntity){
		var data = await getJsonData.call(this);
		var entity = Object.assign({}, dataEntity);
		entity["id"] = getSeq.call(this);
		data[entity.id] = entity;
		await setJsonData.call(this, data);
		return entity.id;
	}

	async update(id, dataEntity){
		var entity = null;
		if(id){
			var data = await getJsonData.call(this);
			if(data[id]){
				entity = Object.assign({id: id}, data[id], dataEntity);
				data[id] = entity;
				setJsonData.call(this, data);
			}
		}
		return entity;
	}

	async delete(key){
		if(key){
			var data = await getJsonData.call(this);
			if(data[key]){
				delete data[key];
				await setJsonData.call(this, data);
			}
		}
	}

	async list(filters){
		var data = await getJsonData.call(this);
		var tmpList = [];

		var item;

		// get the eventual filters
		if (filters){
			// make sure it is an array of filter
			filters = (filters instanceof Array)?filters:[filters];
		}

		for (var k in data){
			item = data[k];
			// add it to the list if no filters or it passes the filters
			if (!filters || passFilter(item, filters)){
				tmpList.push(item);
			}
		}

		return tmpList;
	}
}
module.exports = BaseDao;

// --------- BaseDao Utilities --------- //

function getSeq(){
	return this._seq++;
}

async function getJsonData(){
	var jsonObject = {};
	try{
		let data = await fs.readFile(getJsonFile.call(this), 'utf8');
		jsonObject = JSON.parse(data);
	}catch(e){
	}
	return jsonObject;
}

async function setJsonData(jsonObject){
	let jsonData = JSON.stringify(jsonObject);
	var file = getJsonFile.call(this);
	await fs.writeFile(file, jsonData, "utf8");
}

function getJsonFile(){
	var filePath = path.join(__dirname, dataPath);
	fs.ensureDirSync(filePath);
	return path.join(__dirname, dataPath + "data-" + this._entity + ".json");
}

// --------- /BaseDao Utilities --------- //



var filterDefaultOp = "=";
// Important: filters must be an array
function passFilter(item, filters){
	
	var pass;

	// each condition in a filter are OR, so, first match we can break out.
	// A condition item is a js object, and each property is a AND
	var i = 0, l = filters.length, cond, k, v, propName, op, itemV;
	for (; i < l; i++){
		pass = true;

		cond = filters[i];
		for (k in cond){
			// TODO: For now, just support the simple case where key is the property name
			//       Will need to add support for the operator in the key name
			propName = k;
			op = filterDefaultOp; // TODO: will need to get it for key

			// value to match
			v = cond[k];

			// item value
			itemV = item[propName];


			switch(op){
			case "=":
				// special case if v is null (need to test undefined)
				if (v === null){
					pass = pass && (itemV == null);
				}else{
					pass = pass && (v === itemV);	
				}
				
				break;				
			}

			// if one fail, break at false, since within an object, we have AND
			if (!pass){
				break;
			}
		}

		// if one of those condition pass, we can return true since within the top filter array we have OR.
		if (pass){
			break;
		}
	}

	return pass;
}
