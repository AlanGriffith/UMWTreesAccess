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

const INCLUDES = [
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Compass",
    "esri/widgets/Expand",
    "esri/widgets/BasemapGallery"
];

require(INCLUDES, (Map, MapView, FeatureLayer, Compass, Expand, BasemapGallery) => {
    let trees_layer = new FeatureLayer({
        url: FEATURE_LAYER,
        popupTemplate: {
            title: "<h1 aria-label='Tree Number {OBJECTID}' aria-live='assertive'>Tree #{OBJECTID}</h1>",
//             content: `
// <ul>
//     <li tabindex="0"><strong>Location:</strong> {Building}</li>
//     <li tabindex="0"><strong>Common Name:</strong> {Common_Name}</li>
//     <li tabindex="0"><strong>Genus Species:</strong> {Botanical_Name}</li>
//     <li tabindex="0"><strong>Family Name:</strong> {Family}</li>
//     <li tabindex="0"><strong>Diameter of Trunk in Centimeters:</strong> {DBH}</li>
//     <li tabindex="0"><strong>Height in Meters:</strong> {height}</li>
//     <li tabindex="0"><strong>Canopy Width in Meters, North-South:</strong> {Canopy_NS}</li>
//     <li tabindex="0"><strong>Canopy Width in Meters, East-West:</strong> {Canopy_EW}</li>
// </ul>
// `
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
    view.ui.add(compass, "top-right");
    view.ui.add(bg_expand, "bottom-right");

    document.querySelector("div[role='application']").setAttribute("aria-label", "Accessible Map Viewer");

    let trees;
    let tree_pos;

    function getTrees() {
        trees_layer.queryFeatures().then(results => {
            trees = results.features;
            tree_pos = null;
        });
    }

    getTrees();

    function filterTrees() {
        view.popup.close();

        let common_name = document.getElementById("commonname_select").value;
        if (common_name === "Any Value") {
            common_name = "";
        }

        let genus_species = document.getElementById("genusspecies_select").value;
        if (genus_species === "Any Value") {
            genus_species = "";
        }

        let building = document.getElementById("building_select").value;
        if (building === "Any Value") {
            building = "";
        }

        trees_layer.definitionExpression = `
Common_Name LIKE '%${common_name}%' AND
Botanical_Name LIKE '%${genus_species}%' AND
Building LIKE '%${building}%'`;

        getTrees();
    }

    document.getElementById("commonname_select").addEventListener("change", filterTrees);
    document.getElementById("genusspecies_select").addEventListener("change", filterTrees);
    document.getElementById("building_select").addEventListener("change", filterTrees);

    view.on("key-up", event => {
        if (event.key !== "Enter") {
            return;
        }

        let go_back = event.native.shiftKey;

        if (tree_pos === null) {
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