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
const MAP_CONFIG = {
    basemap: "hybrid",
    center: [-77.4770, 38.3055],
    zoom: 19
};

function showPopup(event) {
    let tree = $(event.target);
    let popup = $("#popup");
    let popup_text = $("#popup h6");

    let tree_pos = tree.offset();
    popup.css({
        left:  tree_pos.left - popup.width()/4,
        top: tree_pos.top - popup.height()
    });

    let tree_color = tree.attr("fill");
    if (tree_color === "rgb(255, 255, 0)") {
        popup_text.text("A mimosa tree.");
    }
    else if (tree_color === "rgb(85, 255, 0)") {
        popup_text.text("A tree of heaven.");
    }
    else {
        popup_text.text("A tree.");
    }

    popup.show();
}

function hidePopup() {
    let popup = $("#popup");

    popup.css({
        display: "none"
    });
}

require(["esri/map", "esri/layers/FeatureLayer", "dojo/domReady!"], function(Map, FeatureLayer) {
    let map = new Map("map", MAP_CONFIG);
    map.addLayer(new FeatureLayer(FEATURE_LAYER));

    map.on("update-end", function() {
        hidePopup();

        $("circle").each(function() {
            $(this).attr("tabindex", "0");

            $(this).on("focus click", showPopup);
        });
    });
});