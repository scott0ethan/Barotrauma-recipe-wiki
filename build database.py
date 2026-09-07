import sqlite3
import json
import os
import xml.etree.ElementTree as ET




#search xml tree should go off of the filelist instead of every xml,
#vanilla peteggs.xml is an example, there are 2 peteggs.xml but only 1 is in the contentpackage







def get_opening_tag(elem: ET.Element):
    full_xml = ET.tostring(elem, encoding="unicode")
    
    tag_end = full_xml.find(">") + 1
    return full_xml[:tag_end]

def get_attribute_comma_list(element, attributes):
    _list = [element.get(a) for a in attributes]
    _list = [a.split(",") for a in _list if a and a.strip()]
    _list = [item.strip() for sublist in _list for item in sublist]
    return _list

def xml_to_dict(root):
    _json = {
        "tag": root.tag,
        "text": root.text.strip() if root.text and root.text.strip() else None,
        "attributes": {str(k).lower(): str(v) for k, v in root.attrib.items()},
        "children": [xml_to_dict(c) for c in root]
        }
    return _json

def process_xml_tree(root_directory, callback):
    for dirpath, _, filenames in os.walk(root_directory):
        for filename in filenames:
            if filename.lower().endswith('.xml'):
                file_path = os.path.join(dirpath, filename)
                try:
                    tree = ET.parse(file_path)
                    root = tree.getroot()
                    #print(f"reading file {file_path}")
                    callback(root, file_path)
                except (ET.ParseError, PermissionError) as e:
                    print(f"Skipping {file_path}: {e}")

def process_xml_root(root, filepath, conn, cursor, filelist):
    if root.tag.lower() == "infotexts" and (root.get("language") or root.get("Language") or "").lower() == "english":
        process_translation(root, filepath, conn, cursor, filelist)
    elif root.tag.lower() == "talents":
        process_talents(root, filepath, conn, cursor, filelist)
    else:
        process_items(root, filepath, conn, cursor, filelist)

def process_translation(root, filepath, conn, cursor, filelist):
    elements = root.iter()
    next(elements, None)
    for element in elements:
        if element.tag.lower().startswith("entityname") or element.tag.lower().startswith("talentname"):
            cursor.execute("""
                INSERT INTO translations (identifier, name)
                VALUES (?, ?)
                ON CONFLICT(identifier) DO UPDATE SET
                    name = EXCLUDED.name;
            """, (element.tag.split(".")[1], element.text))
            
        if element.tag.lower().startswith("entitydescription") or element.tag.lower().startswith("talentdescription"):
            cursor.execute("""
                INSERT INTO translations (identifier, description)
                VALUES (?, ?)
                ON CONFLICT(identifier) DO UPDATE SET
                    description = EXCLUDED.description;
            """, (element.tag.split(".")[1], element.text))
    conn.commit()

def process_talents(root, filepath, conn, cursor, filelist):    
    elements = root.iter()
    next(elements, None)
    talentidentifier = None
    for element in elements:        
        if element.tag.lower() == "talent":
            talentidentifier = element.get("identifier") or element.get("Identifier")
        if element.tag.lower() == "addedrecipe":
            itemidentifier = get_attribute_comma_list(element, ["identifier", "Identifier", "itemidentifier", "ItemIdentifier", "Itemidentifier"])
            for i in itemidentifier:
                cursor.execute(
                    "INSERT INTO unlock_talents (unlocker, unlockee) VALUES (?, ?);",
                    (talentidentifier, i)
                )
    conn.commit()

def process_items(root, filepath, conn, cursor, filelist):
    items = []
    if root.tag in {"Override", "Items"}:
        items.extend(root.findall("./Item"))
    items.extend(root.findall("./Items/Item"))
    for item in items:
        process_item(item, filepath, conn, cursor, filelist)

