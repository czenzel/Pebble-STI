/*
 Local Storm Cell Detection for Pebble Time
 
 Copyright 2015 Christopher Zenzel.
 All Rights Reserved.
 */

// Called when JS is ready
Pebble.addEventListener("ready",
							function(e) {
                var locationOptions = {
                  'timeout': 15000,
                  'maximumAge': 60000
                };
                
                var currentLocation = navigator.geolocation.getCurrentPosition(locationSuccess, locationFailure, locationOptions);
                
                setInterval(function() {
                  var locationTimer = navigator.geolocation.getCurrentPosition(locationSuccess, locationFailure, locationOptions);
                }, 360000);
							});

// Called on Location Success Event
function locationSuccess(position) {
  var coordinates = position.coords;
  findNearbyRadar(coordinates.latitude, coordinates.longitude);
}

// Called on a failed location
function locationFailure(err) {
  console.log('[err] Location Lookup Sensor Failed [sens_GPS]');
}
												
// Called when incoming message from the Pebble is received
Pebble.addEventListener("appmessage",
							function(e) {
              });

// Send an Application Message - Communication on Storm Data
function appMsgStormData (radar_site, cell_count, cell_closest, cell_heading) {
  // Format the radar
  radar_site = 'K' + radar_site.toUpperCase();

  // Send data based on counts
  if (cell_count > 0) {
    Pebble.sendAppMessage({
      'radar': radar_site,
      'cells': parseInt(cell_count),
      'closest': parseInt(cell_closest),
      'heading': parseInt(cell_heading),
      'detected': 0
    });
  } else {
    Pebble.sendAppMessage({
      'radar': radar_site,
      'cells': 0,
      'closest': 0,
      'heading': 0,
      'detected': 0
    });
  }
}

// Grab NEXRAD Level III Storm Tracking Information
function grabRadarSTI (radar_site, center_lat, center_lon, user_lat, user_lon) {
  var stiUri = 'http://weather.noaa.gov/pub/SL.us008001/DF.of/DC.radar/DS.58sti/SI.k' + radar_site + '/sn.last';
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', stiUri, true);
  
  xhr.setRequestHeader('Content-Type', 'text/plain');
  xhr.setRequestHeader('Accept', 'text/plain');
  xhr.responseType = 'arraybuffer';
  
  xhr.onload = function (data) {
      data = xhr.response;
      data = ab2str(data);
    
      var cellsDetected = 0;
      var shortestDistance = -1;
      var shortestHeading = 0;

      data = data.replace(/((\s+)?\/(\s+)?)/ig, '/');
      data = data.replace(/\s+/ig, ' ');
      
      var pathRegex = new RegExp("([A-Z][0-9]) (([0-9])+/([0-9])+)( (NONE|(E)?TVS|([0-9]+(\\.[0-9]+)?)\\/([0-9]+(\\.[0-9]+)?)))( (NONE|(E)?TVS|([0-9]+(\\.[0-9]+)?)\\/([0-9]+(\\.[0-9]+)?))) (([0-9]+(\\.[0-9]+)?)\\/([0-9]+(\\.[0-9]+)?)|NO DATA) (([0-9]+(\\.[0-9]+)?)\\/([0-9]+(\\.[0-9]+)?)|NO DATA) (([0-9]+(\\.[0-9]+)?)\\/([0-9]+(\\.[0-9]+)?)|NO DATA)", "g");
      
      var sPath;
      while (sPath = pathRegex.exec(data)) {
        var explode = sPath[2].split("/");
        
        var azimuth = parseFloat(explode[0]);
        var range = parseFloat(explode[1]);
        
        var distance = range * 1.15077945;
        var latLonDelta = (69.11 / distance);
        
        var stormLatitude = center_lat;
        var stormLongitude = center_lon;
        
        if (azimuth >= 0 && azimuth < 90) {
          stormLatitude = center_lat + latLonDelta;
          stormLongitude = center_lon + latLonDelta;
        }
        else if (azimuth > 90 && azimuth < 180) {
          stormLatitude = center_lat + latLonDelta;
          stormLongitude = center_lon - latLonDelta;
        }
        else if (azimuth > 180 && azimuth < 270) {
          stormLatitude = center_lat - latLonDelta;
          stormLongitude = center_lon - latLonDelta;
        }
        else {
          stormLatitude = center_lat - latLonDelta;
          stormLongitude = center_lon + latLonDelta;
        }
                
        var stormDistance = closestDistance(stormLatitude, stormLongitude, user_lat, user_lon);
        
        if (shortestDistance == -1 || shortestDistance > stormDistance) {
          shortestDistance = stormDistance;
          shortestHeading = azimuth;
        }
        
        cellsDetected = cellsDetected + 1;
      }
      
      if (cellsDetected > 0) {
        shortestDistance = Math.ceil(shortestDistance * 10) / 10;
        appMsgStormData(radar_site, cellsDetected, shortestDistance, azimuth);
      } else {
        appMsgStormData(radar_site, 0, -1, -1);
      }
  };
  
  xhr.onerror = function(err) {
    console.log('[Error] Unable to receive storm tracking information.');
  };
  
  xhr.send();
}

