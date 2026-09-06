let db = null;
	
async function loadDatabase() {
	const SQL = await initSqlJs({
	locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
	});

	const response = await fetch('./barotrauma.db');
	const buffer = await response.arrayBuffer();

	db = new SQL.Database(new Uint8Array(buffer));
	
	handleRoute();
}

function handleRoute(){
	//hide all mutually exclusive sections (for item, tag, index)
	document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
	
	const hash = window.location.hash;
	const parts = hash.slice(1).split('/'); 
	const route = parts[0];
	const id = parts[1];
	
	switch(route){
		case "item":
			renderItemDetails(id);
			break;
			
		case "tag":
			renderTagDetails(id);
			break;
			
		default:
		case "index":
			renderIndexDetails(id);
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

function renderItemDetails(identifier){
	//hide all elements in the item section
	const section = document.getElementById('view-item-details');
	Array.from(section.children).forEach(child => {
	  child.classList.add('hidden');
	});
	
	const item = queryOne("SELECT nameidentifier, name, json(xml_data) AS json_data FROM items WHERE identifier = ?;", [identifier]);
	if (!item){ return }
	const data = item.json_data ? JSON.parse(item.json_data) : null;	
	const translation = queryOne("SELECT * FROM translations WHERE identifier = ?;", [nameidentifier ?? identifier]);
	
	//item name
	const name_el = document.getElementById("item-name");
	const name = translation?.name ?? item.name;
	if (name) {
		name_el.textContent = name;
		name_el.classList.remove('hidden');
	}
	
	//item identifier
	const identifier_el = document.getElementById("item-identifier");
	identifier_el.textContent = `(${identifier})`;
	identifier_el.classList.remove('hidden');
	
	console.log(data)	
}

function renderTagDetails(identifier){
}

function renderIndexDetails(identifier){
}

function updateSidebar() {
}

loadDatabase();
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);

