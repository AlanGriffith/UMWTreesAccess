/***************************************************************************************************
 * I hereby declare upon my word of honor that I have neither given nor received unauthorized help
 * on this work.
 *
 * Zachary Zwierko
 * HONR 491
 * Spring 2019
 **************************************************************************************************/

"use strict";

const FEATURE_LAYER = "https://services3.arcgis.com/eyU1lVcSnKSGItET/arcgis/rest/services/Heritage_Online_Manage_noedit_WFL1/FeatureServer/0";
const MAP_CENTER = [-77.4770, 38.3055];
const MAP_ZOOM = 18;

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Home",
    "esri/widgets/Compass",
    "esri/widgets/Expand",
    "esri/widgets/BasemapGallery"
], (Map, MapView, FeatureLayer, Home, Compass, Expand, BasemapGallery) => {

let trees_layer = new FeatureLayer({
    url: FEATURE_LAYER,
    popupTemplate: {
        title: "<h1 aria-label='Tree Number {OBJECTID}' aria-live='assertive'>Tree #{OBJECTID}</h1>",
        content: [{
            type: "fields",
            fieldInfos: [
                {
                    fieldName: "Building",
                    label: "Location"
                },
                {
                    fieldName: "Common_Name",
                    label: "Common Name"
                },
                {
                    fieldName: "Botanical_Name",
                    label: "Genus Species"
                },
                {
                    fieldName: "Family",
                    label: "Family Name",
                    format: {
                        places: 2
                    }
                },
                {
                    fieldName: "DBH",
                    label: "Diameter of Trunk in Centimeters",
                    format: {
                        places: 2
                    }
                },
                {
                    fieldName: "height",
                    label: "Height in Meters",
                    format: {
                        places: 2
                    }
                },
                {
                    fieldName: "Canopy_NS",
                    label: "Canopy Width in Meters, North-South",
                    format: {
                        places: 2
                    }
                },
                {
                    fieldName: "Canopy_EW",
                    label: "Canopy Width in Meters, East-West",
                    format: {
                        places: 2
                    }
                }
            ]
        }]
    }
});

let cn_select = document.getElementById("cn_select");
let gs_select = document.getElementById("gs_select");
let b_select = document.getElementById("b_select");
let tree_counter = document.getElementById("tree_counter");

let trees = [];
let tree_pos = -1;

trees_layer.queryFeatures().then(results => {
    trees = results.features;

    let common_names = {};
    let genus_species = {};
    let buildings = {};

    for (let tree of trees) {
        let obj_id = tree.attributes["OBJECTID"];

        let cn = tree.attributes["Common_Name"];
        if (!common_names.hasOwnProperty(cn)) {
            common_names[cn] = [];
        }
        common_names[cn].push(obj_id);

        let gs = tree.attributes["Botanical_Name"];
        if (!genus_species.hasOwnProperty(gs)) {
            genus_species[gs] = [];
        }
        genus_species[gs].push(obj_id);

        let b = tree.attributes["Building"];
        if (!buildings.hasOwnProperty(b)) {
            buildings[b] = [];
        }
        buildings[b].push(obj_id);
    }

    for (let cn of Object.keys(common_names).sort()) {
        let option = document.createElement("option");
        option.value = common_names[cn].join(",");
        option.innerText = cn;

        cn_select.appendChild(option);
    }

    for (let gs of Object.keys(genus_species).sort()) {
        let option = document.createElement("option");
        option.value = genus_species[gs].join(",");
        option.innerText = gs;

        gs_select.appendChild(option);
    }

    for (let b of Object.keys(buildings).sort()) {
        let option = document.createElement("option");
        option.value = buildings[b].join(",");
        option.innerText = b;

        b_select.appendChild(option);
    }

    cn_select.disabled = false;
    gs_select.disabled = false;
    b_select.disabled = false;

    tree_counter.innerText = `${trees.length}`;
});

function filterTrees() {
    view.popup.close();

    let filters = [];

    let cn = cn_select.value;
    if (cn !== "Any Value") {
        filters.push(`OBJECTID IN (${cn})`);
    }

    let gs = gs_select.value;
    if (gs !== "Any Value") {
        filters.push(`OBJECTID IN (${gs})`);
    }

    let b = b_select.value;
    if (b !== "Any Value") {
        filters.push(`OBJECTID IN (${b})`);
    }

    trees_layer.definitionExpression = filters.join(" AND ");

    trees_layer.queryFeatures().then(results => {
        trees = results.features;
        tree_pos = -1;

        tree_counter.innerText = `${trees.length}`;
    });
}
cn_select.addEventListener("change", filterTrees);
gs_select.addEventListener("change", filterTrees);
b_select.addEventListener("change", filterTrees);

let map = new Map({
    basemap: "hybrid",
    layers: [trees_layer]
});

let view = MapView({
    map: map,
    container: "map",
    center: MAP_CENTER,
    zoom: MAP_ZOOM
});

let home = new Home({
    view: view
});

let compass = new Compass({
    view: view
});

let basemap_gallery = new BasemapGallery({
    view: view
});

let bg_expand = new Expand({
    view: view,
    content: basemap_gallery
});
basemap_gallery.watch("activeBasemap", event => {
    bg_expand.collapse();
});

view.ui.move("zoom", "top-right");
view.ui.add([home, compass], "top-right");
view.ui.add(bg_expand, "bottom-right");

document.querySelector("div[role='application']")["aria-label"] = "Accessible Map Viewer";

view.on("key-up", event => {
    if (event.key !== "Enter") {
        return;
    }

    let go_back = event.native.shiftKey;

    if (tree_pos === -1) {
        tree_pos = 0
    }
    else if ((go_back && tree_pos === 0) || (!go_back && tree_pos === trees.length-1)) {
        return;
    }
    else if (go_back) {
        --tree_pos;
    }
    else {
        ++tree_pos;
    }

    let tree = trees[tree_pos];

    view.popup.open({
        features: [tree],
        updateLocationEnabled: true
    });
});

view.surface.addEventListener("wheel", event => {
    event.stopImmediatePropagation();
}, true);

});