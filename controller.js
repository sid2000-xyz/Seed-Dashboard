angular.module("myApp", []).controller("ctrl1", function ($scope, $http) {

  // Initialize an array to keep track of selected states
  $scope.selectedStates = [];
  $scope.selectedFilters = [];

  // Function to switch states and update the map for seed growers
  $scope.switchStateGrowers = function (state) {
    // Check if the state is already selected
    let index = $scope.selectedStates.indexOf(state);

    if (index === -1) {
      // State is not selected, add it to the list and update the map
      $scope.selectedStates.push(state);
    } else {
      // State is already selected, remove it from the list and update the map
      $scope.selectedStates.splice(index, 1);
    }

    // Fetch data for all selected states
    let promises = $scope.selectedStates.map(function (selectedState) {
      return $http.get('http://127.0.0.1:8000/exampleQuery?code=' + selectedState);
    });

    // Wait for all requests to complete
    Promise.all(promises).then(function (responses) {
      // Concatenate data from all responses
      var allStateData = [];
      responses.forEach(function (response) {
        allStateData = allStateData.concat(response.data);
      });
      // Update the map with data for all selected states
      $scope.$broadcast('updateMapForStatesGrowers', allStateData);
    });
  };

  // Function to fetch locations according to selected filters
  $scope.getLocationFilters = function (filter) {

    let index = $scope.selectedFilters.indexOf(filter);

    if (index === -1) {
      // filter is not selected, add it to the list and update the map
      $scope.selectedFilters.push(filter);
    } else {
      // filter is already selected, remove it from the list and update the map
      $scope.selectedFilters.splice(index, 1);
    }

    // Fetch data for all selected filter
    var filterPromise = $scope.selectedFilters.map(function (selectedFilter) {
      return $http.get('http://127.0.0.1:8000/getFilterData?filter='+selectedFilter);
    });

    
    // Wait for all Seed Hub, NSC, STL, SPA, and SPP requests to complete wrt to chosen filters
    Promise.all(filterPromise).then(function (responses) {
      // Concatenate data from all responses
      console.log(responses)
      var allFiterData = [];
      responses.forEach(function (response) {
        allFiterData = allFiterData.concat(response.data);
      });
      // Update the map with data for all selected states
      $scope.$broadcast('updateMapForStatesGrowers', allFiterData);
    })
  }
    }).directive('myMap', function () {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          require([
            "esri/Map",
            "esri/views/MapView",
            "esri/layers/GraphicsLayer",
            "esri/Graphic",
            "esri/geometry/Point",
            "esri/symbols/SimpleMarkerSymbol",
            "esri/widgets/Popup"
          ], function (
            Map,
            MapView,
            GraphicsLayer,
            Graphic,
            Point,
            SimpleMarkerSymbol,
            Popup
          ) {
            var map = new Map({
              basemap: "streets"
            });

            var mapView = new MapView({
              container: element[0],
              map: map,
              center: [78.9629, 20.5937], // Default center (india)
              zoom: 4
            });

            // Add a graphics layer to display random locations
            var graphicsLayer = new GraphicsLayer();
            map.add(graphicsLayer);

            // Initialize popup
            var popup = new Popup({
              view: mapView,
              dockEnabled: false,
              visibleElements: {
                closeButton: false,
                title: true
              }
            });

            // Function to display locations on the map
            function displayLocations(allData) {
              // Clear existing graphics if any
              graphicsLayer.removeAll();

              // Display locations for the selected state
              allData.forEach(function (data) {
                var point = new Point({
                  longitude: data.location.longitude,
                  latitude: data.location.latitude
                });
                var markerSymbol = new SimpleMarkerSymbol({
                  color: [226, 119, 40], // Orange
                  outline: {
                    color: [255, 255, 255], // White
                    width: 1
                  }
                });
                var pointGraphic = new Graphic({
                  geometry: point,
                  symbol: markerSymbol
                });
                graphicsLayer.add(pointGraphic);
                // Add popup template to graphics
                pointGraphic.popupTemplate = {
                  content: `Name: ${data.growerName}<br>Latitude: ${point.latitude}<br>Longitude: ${point.longitude}`,
                  title: "Coordinates"
                };
              });
            }


            // Listen for the 'updateMapForStates' event
            scope.$on('updateMapForStatesGrowers', function (event, allStateData) {
              // Call the displayLocations function when the event is triggered
              displayLocations(allStateData);
            });

            // Listen for the 'updateMapForStates' event
            scope.$on('updateMapForFilters', function (event, allFilterData) {
              // Call the displayLocations function when the event is triggered
              displayLocations(allFilterData);
            });

          });
        }
      };
    });
