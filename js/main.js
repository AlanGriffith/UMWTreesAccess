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
const MAP_CENTER = [-77.47432149070814, 38.30174598000295];
const MAP_ZOOM = 16;

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Home",
    "esri/widgets/Compass",
    "esri/widgets/Expand",
    "esri/widgets/BasemapGallery"
], (Map, MapView, FeatureLayer, Home, Compass, Expand, BasemapGallery) => {
    new Vue({
        el: "main",
        data: {
            layer: null,
            trees: [],
            tree_idx: -1,
            view: null,
        },
        computed: {
            counter: {
                get() {
                    return this.$refs.tree_counter.innerText;
                },
                set(value) {
                    this.$refs.tree_counter.innerText = value;
                }
            },
            popup() {
                return this.view.popup;
            }
        },
        methods: {
            createESRIComponents() {
                this.layer = new FeatureLayer({
                    url: FEATURE_LAYER,
                    definitionExpression: "LOWER(Comment_) <> 'removed'",
                    popupTemplate: {
                        title: this.createPopupTitle,
                        content: this.createPopupContent,
                        outFields: ["Building", "Common_Name", "Botanical_Name", "Family",  "DBH",
                                    "height", "Canopy_NS", "Canopy_EW"]
                    }
                });

                this.view = MapView({
                    map: new Map({
                        basemap: "hybrid",
                        layers: [this.layer]
                    }),
                    container: "map",
                    center: MAP_CENTER,
                    zoom: MAP_ZOOM
                });

                let home = new Home({
                    view: this.view,
                    goToOverride: this.updateExtent
                });

                let compass = new Compass({
                    view: this.view
                });

                let bg_expand = new Expand({
                    view: this.view,
                    content: new BasemapGallery({
                        view: this.view
                    }),
                    autoCollapse: true
                });

                this.view.ui.move("zoom", "top-right");
                this.view.ui.add([home, compass], "top-right");
                this.view.ui.add(bg_expand, "bottom-right");

                this.popup.collapseEnabled = false;
            },
            createFilterOptions() {
                let common_names = {};
                let genus_species = {};
                let buildings = {};

                for (let tree of this.trees) {
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
                    option.innerText = cn;
                    option.value = common_names[cn].join(",");

                    this.$refs.cn_select.appendChild(option);
                }

                for (let gs of Object.keys(genus_species).sort()) {
                    let option = document.createElement("option");
                    option.innerText = gs;
                    option.value = genus_species[gs].join(",");

                    this.$refs.gs_select.appendChild(option);
                }

                for (let b of Object.keys(buildings).sort()) {
                    let option = document.createElement("option");
                    option.innerText = b;
                    option.value = buildings[b].join(",");

                    this.$refs.b_select.appendChild(option);
                }

                this.$refs.cn_select.disabled = false;
                this.$refs.gs_select.disabled = false;
                this.$refs.b_select.disabled = false;
            },
            createPopupContent() {
                let geometry = this.popup.selectedFeature.geometry;
                let lat = geometry.latitude.toFixed(5);
                let lon = geometry.longitude.toFixed(5);

                return `\
<table class="esri-widget__table">
    <tbody>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Location</th>
            <td class="esri-feature__field-data">{Building}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Common Name</th>
            <td class="esri-feature__field-data">{Common_Name}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Genus Species</th>
            <td class="esri-feature__field-data">{Botanical_Name}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Family Name</th>
            <td class="esri-feature__field-data">{Family}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Diameter of Trunk in Centimeters</th>
            <td class="esri-feature__field-data">{DBH}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Height in Meters</th>
            <td class="esri-feature__field-data">{height}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Canopy Width in Meters, North-South</th>
            <td class="esri-feature__field-data">{Canopy_NS}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Canopy Width in Meters, East-West</th>
            <td class="esri-feature__field-data">{Canopy_EW}</td>
        </tr>
        <tr tabindex="0">
            <th class="esri-feature__field-header">Coordinates</th>
            <td class="esri-feature__field-data">${lat}° N ${lon}° W</td>
        </tr>
    </tbody>
</table>`;
            },
            createPopupTitle() {
                let obj_id = this.popup.selectedFeature.attributes["OBJECTID"];

                if (this.tree_idx === -1 || this.trees[this.tree_idx].attributes["OBJECTID"] !== obj_id) {
                    this.tree_idx = this.trees.findIndex(t => t.attributes["OBJECTID"] === obj_id);
                }

                return `<h1 tabindex="-1" aria-live="assertive">Tree ${this.tree_idx + 1} of ${this.trees.length}</h1>`;
            },
            filterTrees() {
                this.popup.close();
                this.counter = "...";

                let filters = ["LOWER(Comment_) <> 'removed'"];

                let cn = this.$refs.cn_select.value;
                if (cn !== "Any Value") {
                    filters.push(`OBJECTID IN (${cn})`);
                }

                let gs = this.$refs.gs_select.value;
                if (gs !== "Any Value") {
                    filters.push(`OBJECTID IN (${gs})`);
                }

                let b = this.$refs.b_select.value;
                if (b !== "Any Value") {
                    filters.push(`OBJECTID IN (${b})`);
                }

                this.layer.definitionExpression = filters.join(" AND ");

                this.layer.queryFeatures().then(results => {
                    this.trees = results.features;
                    this.tree_idx = -1;
                    this.counter = `${this.trees.length}`;

                    this.updateExtent();
                });
            },
            fixTabOrder() {
                let to_remove = [
                    ".esri-attribution__sources",
                    ".esri-attribution__link",
                    ".esri-popup__button"
                ].join(",");

                this.$nextTick(() => {
                    document.querySelectorAll(to_remove).forEach(el => {
                        el.tabIndex = -1;
                    });
                });
            },
            nextTree(go_back) {
                if ((go_back && this.tree_idx === 0) || (!go_back && this.tree_idx === this.trees.length-1)) {
                    return;
                }

                if (this.tree_idx === -1) {
                    this.tree_idx = 0;
                }
                else if (go_back) {
                    --this.tree_idx;
                }
                else {
                    ++this.tree_idx;
                }

                let tree = this.trees[this.tree_idx];

                this.popup.open({
                    features: [tree],
                    updateLocationEnabled: true
                });
                this.fixTabOrder();
                this.view.focus();
            },
            updateExtent() {
                return this.view.goTo(this.trees);
            }
        },
        mounted() {
            this.createESRIComponents();

            this.layer.queryFeatures().then(results => {
                this.trees = results.features;
                this.counter = `${this.trees.length}`;

                this.updateExtent();
                this.createFilterOptions();
            });

            document.getElementById("map").addEventListener("keyup", event => {
                if (event.key.toLowerCase() === "n") {
                    this.nextTree(false);
                }
                else if (event.key.toLowerCase() === "b") {
                    this.nextTree(true);
                }
            });

            this.view.surface.addEventListener("wheel", event => {
                event.stopImmediatePropagation();
            }, true);

            this.popup.watch("selectedFeature", graphic => {
                if (graphic) {
                    this.popup.title = this.createPopupTitle();
                    this.fixTabOrder();
                    this.view.focus();
                }
            });
        }
    });
});