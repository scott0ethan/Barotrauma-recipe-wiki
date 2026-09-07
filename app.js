let db = null;
	
async function loadDatabase() {
	const SQL = await initSqlJs({
	locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
	});

	const response = await fetch('./barotrauma.db');
	const buffer = await response.arrayBuffer();

	db = new SQL.Database(new Uint8Array(buffer));
	
	console.log("db loaded");
	
	handleRoute();
}

function handleRoute(){
	//hide all sections (item, tag, index)
	document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
	document.getElementById('error-display').classList.add('hidden');
	
	//get the url hash and item/tag id
	const hash = window.location.hash;
	const parts = hash.slice(1).split('/'); 
	const route = parts[0];
	const id = parts[1];
	
	console.log(`hash "${hash}", route "${route}", id "${id}"`);
	
	switch(route){
		case "item":
			renderItemDetails(id);
			break;
			
		case "tag":
			renderTagDetails(id);
			break;
		case "talent":
			renderTalentDetails(id);
			break
		default:
		case "index":
			renderIndexDetails();
			break;
	}
	
	updateSidebar();
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const row = stmt.step() ? stmt.getAsObject() : null;
  
  stmt.free();
  return row;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  
  stmt.free();
  return rows;
}

function get_translated_name(id, fallback=null){
	const item = queryOne("SELECT identifier, name, nameidentifier FROM items WHERE identifier = ?;", [id]);
	if (!item){ return fallback; }
	const translation = queryOne("SELECT name FROM translations WHERE identifier = ?;", [item.nameidentifier ?? item.identifier]);
	const name = translation?.name || item.name || fallback;
	return name;
}

function json_object_to_xml_string(obj, indent=''){
	let attr_string = '';
	Object.entries(obj.attributes).forEach(([key, value]) => {
		attr_string += `'${key}': '${value}' `
	});
	attr_string = attr_string.slice(0, -1);
	
	let children_string = '';
	obj.children.forEach(child => {
		children_string += json_object_to_xml_string(child, indent+'\t')+'\n';
	});
	
	let str = `${indent}<${obj.tag} ${attr_string}>${obj.text? `\n${indent}\t`+obj.text : ""}${children_string ? '\n'+children_string+indent : ""}</${obj.tag}>`;
	return str;
}

function createInlineList(container, links, prefix="", postfix="", separator=", ") {
	//container.innerHTML = '';

	if (prefix) { container.appendChild(document.createTextNode(prefix)); }

	links.forEach((item, index) => {
		const link = document.createElement('a');
		link.href = item.url;
		link.textContent = item.label;

		container.appendChild(link);

		if (index < links.length - 1) {
		  container.appendChild(document.createTextNode(separator));
		}
	});

  if (postfix) { container.appendChild(document.createTextNode(postfix)); }
}

function get_attribute(obj, attribute_str_or_list, default_value=undefined){
	if (!obj) return undefined;
	
	let true_key = null;
	
	if (Array.isArray(attribute_str_or_list)){
		const targets = attribute_str_or_list.map(str => str.toLowerCase())
		true_key = Object.keys(obj).find(key => 
			targets.includes(key.toLowerCase())
		);
	}
	else if (typeof attribute_str_or_list === 'string'){
		const target = attribute_str_or_list.toLowerCase();
		true_key = Object.keys(obj).find(key => 
			key.toLowerCase() === target
		);
	}
	
	return true_key ? obj[true_key] : default_value;
}

function comma_string_to_list(str){
	return str?.split(",").map(t => t.trim()).filter(Boolean) || [];
}

