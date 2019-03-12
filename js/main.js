/***************************************************************************************************
 * I hereby declare upon my word of honor that I have neither given nor received unauthorized help
 * on this work.
 *
 * Zachary Zwierko
 * HONR 491
 * Spring 2019
 **************************************************************************************************/

"use strict";

const FEATURE_LAYER = "https://services3.arcgis.com/eyU1lVcSnKSGItET/arcgis/rest/services/UMW_woodlots_online_manage_WFL1/FeatureServer/0";
const MAP_CENTER = [-77.477, 38.305];
const MAP_ZOOM = 18;

require(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer"], function(Map, MapView, FeatureLayer) {
    let features = new FeatureLayer({
        url: FEATURE_LAYER,
        popupTemplate: {
            title: "<h6 role='definition' aria-live='assertive'>This is a {commonname}.</h6>"
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

    let tree_pos = null;

    $("#map").keyup(function(event) {
        if (event.which !== 13) {
            return;
        }

        features.queryFeatures().then(function(results) {
            if (tree_pos === null) {
                tree_pos = 0
            }
            else if (event.shiftKey && tree_pos > 0) {
                --tree_pos;
            }
            else if (tree_pos < results.features.length) {
                ++tree_pos;
            }

            let tree = results.features[tree_pos];

            let loc = {
                latitude: tree.geometry.latitude,
                longitude: tree.geometry.longitude
            };

            view.popup.features = [tree];
            view.popup.title = `<h6 role="definition" aria-live="assertive">This is a ${tree.attributes.commonname}.</h6>`;
            view.popup.location = loc;
            view.popup.visible = true;

            view.center = loc;
        });
    });
});