def process_item(item, filepath, conn, cursor, filelist):
    identifier = item.get("identifier") or item.get("Identifier")
    if identifier is None:
        #print(f'item {get_opening_tag(item)} has no identifier')
        return
    if identifier.strip() == "":
        #print(f'item {get_opening_tag(item)} has whitespace identifier')
        return
    

    # is item already in database?
    cursor.execute("SELECT identifier, filepath FROM items WHERE identifier = ?", [identifier])
    existing = cursor.fetchone()
    if existing:
        old_id, old_filepath = existing
        #print(f'encountered an already existing item identifier: {identifier} in {filepath}')        
        #print(f'\tpreviouslt at {old_filepath}')
        #must be a mod override, remove the existing entry and all information given by the old item's xml.
        #keep information from other items that reference this item since its identifier has not changed.
        cursor.execute("DELETE FROM items WHERE identifier = ?", [identifier])
        cursor.execute("DELETE FROM spawners WHERE spawner = ?", [identifier])
        cursor.execute("DELETE FROM variants WHERE child = ?", [identifier])
        cursor.execute("DELETE FROM suitable_fabricators WHERE item = ?", [identifier])
        cursor.execute("DELETE FROM item_ingredients WHERE output = ?", [identifier])
        cursor.execute("DELETE FROM tags WHERE item = ?", [identifier])
        cursor.execute("DELETE FROM deconstructables WHERE input = ?", [identifier])
        cursor.execute("DELETE FROM unlock_items WHERE unlocker = ?", [identifier])
        conn.commit()

    nameidentifier = get_attribute_comma_list(item, ["nameidentifier", "NameIdentifier", "NameIdentifier"])
    name = get_attribute_comma_list(item, ["name", "Name"])
    json_string = json.dumps(xml_to_dict(item))
    cursor.execute(
        "INSERT INTO items (identifier, nameidentifier, name, json_data, filelist, filepath) VALUES (?, ?, ?, ?, ?, ?);",
        (identifier,
        nameidentifier[0] if nameidentifier else None,
        name[0] if name else None,
        json_string,
        filelist,
        filepath)
    )
    
    #does the item have tags?
    tags = get_attribute_comma_list(item, ["tags", "Tags", "tag", "Tag"])
    for tag in tags:
        cursor.execute(
            "INSERT INTO tags (item, tag) VALUES (?, ?);",
            (identifier, tag)
        )
        
    #is the item a variant
    variantof = item.get("variantof") or item.get("VariantOf")
    if variantof is not None:
        cursor.execute(
            "INSERT INTO variants (base, child) VALUES (?, ?);",
            (variantof, identifier)
        )

    #search all children nested
    elements = item.iter()
    next(elements, None)
    for element in elements:
        
        #does this item ever spawn another item?
        if element.tag.lower() == "spawnitem":
            spawned = get_attribute_comma_list(element, ["Identifier", "identifier", "Identifiers", "identifiers"])
            for s in spawned:
                cursor.execute(
                    "INSERT INTO spawners (spawner, spawnee) VALUES (?, ?);",
                    (identifier, s)
                )

        #does this item grant recipes?
        if element.tag.lower() == "statuseffect":
            unlockrecipes = get_attribute_comma_list(element, ["unlockrecipe", "UnlockRecipe", "Unlockrecipe"])
            for unlockrecipe in unlockrecipes:
                cursor.execute(
                    "INSERT INTO unlock_items (unlocker, unlockee) VALUES (?, ?);",
                    (identifier, unlockrecipe)
                )

        #does this item have a recipe?
        if element.tag.lower() == "fabricate":
            suitablefabricators = get_attribute_comma_list(element, ["suitablefabricators", "SuitableFabricators", "Suitablefabricators"])
            for suitablefabricator in suitablefabricators:
                cursor.execute(
                    "INSERT INTO suitable_fabricators (item, fabricator) VALUES (?, ?);",
                    (identifier, suitablefabricator)
                )
            for child in element:
                if child.tag.lower() == "requireditem":
                    requiredidentifiers = get_attribute_comma_list(child, ["Identifier", "identifier", "Identifiers", "identifiers"])
                    for ri in requiredidentifiers:
                        cursor.execute(
                            "INSERT INTO item_ingredients (output, ingredient) VALUES (?, ?);",
                            (identifier, ri)
                        )
                    requiredtags = get_attribute_comma_list(child, ["tag", "Tag", "tags", "Tags"])
                    for rt in requiredtags:
                        cursor.execute(
                            "INSERT INTO tag_ingredients (output, ingredient) VALUES (?, ?);",
                            (identifier, rt)
                        )
                        
        #does this item deconstruct into something?
        if element.tag.lower() == "deconstruct":
            for child in element:
                if child.tag.lower() == "item":
                    outputitems = get_attribute_comma_list(child, ["Identifier", "identifier", "Identifiers", "identifiers"])
                    for oi in outputitems:
                        cursor.execute(
                            "INSERT INTO deconstructables (output, input) VALUES (?, ?);",
                            (oi, identifier)
                        )
    #end search all children nested
    conn.commit()
    #print(f"commit item {identifier}")