function renderItemDetails(id){
	//unhide section and hide all subelements of the section	
	const section = document.getElementById('item-view');
	section.classList.remove("hidden");	
	Array.from(section.children).forEach(child => {
	  child.classList.add('hidden');
	});
	
	function show_error_message(message){
		const error_element = document.getElementById('error-display');
		error_element.textContent = message;
		error_element.classList.remove('hidden');
	}
	
	if (!db) {
		console.log("tried to render item page when no db loaded");
		show_error_message("Waiting for db...");
		return 0;
	}
	if (!id){
		console.log("tried to render item page with no hash \'identifier\'");
		show_error_message(`Invalid url hash.`);
		return 0;
	}
	
	const item = queryOne(`
		SELECT 
		  identifier,
		  nameidentifier, 
		  name, 
		  json_data
		FROM items 
		WHERE identifier = ?;`,
	    [id]
	);
	if (!item){ 
		console.log("item id not found in db");
		show_error_message(`Item identifier '${id}' not found.`);		
		return 0; 
	}
	
	item.json_data = item.json_data ? JSON.parse(item.json_data) : null;
	console.log(item.json_data);
	
	const translation = queryOne("SELECT * FROM translations WHERE identifier = ?;", [item.nameidentifier ?? item.identifier]);
	
	//item name	
	const name = get_translated_name(item.identifier);
	if (name) {
		const name_element = document.getElementById("item-name");
		name_element.textContent = name;
		name_element.classList.remove('hidden');
	}
	
	//item identifier
	const identifier_element = document.getElementById("item-identifier");
	identifier_element.textContent = `(${item.identifier})`;
	identifier_element.classList.remove('hidden');
	
	//item desccription
	const description_element = document.getElementById("item-description");
	const description = translation?.description ?? get_attribute(item, "desccription");
	description_element.textContent = description;
	description_element.classList.remove('hidden');
	
	//item variant of
	const variant_id = get_attribute(item.json_data.attributes, "variantof");
	if (variant_id) {
		const variant_element = document.getElementById("item-variant");
		const variant_a_element = variant_element.querySelector('a');
		const variant_name = get_translated_name(variant_id, fallback=variant_id);
		variant_a_element.textContent = variant_name;
		variant_a_element.href = `/#item/${variant_id}`;
		variant_element.classList.remove('hidden');
	}
	
	//other item variants
	const variants_rows = queryAll("SELECT child AS variant_id FROM variants WHERE base = ?;", [item.identifier]);
	if (variants_rows.length > 0){
		const variants_element = document.getElementById("item-variants");
		const links = variants_rows.map(row => ({
			label: get_translated_name(row.variant_id, fallback=row.variant_id),
			url: `/#item/${row.variant_id}`
		}));
		variants_element.innerHTML = '';
		createInlineList(variants_element, links, prefix="Variants: ");
		variants_element.classList.remove('hidden');
	}
	
	//item tags	
	const tags = comma_string_to_list(get_attribute(item.json_data.attributes, ["tags", "tag"]))
	if (tags.length > 0){
		const tags_element = document.getElementById("item-tags");
		const links = tags.map(id => ({
			label: id,
			url: `/#tag/${id}`
		}));
		tags_element.innerHTML = '';
		createInlineList(tags_element, links, prefix="Tags: ");
		tags_element.classList.remove('hidden');
	}
		
	//item recipes (how the item is crafted, NOT recipes it is used in)
	const fabricate_data = item.json_data.children.filter(child => child.tag == "Fabricate");
	if (fabricate_data.length > 0){
		const recipes_element = document.getElementById("item-recipes");
		const crafting_list_element = document.getElementById("crafting-list");
	
		recipes_element.classList.remove("hidden");
		crafting_list_element.innerHTML = '';
		
		//foreach recipe
		for (const fabricate of fabricate_data){			
			//get suitable fabricators
			const suitable_fab_tags = comma_string_to_list(get_attribute(fabricate.attributes, "suitablefabricators"));
			const suitable_fab_ids = new Set()
			suitable_fab_tags.forEach( tag => {
				//this query gets every item that has a tag matching one in the suitablefabricators list,
				//it should only show items that themselves have a Fabricator child element.
				const suitable_fab_rows = queryAll(`SELECT item FROM tags WHERE tag = ?`, [tag]);
				suitable_fab_rows.forEach( row => {
					suitable_fab_ids.add(row.item);
				});				
			});
			
			if (suitable_fab_ids.size == 0){
				continue;
			}
			
			const fabricate_li = crafting_list_element.appendChild(document.createElement('li'));
			
			const links = [...suitable_fab_ids].map(id => ({
				label: get_translated_name(id, fallback=id),
				url: `/#item/${id}`
			}));
			createInlineList(fabricate_li, links);
			
			//create list for recipe details
			const fabricate_sublist = fabricate_li.appendChild(document.createElement('ul'));
			
			//is a vendingmachine?
			const requiredmoney = get_attribute(fabricate.attributes, "requiredmoney");
			if (requiredmoney){
				const price_element = fabricate_sublist.appendChild(document.createElement('li'));
				price_element.textContent = `Uses ${requiredmoney} mk`;
			}
			//is not a vending machine
			else{				
				//show yield amount
				const yield_amount = get_attribute(fabricate.attributes, "amount", "1");
				if (yield_amount != "1"){
					const yield_element = fabricate_sublist.appendChild(document.createElement('li'));
					yield_element.textContent = `Yields ${yield_amount}`;
				}
				
				//list ingredients
				const required_items = fabricate.children.filter(child => child.tag === "RequiredItem")
				for (const required_item of required_items){
					const ingredient_element = fabricate_sublist.appendChild(document.createElement('li'));
									
					//use amount
					const amount = get_attribute(required_item.attributes, "amount", default_value="1");
					const mincondition = get_attribute(required_item.attributes, "mincondition", default_value="0.0");
					const use_condition = get_attribute(required_item.attributes, "usecondition", default_value="false").toLowerCase();
					
					let prefix = null
					
					if (use_condition === "true"){
						prefix = `Uses ${(parseFloat(mincondition)*100.0).toFixed(0)}% of `;
					}
					else {
						prefix = `Uses ${amount} `;
					}
					
					//ingredient id/tag link
					const required_item_id = get_attribute(required_item.attributes, "identifier");
					const required_item_tag = get_attribute(required_item.attributes, "tag");
					const link = document.createElement('a');				
					if (required_item_id){
						link.href = `/#item/${required_item_id}`;
						link.textContent = get_translated_name(required_item_id, fallback=required_item_id);
					}
					else if (required_item_tag){
						prefix += "tag:"
						link.href = `/#tag/${required_item_tag}`;
						link.textContent = `${required_item_tag}`;
					}
					
					ingredient_element.appendChild(document.createTextNode(prefix));
					ingredient_element.appendChild(link);
					
					//todo, list min/max amount in a sublist for each ingredient if usecondition is false
				}
				
				//list required skill
				const required_skills = fabricate.children.filter(child => child.tag === "RequiredSkill")
				for (const required_skill of required_skills){
					const skill_element = fabricate_sublist.appendChild(document.createElement('li'));
					
					const skill_identifier = get_attribute(required_skill.attributes, "identifier");
					const skill_level = get_attribute(required_skill.attributes, "level");
					
					skill_element.textContent = `Requires ${skill_level} ${skill_identifier} skill`;
				}
				
				//list required recipe
				const requires_recipe = get_attribute(fabricate.attributes, "requiresrecipe", default_value="false").toLowerCase();
				if (requires_recipe === "true"){
					const recipe_element = fabricate_sublist.appendChild(document.createElement('li'));
					
					const unlock_items_rows = queryAll("SELECT unlocker FROM unlock_items WHERE unlockee = ?;", [item.identifier]);
					const unlock_talents_rows = queryAll("SELECT unlocker FROM unlock_talents WHERE unlockee = ?;", [item.identifier]);
					
					const items_links = []
					unlock_items_rows.forEach(row => {
						items_links.push(({
							label: get_translated_name(row.unlocker, fallback=row.unlocker),
							url: `/#item/${row.unlocker}`
						}))
					});
					
					const talents_links = []
					unlock_talents_rows.forEach(row => {
						talents_links.push(({
							label: row.unlocker,
							url: `/#talent/${row.unlocker}`
						}))
					});
					
					recipe_element.appendChild(document.createTextNode("Required learned recipe"));
					if (items_links.length > 0){
						recipe_element.appendChild(document.createTextNode(" from "));
						createInlineList(recipe_element, items_links, prefix=(items_links.length > 1 ? "one of the items: " : "the item: "));
					}
					
					
					if (talents_links.length > 0){
						const text = items_links.length > 0 ? "; or " : " from ";
						recipe_element.appendChild(document.createTextNode(text)); 
						createInlineList(recipe_element, talents_links, prefix=(talents_links.length > 1 ? "one of the talents: " : "the talent: "));
					}
					
				}
			}
		}
	}
	
	function populate_html_item_list(identifier_list, element_id){		
		if (identifier_list.length > 0){
			const element = document.getElementById(element_id);
			const list_element = element.querySelector('ul');
			
			element.classList.remove("hidden");
			list_element.innerHTML = '';
			
			identifier_list.forEach(id => {
				const li = list_element.appendChild(document.createElement('li'));
				const link = li.appendChild(document.createElement('a'));
				link.textContent = get_translated_name(id, fallback=id);
				link.href = `/#item/${id}`;
			});
		}
	}
	
	//recipes the item is used in
	let output_items = new Set()	
	//as a tag
	tags.forEach( tag => {
		const tag_ingredient_rows = queryAll(`SELECT output FROM tag_ingredients WHERE ingredient = ?`, [tag]);
		tag_ingredient_rows.forEach( row => {
			output_items.add(row.output);
		});				
	});
	//as an item
	const item_ingredient_rows = queryAll(`SELECT output FROM item_ingredients WHERE ingredient = ?`, [item.identifier]);
	item_ingredient_rows.forEach( row => {
		output_items.add(row.output);
	});
	output_items = [...output_items]
	populate_html_item_list(output_items, "item-ingredient");
	
	//unlocks recipes for
	populate_html_item_list(
		queryAll("SELECT unlockee FROM unlock_items WHERE unlocker = ?;", [item.identifier]).map(row => row.unlockee), 
		"item-unlock"
	);
	
	//deconstructs from
	populate_html_item_list(
		queryAll("SELECT input FROM deconstructables WHERE output = ?;", [item.identifier]).map(row => row.input),
		"item-deconstruct-from"
	);
	
	//spawns
	populate_html_item_list(
		queryAll("SELECT spawnee FROM spawners WHERE spawner = ?;", [item.identifier]).map(row => row.spawnee),
		"item-spawner"
	);
	
	//spawned from
	populate_html_item_list(
		queryAll("SELECT spawner FROM spawners WHERE spawnee = ?;", [item.identifier]).map(row => row.spawner),
		"item-spawnee"
	);
	
	//fabricator for
	populate_html_item_list(
		queryAll("SELECT item FROM suitable_fabricators WHERE fabricator = ?;", [item.identifier]).map(row => row.item),
		"item-fabricator"
	);
	
	//todo	
	//deconstructs into
	
	//show xml
	const item_json_element = document.getElementById("item-json");
	const item_json_text_element = item_json_element.querySelector("p");
	item_json_element.classList.remove('hidden');
	item_json_text_element.textContent = json_object_to_xml_string(item.json_data);
}

function renderTagDetails(id){
}

function renderTalentDetails(id){
}

function renderIndexDetails(){
	//unhide section
	const section = document.getElementById('index-view');
	section.classList.remove("hidden");		
}

function updateSidebar() {
}

loadDatabase();
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);

