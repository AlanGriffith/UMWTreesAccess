/***************************************************************************************************
 * I hereby declare upon my word of honor that I have neither given nor received unauthorized help
 * on this work.
 *
 * Zachary Zwierko
 * University of Mary Washington
 * HONR 491
 * Spring 2019
 **************************************************************************************************/

"use strict";

// The location of the ESRI trees feature layer hosted on ArcGIS Online.
const FEATURE_LAYER = "https://services3.arcgis.com/eyU1lVcSnKSGItET/arcgis/rest/services/Heritage_Online_Manage_noedit_WFL1/FeatureServer/0";

// The lat/lon coordinates of UMW on which to center the map.
const MAP_CENTER = [-77.4743346820189, 38.3018069459446];

// The initial zoom level of the map.
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
            layer: null,  // Handle to the ESRI trees feature layer.
            trees: [],    // List of the ESRI feature objects for each tree.
            tree_idx: -1, // The current index in the trees list (used for the keyboard navigation).
            view: null,   // Handle to the ESRI MapView which displays the trees.
        },
        computed: {
            /**
             * Getter/setter for the value which is shown on the tree counter.
             */
            counter: {
                get() {
                    return this.$refs.tree_counter.innerText;
                },
                set(value) {
                    this.$refs.tree_counter.innerText = value;
                }
            },
            /**
             * Simplified handle for the ESRI popup object.
             */
            popup() {
                return this.view.popup;
            }
        },
        methods: {
            /**
             * Create all of the ESRI components/widgets for the map.
             */
            createESRIComponents() {
                // Set up the trees feature layer.
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

                // Set up the map view which displays the feature layer.
                this.view = MapView({
                    map: new Map({
                        basemap: "hybrid",
                        layers: [this.layer]
                    }),
                    container: "map",
                    center: MAP_CENTER,
                    zoom: MAP_ZOOM
                });

                // Set up the Home widget to re-center the map.
                let home = new Home({
                    view: this.view,
                    goToOverride: this.updateExtent
                });

                // Set up the Compass widget to show current orientation.
                let compass = new Compass({
                    view: this.view
                });

                // Set up the basemap gallery expander to change the basemap.
                let bg_expand = new Expand({
                    view: this.view,
                    content: new BasemapGallery({
                        view: this.view
                    }),
                    autoCollapse: true
                });

                // Position the map widgets in the correct locations.
                this.view.ui.move("zoom", "top-right");
                this.view.ui.add([home, compass], "top-right");
                this.view.ui.add(bg_expand, "bottom-right");

                // Remove the collapse button from the popup headers so that it doesn't interfere
                // with the keyboard navigation.
                this.popup.collapseEnabled = false;
            },
            /**
             * Populate the filter boxes with values from the trees database.
             */
            createFilterOptions() {
                // These dictionaries map each filter box value to a list of tree OBJECTIDs for the
                // trees which satisfy the filter. For example, "red maple" will be mapped to a list
                // of OBJECTIDs for all the red maple trees.
                let common_names = {};
                let genus_species = {};
                let buildings = {};

                // Go through each tree feature and add its OBJECTID to the correct list(s) within
                // the dictionaries above.
                for (let tree of this.trees) {
                    let obj_id = tree.attributes["OBJECTID"];

                    // Categorize the trees by Common Name.
                    let cn = tree.attributes["Common_Name"];
                    if (!common_names.hasOwnProperty(cn)) {
                        common_names[cn] = [];
                    }
                    common_names[cn].push(obj_id);

                    // Categorize the trees by Botanical Name (Genus Species).
                    let gs = tree.attributes["Botanical_Name"];
                    if (!genus_species.hasOwnProperty(gs)) {
                        genus_species[gs] = [];
                    }
                    genus_species[gs].push(obj_id);

                    // Categorize the trees by Building.
                    let b = tree.attributes["Building"];
                    if (!buildings.hasOwnProperty(b)) {
                        buildings[b] = [];
                    }
                    buildings[b].push(obj_id);
                }

                // Sort the Common Name filter values alphabetically and then add them to their
                // filter box.
                for (let cn of Object.keys(common_names).sort()) {
                    let option = document.createElement("option");
                    option.innerText = cn;
                    option.value = common_names[cn].join(",");

                    this.$refs.cn_select.appendChild(option);
                }

                // Sort the Botanical Name filter values alphabetically and then add them to their
                // filter box.
                for (let gs of Object.keys(genus_species).sort()) {
                    let option = document.createElement("option");
                    option.innerText = gs;
                    option.value = genus_species[gs].join(",");

                    this.$refs.gs_select.appendChild(option);
                }

                // Sort the Building filter values alphabetically and then add them to their
                // filter box.
                for (let b of Object.keys(buildings).sort()) {
                    let option = document.createElement("option");
                    option.innerText = b;
                    option.value = buildings[b].join(",");

                    this.$refs.b_select.appendChild(option);
                }

                // Enable all of the filter boxes now that they are populated.
                this.$refs.cn_select.disabled = false;
                this.$refs.gs_select.disabled = false;
                this.$refs.b_select.disabled = false;
            },
            /**
             * Create the content for the current popup.
             */
            createPopupContent() {
                // Compute the lat/lon coordinates of this tree.
                let geometry = this.popup.selectedFeature.geometry;
                let lat = geometry.latitude.toFixed(5);
                let lon = geometry.longitude.toFixed(5);

                // Return the data table of all the attributes of interest for this tree.
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
            /**
             * Create the title for the current popup.
             */
            createPopupTitle() {
                // Set the 'tree_idx' data field to the correct value if necessary (this will be the
                // index of the currently selected tree).
                let obj_id = this.popup.selectedFeature.attributes["OBJECTID"];
                if (this.tree_idx === -1 || this.trees[this.tree_idx].attributes["OBJECTID"] !== obj_id) {
                    this.tree_idx = this.trees.findIndex(t => t.attributes["OBJECTID"] === obj_id);
                }

                // Return the popup title which shows the index of this tree in the trees list.
                return `<h1 tabindex="-1" role="alert" aria-live="assertive">Tree ${this.tree_idx + 1} of ${this.trees.length}</h1>`;
            },
            /**
             * Filter the trees by the current values set in the filter boxes.
             */
            filterTrees() {
                // Close any open popups and set the tree counter to a loading state.
                this.popup.close();
                this.counter = "...";

                // A list of the expressions by which the trees will be filtered.
                // We always filter out removed trees, designated by a "removed" comment.
                let filters = ["LOWER(Comment_) <> 'removed'"];

                // If there is a specific Common Name set, add it as a filter.
                let cn = this.$refs.cn_select.value;
                if (cn !== "Any Value") {
                    filters.push(`OBJECTID IN (${cn})`);
                }

                // If there is a specific Botanical Name set, add it as a filter.
                let gs = this.$refs.gs_select.value;
                if (gs !== "Any Value") {
                    filters.push(`OBJECTID IN (${gs})`);
                }

                // If there is a specific Building set, add it as a filter.
                let b = this.$refs.b_select.value;
                if (b !== "Any Value") {
                    filters.push(`OBJECTID IN (${b})`);
                }

                // Update the definition expression for the trees layer so that it filters by all of
                // the expressions created above.
                this.layer.definitionExpression = filters.join(" AND ");

                // Rebuild the trees list and ready the map for the new data.
                this.layer.queryFeatures().then(results => {
                    this.trees = results.features;
                    this.tree_idx = -1;
                    this.counter = `${this.trees.length}`;

                    this.updateExtent();
                });
            },
            /**
             * Disable the 'tabindex' attribute from specific ESRI elements so that the keyboard
             * navigation works as expected.
             */
            fixTabOrder() {
                // These elements should not be tab-focusable.
                let to_remove = [
                    ".esri-attribution__sources",
                    ".esri-attribution__link",
                    ".esri-popup__button"
                ].join(",");

                // After the map reloads, remove the elements listed above from the tab order.
                this.$nextTick(() => {
                    document.querySelectorAll(to_remove).forEach(el => {
                        el.tabIndex = -1;
                    });
                });
            },
            /**
             * Navigate to the next tree and display a popup for it.
             *
             * @param go_back Flag for if we are moving forwards or backwards through the trees list.
             */
            nextTree(go_back) {
                // If we are at either end of the trees list, do not advance past it.
                if ((go_back && this.tree_idx === 0) || (!go_back && this.tree_idx === this.trees.length-1)) {
                    return;
                }

                // If this is the first popup shown, just start at the first tree.
                if (this.tree_idx === -1) {
                    this.tree_idx = 0;
                }
                // Otherwise, go back one if the go_back flag is set.
                else if (go_back) {
                    --this.tree_idx;
                }
                // Otherwise, advance to the next tree.
                else {
                    ++this.tree_idx;
                }

                // Grab the new tree.
                let tree = this.trees[this.tree_idx];

                // Open a popup for this tree.
                this.popup.open({
                    features: [tree],
                    updateLocationEnabled: true
                });

                // These need to be called here so that the keyboard navigation works as expected.
                this.fixTabOrder();
                this.view.focus();
            },
            /**
             * Update the extent of the map to show all of the currently visible tree features.
             */
            updateExtent() {
                return this.view.goTo({
                    target: this.trees,
                    zoom: MAP_ZOOM
                });
            }
        },
        mounted() {
            // Start the keyboard navigation on the navbar.
            // If screen reading is enabled, this also begins reading the usage instructions.
            document.getElementById("navbar").focus();

            // Must be called first before any ArcGIS API stuff is used.
            this.createESRIComponents();

            // Initially populate the trees list and then ready the map for use.
            this.layer.queryFeatures().then(results => {
                this.trees = results.features;
                this.counter = `${this.trees.length}`;

                this.updateExtent();
                this.createFilterOptions();
            });

            // Bind the N/B keys for the keyboard navigation so that they cycle through the trees (N
            // goes to the next tree and B goes back).
            document.getElementById("map").addEventListener("keyup", event => {
                if (event.key.toLowerCase() === "n") {
                    this.nextTree(false);
                }
                else if (event.key.toLowerCase() === "b") {
                    this.nextTree(true);
                }
            });

            // Disable scrollwheel zoom on the map so that it does not capture the mouse when
            // embedded in an <iframe>.
            this.view.surface.addEventListener("wheel", event => {
                event.stopImmediatePropagation();
            }, true);

            // When a tree is selected as part of a multi-tree popup (e.g. "1 of 3"), update the
            // popup title and map accordingly.
            this.popup.watch("selectedFeature", graphic => {
                if (graphic) {
                    this.popup.title = this.createPopupTitle();

                    // These need to be called here so that the keyboard navigation works as expected.
                    this.fixTabOrder();
                    this.view.focus();
                }
            });
        }
    });
});