#end process item


db_name = "barotrauma.db"
if os.path.exists(db_name):
    os.remove(db_name)

# Connects to a local file. If "barotrauma.db" doesn't exist, SQLite creates it automatically.
conn = sqlite3.connect(db_name)
cursor = conn.cursor()

# Foreign Key support in SQLite
cursor.execute("PRAGMA foreign_keys = OFF;")

# Create items table
cursor.execute("""
CREATE TABLE IF NOT EXISTS items (
    identifier TEXT PRIMARY KEY,
    nameidentifier TEXT,
    name TEXT,
    json_data TEXT,
    filelist TEXT,
    filepath TEXT
);
""")

# Create tags table
cursor.execute("""
CREATE TABLE IF NOT EXISTS tags (
    item TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (item, tag) ON CONFLICT IGNORE
);
""")

# Create suitalbe fabs table
cursor.execute("""
CREATE TABLE IF NOT EXISTS suitable_fabricators (
    item TEXT NOT NULL,
    fabricator TEXT NOT NULL,
    PRIMARY KEY (item, fabricator) ON CONFLICT IGNORE
);
""")

# Create variantof table
cursor.execute("""
CREATE TABLE IF NOT EXISTS variants (
    base TEXT NOT NULL,
    child TEXT NOT NULL,
    PRIMARY KEY (base, child) ON CONFLICT IGNORE
);
""")


# Create recipes table
cursor.execute("""
CREATE TABLE IF NOT EXISTS item_ingredients (
    output TEXT NOT NULL,
    ingredient TEXT NOT NULL,
    PRIMARY KEY (output, ingredient) ON CONFLICT IGNORE
);
""")

# Create recipes table
cursor.execute("""
CREATE TABLE IF NOT EXISTS tag_ingredients (
    output TEXT NOT NULL,
    ingredient TEXT NOT NULL,
    PRIMARY KEY (output, ingredient) ON CONFLICT IGNORE
);
""")

# Create deconstruct table
cursor.execute("""
CREATE TABLE IF NOT EXISTS deconstructables (
    output TEXT NOT NULL,
    input TEXT NOT NULL,
    PRIMARY KEY (output, input) ON CONFLICT IGNORE
);
""")

# Create spawner table
cursor.execute("""
CREATE TABLE IF NOT EXISTS spawners (
    spawner TEXT NOT NULL,
    spawnee TEXT NOT NULL,
    PRIMARY KEY (spawner, spawnee) ON CONFLICT IGNORE
);
""")

# Create recipe unlock items table
cursor.execute("""
CREATE TABLE IF NOT EXISTS unlock_items (
    unlocker TEXT NOT NULL,
    unlockee TEXT NOT NULL,
    PRIMARY KEY (unlocker, unlockee) ON CONFLICT IGNORE
);
""")

# Create recipe unlock talets table
cursor.execute("""
CREATE TABLE IF NOT EXISTS unlock_talents (
    unlocker TEXT NOT NULL,
    unlockee TEXT NOT NULL,
    PRIMARY KEY (unlocker, unlockee) ON CONFLICT IGNORE
);
""")

# Create translatins table
cursor.execute("""
CREATE TABLE IF NOT EXISTS translations (
    identifier TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
    name TEXT,
    description TEXT
);
""")


conn.commit()
print("database file created")

hungry_europans = r"C:\Program Files (x86)\Steam\steamapps\workshop\content\602960\2954998725"
neurotrauma = r"C:\Program Files (x86)\Steam\steamapps\workshop\content\602960\3190189044"
vanilla = r"C:\Program Files (x86)\Steam\steamapps\common\Barotrauma\Content"

process_xml_tree(
    vanilla,
    lambda _root, _filepath: process_xml_root(_root, _filepath, conn, cursor, vanilla+r"/ContentPackages/Vanilla.xml")
)
process_xml_tree(
    hungry_europans,
    lambda _root, _filepath: process_xml_root(_root, _filepath, conn, cursor, hungry_europans+r"/filelist.xml")
)

conn.close()
print("DONE")