/*
 My Nexrad Sites for Pebble Time Database
 
 Copyright 2015 Christopher Zenzel
 All Rights Reserved.
 
 Generated by Chris Zenzel and teamWeather.com
 */
var myNexradSites = {"abc":{"icao":"abc","lat":"60.79","lon":"-161.88"},"acg":{"icao":"acg","lat":"56.85","lon":"-135.53"},"aec":{"icao":"aec","lat":"64.50","lon":"-165.32"},"ahg":{"icao":"ahg","lat":"60.73","lon":"-151.35"},"aih":{"icao":"aih","lat":"59.46","lon":"-146.30"},"akc":{"icao":"akc","lat":"58.68","lon":"-156.63"},"apd":{"icao":"apd","lat":"65.04","lon":"-147.50"},"bmx":{"icao":"bmx","lat":"33.172","lon":"-86.770"},"eox":{"icao":"eox","lat":"31.460","lon":"-85.459"},"htx":{"icao":"htx","lat":"34.931","lon":"-86.084"},"mob":{"icao":"mob","lat":"30.679","lon":"-88.240"},"mxx":{"icao":"mxx","lat":"32.537","lon":"-85.790"},"lzk":{"icao":"lzk","lat":"34.836","lon":"-92.262"},"srx":{"icao":"srx","lat":"35.291","lon":"-94.362"},"emx":{"icao":"emx","lat":"31.894","lon":"-110.630"},"fsx":{"icao":"fsx","lat":"34.574","lon":"-111.197"},"iwa":{"icao":"iwa","lat":"33.289","lon":"-111.669"},"yux":{"icao":"yux","lat":"32.495","lon":"-114.656"},"bbx":{"icao":"bbx","lat":"39.493","lon":"-121.608"},"bhx":{"icao":"bhx","lat":"40.499","lon":"-124.291"},"dax":{"icao":"dax","lat":"38.501","lon":"-121.677"},"eyx":{"icao":"eyx","lat":"35.098","lon":"-117.560"},"hnx":{"icao":"hnx","lat":"36.314","lon":"-119.631"},"mux":{"icao":"mux","lat":"37.155","lon":"-121.897"},"nkx":{"icao":"nkx","lat":"32.919","lon":"-117.041"},"sox":{"icao":"sox","lat":"33.818","lon":"-117.635"},"vbx":{"icao":"vbx","lat":"34.838","lon":"-120.396"},"vtx":{"icao":"vtx","lat":"34.412","lon":"-119.179"},"ftg":{"icao":"ftg","lat":"39.786","lon":"-104.545"},"gjx":{"icao":"gjx","lat":"39.062","lon":"-108.213"},"pux":{"icao":"pux","lat":"38.459","lon":"-104.181"},"dox":{"icao":"dox","lat":"38.83","lon":"-75.44"},"amx":{"icao":"amx","lat":"25.611","lon":"-80.413"},"byx":{"icao":"byx","lat":"24.597","lon":"-81.703"},"evx":{"icao":"evx","lat":"30.564","lon":"-85.921"},"jax":{"icao":"jax","lat":"30.484","lon":"-81.702"},"mlb":{"icao":"mlb","lat":"28.113","lon":"-80.654"},"tbw":{"icao":"tbw","lat":"27.705","lon":"-82.402"},"tlh":{"icao":"tlh","lat":"30.398","lon":"-84.329"},"ffc":{"icao":"ffc","lat":"33.363","lon":"-84.566"},"jgx":{"icao":"jgx","lat":"32.675","lon":"-83.351"},"vax":{"icao":"vax","lat":"30.89","lon":"-83.01"},"gua":{"icao":"gua","lat":"13.45","lon":"144.81"},"hki":{"icao":"hki","lat":"21.89","lon":"-159.55"},"hkm":{"icao":"hkm","lat":"20.09","lon":"-155.75"},"hmo":{"icao":"hmo","lat":"21.13","lon":"-157.18"},"hwa":{"icao":"hwa","lat":"19.09","lon":"-155.57"},"dmx":{"icao":"dmx","lat":"41.731","lon":"-93.723"},"dvn":{"icao":"dvn","lat":"41.612","lon":"-90.581"},"cbx":{"icao":"cbx","lat":"43.491","lon":"-116.234"},"sfx":{"icao":"sfx","lat":"43.106","lon":"-112.685"},"ilx":{"icao":"ilx","lat":"40.151","lon":"-89.337"},"lot":{"icao":"lot","lat":"41.604","lon":"-88.085"},"ind":{"icao":"ind","lat":"39.708","lon":"-86.280"},"iwx":{"icao":"iwx","lat":"41.359","lon":"-85.700"},"ddc":{"icao":"ddc","lat":"37.761","lon":"-99.968"},"gld":{"icao":"gld","lat":"39.366","lon":"-101.700"},"ict":{"icao":"ict","lat":"37.654","lon":"-97.443"},"twx":{"icao":"twx","lat":"38.997","lon":"-96.232"},"hpx":{"icao":"hpx","lat":"36.74","lon":"-87.29"},"jkl":{"icao":"jkl","lat":"37.591","lon":"-83.313"},"lvx":{"icao":"lvx","lat":"37.975","lon":"-85.944"},"pah":{"icao":"pah","lat":"37.068","lon":"-88.772"},"lch":{"icao":"lch","lat":"30.125","lon":"-93.216"},"lix":{"icao":"lix","lat":"30.337","lon":"-89.825"},"poe":{"icao":"poe","lat":"31.16","lon":"-92.98"},"shv":{"icao":"shv","lat":"32.451","lon":"-93.841"},"box":{"icao":"box","lat":"41.956","lon":"-71.138"},"cbw":{"icao":"cbw","lat":"46.039","lon":"-67.807"},"gyx":{"icao":"gyx","lat":"43.891","lon":"-70.257"},"apx":{"icao":"apx","lat":"44.907","lon":"-84.720"},"dtx":{"icao":"dtx","lat":"42.700","lon":"-83.472"},"grr":{"icao":"grr","lat":"42.894","lon":"-85.545"},"mqt":{"icao":"mqt","lat":"46.531","lon":"-87.548"},"dlh":{"icao":"dlh","lat":"46.837","lon":"-92.210"},"mpx":{"icao":"mpx","lat":"44.849","lon":"-93.565"},"eax":{"icao":"eax","lat":"38.810","lon":"-94.264"},"lsx":{"icao":"lsx","lat":"38.699","lon":"-90.683"},"sgf":{"icao":"sgf","lat":"37.235","lon":"-93.400"},"gwx":{"icao":"gwx","lat":"33.798","lon":"-88.329"},"jan":{"icao":"jan","lat":"32.318","lon":"-90.080"},"blx":{"icao":"blx","lat":"45.854","lon":"-108.606"},"ggw":{"icao":"ggw","lat":"48.206","lon":"-106.624"},"msx":{"icao":"msx","lat":"47.041","lon":"-113.985"},"tfx":{"icao":"tfx","lat":"47.460","lon":"-111.384"},"ltx":{"icao":"ltx","lat":"33.989","lon":"-78.429"},"mhx":{"icao":"mhx","lat":"34.776","lon":"-76.876"},"rax":{"icao":"rax","lat":"35.665","lon":"-78.490"},"bis":{"icao":"bis","lat":"46.771","lon":"-100.760"},"mbx":{"icao":"mbx","lat":"48.393","lon":"-100.864"},"mvx":{"icao":"mvx","lat":"47.528","lon":"-97.325"},"lnx":{"icao":"lnx","lat":"41.958","lon":"-100.576"},"oax":{"icao":"oax","lat":"41.320","lon":"-96.366"},"uex":{"icao":"uex","lat":"40.321","lon":"-98.442"},"abx":{"icao":"abx","lat":"35.150","lon":"-106.823"},"fdx":{"icao":"fdx","lat":"34.635","lon":"-103.629"},"hdx":{"icao":"hdx","lat":"33.076","lon":"-106.122"},"esx":{"icao":"esx","lat":"35.701","lon":"-114.891"},"lrx":{"icao":"lrx","lat":"40.740","lon":"-116.802"},"rgx":{"icao":"rgx","lat":"39.754","lon":"-119.461"},"bgm":{"icao":"bgm","lat":"42.201","lon":"-75.985"},"buf":{"icao":"buf","lat":"42.949","lon":"-78.737"},"enx":{"icao":"enx","lat":"42.586","lon":"-74.064"},"okx":{"icao":"okx","lat":"40.866","lon":"-72.864"},"rmx":{"icao":"rmx","lat":"43.47","lon":"-75.46"},"cle":{"icao":"cle","lat":"41.413","lon":"-81.860"},"iln":{"icao":"iln","lat":"39.420","lon":"-83.822"},"fdr":{"icao":"fdr","lat":"34.362","lon":"-98.976"},"inx":{"icao":"inx","lat":"36.175","lon":"-95.564"},"tlx":{"icao":"tlx","lat":"35.333","lon":"-97.278"},"vnx":{"icao":"vnx","lat":"36.741","lon":"-98.128"},"max":{"icao":"max","lat":"42.081","lon":"-122.716"},"pdt":{"icao":"pdt","lat":"45.691","lon":"-118.852"},"rtx":{"icao":"rtx","lat":"45.715","lon":"-122.964"},"ccx":{"icao":"ccx","lat":"40.923","lon":"-78.004"},"dix":{"icao":"dix","lat":"39.947","lon":"-74.411"},"pbz":{"icao":"pbz","lat":"40.531","lon":"-80.218"},"jua":{"icao":"jua","lat":"18.12","lon":"-66.08"},"cae":{"icao":"cae","lat":"33.949","lon":"-81.119"},"clx":{"icao":"clx","lat":"32.655","lon":"-81.042"},"gsp":{"icao":"gsp","lat":"34.883","lon":"-82.220"},"abr":{"icao":"abr","lat":"45.46","lon":"-98.41"},"fsd":{"icao":"fsd","lat":"43.588","lon":"-96.729"},"udx":{"icao":"udx","lat":"44.125","lon":"-102.829"},"mrx":{"icao":"mrx","lat":"36.168","lon":"-83.402"},"nqa":{"icao":"nqa","lat":"35.345","lon":"-89.873"},"ohx":{"icao":"ohx","lat":"36.247","lon":"-86.563"},"ama":{"icao":"ama","lat":"35.233","lon":"-101.709"},"bro":{"icao":"bro","lat":"25.916","lon":"-97.419"},"crp":{"icao":"crp","lat":"27.784","lon":"-97.511"},"dfx":{"icao":"dfx","lat":"29.27","lon":"-100.28"},"dyx":{"icao":"dyx","lat":"32.54","lon":"-99.25"},"epz":{"icao":"epz","lat":"31.873","lon":"-106.698"},"ewx":{"icao":"ewx","lat":"29.704","lon":"-98.028"},"fws":{"icao":"fws","lat":"32.573","lon":"-97.303"},"grk":{"icao":"grk","lat":"30.722","lon":"-97.383"},"hgx":{"icao":"hgx","lat":"29.472","lon":"-95.079"},"lbb":{"icao":"lbb","lat":"33.654","lon":"-101.814"},"maf":{"icao":"maf","lat":"31.943","lon":"-102.189"},"sjt":{"icao":"sjt","lat":"31.371","lon":"-100.492"},"icx":{"icao":"icx","lat":"37.591","lon":"-112.861"},"mtx":{"icao":"mtx","lat":"41.263","lon":"-112.447"},"akq":{"icao":"akq","lat":"36.984","lon":"-77.008"},"fcx":{"icao":"fcx","lat":"37.024","lon":"-80.274"},"lwx":{"icao":"lwx","lat":"38.975","lon":"-77.478"},"cxx":{"icao":"cxx","lat":"44.511","lon":"-73.166"},"atx":{"icao":"atx","lat":"48.195","lon":"-122.494"},"otx":{"icao":"otx","lat":"47.681","lon":"-117.626"},"arx":{"icao":"arx","lat":"43.823","lon":"-91.191"},"grb":{"icao":"grb","lat":"44.498","lon":"-88.111"},"mkx":{"icao":"mkx","lat":"42.968","lon":"-88.551"},"rlx":{"icao":"rlx","lat":"38.311","lon":"-81.723"},"cys":{"icao":"cys","lat":"41.152","lon":"-104.806"},"riw":{"icao":"riw","lat":"43.066","lon":"-108.477"}};
/*
 End Javascript Database
 */

// Find the closest NEXRAD Radar Station based on local database
function findNearbyRadar (latitude, longitude) {
  var closestRadar = "";
  var closestRadarDist = -1;
  
  for (var radarSite in myNexradSites) {
    var radarLocation = myNexradSites[radarSite];
    var rlat = parseFloat(radarLocation.lat);
    var rlon = parseFloat(radarLocation.lon);
    var dist = closestDistance(latitude, longitude, rlat, rlon);
      
    if (closestRadarDist == -1 || closestRadarDist > dist) {
      closestRadarDist = dist;
      closestRadar = radarLocation.icao;
    }
  }
    
  grabRadarSTI(closestRadar,
              parseFloat(myNexradSites[closestRadar].lat),
              parseFloat(myNexradSites[closestRadar].lon),
              latitude,
              longitude);
}

// Convert Array Byte to String
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// Find the cloest distance aprox. in miles between any two locations
function closestDistance (lat, lon, user_lat, user_lon) 
{
  var closeDistance = ((user_lon - lon) * (user_lon - lon)) +
    ((user_lat - lat) * (user_lat - lat));
  closeDistance *= 40;
  return parseFloat(closeDistance);
}
