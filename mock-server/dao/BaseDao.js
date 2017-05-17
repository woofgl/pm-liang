'use strict';
const fs = require('fs-extra-plus');
var dataPath = "./server/data/";

class BaseDao{

	constructor(entity){
		this._entity = entity;
		this._seq = 1;
		var dao = this;
	}

	get(key){
		var data = getJsonData.call(view);
		return data[key];
	}

	// create an entity, and return id.
	create(dataEntity){
		var data = getJsonData.call(view);
		var entity = Object.assign({}, dataEntity);
		entity["id"] = getSeq.call(this);
		data[entity.id] = entity;
		setJsonData.call(view, jsonData);
		return entity.id;
	}

	update(dataEntity){
		var entity = Object.assign({}, dataEntity);
		if(entity.id){
			var data = getJsonData.call(view);
			if(data[entity.id]){
				entity = Object.assign({}, data[entity.id], entity);
				setJsonData.call(view, jsonData);
			}
		}
		return entity.id;
	}

	delete(key){
		if(key){
			var data = getJsonData.call(view);
			if(data[key]){
				delete data[key];
			}
		}
	}

	list(){
		var data = getJsonData.call(view);
		var arr = [];
		for(let id of data){
		    arr.push(data[id]);
		}
		return arr;
	}
}

// --------- BaseDao Utilities --------- //

function getSeq(){
	return this._seq++;
}

async function getJsonData(){
	let data = await fs.readFile(getJsonFile.call(this), 'utf-8');
	var jsonObject = JSON.parse(data);
	return jsonObject;
}

async function setJsonData(jsonObject){
	let jsonData = JSON.stringify(jsonObject);
	await fs.writeFile(getJsonFile.call(this), jsonData, "utf8");
}

function getJsonFile(){
	return dataPath + "data-" + this.entity + ".json";
}

// --------- /BaseDao Utilities --------- //

module.exports = BaseDao;

