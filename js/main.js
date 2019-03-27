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
    "esri/layers/FeatureLayer"
];

require(INCLUDES, (Map, MapView, FeatureLayer) => {
    let features = new FeatureLayer({
        url: FEATURE_LAYER,
        popupTemplate: {
            title: "<h6 role='definition' aria-live='assertive'>This is a {Common_Name}.</h6>"
        }
    });

    let map = new Map({
        basemap: "hybrid",
        layers: [features]
    });

    let view = MapView({
        map: map,
        container: "map",
        center: MAP_CENTER,
        zoom: MAP_ZOOM
    });

    document.querySelector("div[role='application']").setAttribute("aria-label", "Map Viewer");

    let tree_pos = null;

    let trees;
    features.queryFeatures().then(results => {
        trees = results.features;
    });

    view.on("key-up", event => {
        if (event.key !== "Enter") {
            return;
        }

        let go_back = event.native.shiftKey;

        if (tree_pos === null) {
            tree_pos = 0
        }
        else if ((go_back && tree_pos === 0) || (!go_back && tree_pos === trees.length)) {
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
            title: `<h6 role="definition" aria-live="assertive">This is a ${tree.attributes.Common_Name}.</h6>`,
            updateLocationEnabled: true
        });
    });

    view.surface.addEventListener("wheel", function(event) {
        event.stopImmediatePropagation();
    }, true);
});