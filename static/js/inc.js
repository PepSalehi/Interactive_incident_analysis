queue()
    .defer(d3.csv, "static/csv/MTR_incidents_augmented_data.csv")
    .defer(d3.csv, "static/csv/Record of 2-min delays for MIT_backup.csv")
    .await(makeGraphs);

function makeGraphs(error, demandJson, new_data) {



	//Clean demandJson data
	 incidents = demandJson;
	 new_incidents = new_data;
	 incidents = incidents.concat(new_incidents)
	// var dateFormat = d3.time.format("%y-%b-%d");
	var timeFormat = d3.time.format("%H:%M:%L");
	var timeFormatNoSeconds = d3.time.format("%H:%M");
	var format = d3.time.format("%Y-%m-%d");
	var monthParser = d3.time.format('%m/%d/%Y')
	// const monthNames = ["January", "February", "March", "April", "May", "June",
 //  "July", "August", "September", "October", "November", "December"
	// ];
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
  "July", "Aug", "Sep", "Oct", "Nov", "Dec"
	];

	// var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");

	incidents.forEach(function(d,i) {
		// debugger;
		// console.log(d)
		// console.log(i)
		// need to preprocess date 
		a = d["Event Date Time"].split(" ")[1]
		if(a.split(":").length == 2){
			d.time_parsed = timeFormatNoSeconds.parse(a)
		}
		else{
			d.time_parsed  = timeFormat.parse(a);	
		}
		// d.month_numeric = monthParser.parse(d["Operating Day"]).getMonth(); //0-11
		d.Month = monthNames[monthParser.parse(d["Operating Day"]).getMonth()]

		// console.log(d);
		d.Hour = d.time_parsed.getHours();
		d.Delay = +d["Initial Delay"];

	});


	//Create a Crossfilter instance
	var ndx = crossfilter(incidents);

	// debugger;
	//Define Dimensions
	var timeDim = ndx.dimension(function(d){ return d.Hour});
	var dayDim	= ndx.dimension(function(d) {return d.Day});
	var monthDim = ndx.dimension(function(d) {return d.Month});
	var YearDim	= ndx.dimension(function(d) {return d["Year"]});
	var causeDim = ndx.dimension(function (d) { return d["Allocation Desc"] });
	var locationDim = ndx.dimension(function(d){ return d["Location From"]});
	var delayDim = ndx.dimension(function(d) {return d.Delay});
	
	var lineDim	= ndx.dimension(function(d) {return d["All Lines"]});
	
	var trackDim= ndx.dimension(function(d) {return d["Track"]});


	// debugger;

	//Calculate metrics
	// var numProjectsByDate = dateDim.group(); 
	// var numOrigin = originDim.group();
	var causeByDay = dayDim.group().reduceCount(function(d){
		return d.Cause
	})
	var totalByHour = timeDim.group().reduceCount();
	var totalByCause = causeDim.group().reduceCount();
	var delayByCause = causeDim.group().reduceCount(function(d){
		return d.Delay
	});
	var delayByLocation = locationDim.group().reduceCount(function(d){
		return d.Delay
	});
	var delayByYear = YearDim.group().reduceCount(function(d){
		return d.Delay
	});
	var delayByHour = timeDim.group().reduceCount(function(d){
		return d.Delay
	});
	var delayByDay = dayDim.group().reduceCount(function(d){
		return d.Delay
	});
	var delayByMonth = monthDim.group().reduceCount(function(d){
		return d.Delay
	});
	var delayByLine = lineDim.group().reduceCount(function(d){
		return d.Delay
	});

	var delayGroup = delayDim.group().reduceCount()


	// var all = ndx.groupAll();
	// var totalDemand = ndx.groupAll().reduceSum(function(d) {return d["total"];});
	// var totalHistoricalDemand = ndx.groupAll().reduceSum(function(d) {return d["hist_total"];});
	// var max_state = totalDemandByStation.top(1)[0].value; // what is this?



	//Define values (to be used in charts)
	// var minDate = arrivalTimeDim.bottom(1)[0]["Date"];
	// var maxDate = arrivalTimeDim.top(1)[0]["Date"];
	// var minHistDate = histarrivalTimeDim.bottom(1)[0]["Date"];
	// var maxHistDate = histarrivalTimeDim.top(1)[0]["Date"];
	// var maxTravelTime = travelTimeDim.top(1)[0]["travelTime"];
	// var minTravelTime = travelTimeDim.bottom(1)[0]["travelTime"];
	// var maxDemand = totalDim.top(1)[0]["total"];

    //Charts
    var delayCauseChart = dc.barChart("#poverty-level-row-chart");
    var timeChart = dc.lineChart("#time-chart");
    var delayDayChart = dc.barChart("#us-chart");
    var delayLineChart = dc.barChart("#second_time_chart");
    var  delayYearChart= dc.barChart("#year_delay_chart");
    var  delayMonthChart= dc.barChart("#month_delay_chart");
    var  delayLocationChart= dc.barChart("#location_placeholder");
    var delayHist = dc.barChart("#resource-type-row-chart");

    delayHist
        .width(550)
        .height(280)
        .margins({top: 10, right: 10, bottom: 40, left: 40})
        .x(d3.scale.linear().domain([0,60]))
        .brushOn(true)
        .dimension(delayDim)
        .group(delayGroup)
        .elasticY(true)
		.ordinalColors(['#763800'])
		.xAxisLabel("Minutes");


    
    delayDayChart
		.width(550)
		.height(230)
		.margins({top: 10, right: 10, bottom: 40, left: 50})
        .dimension(dayDim)
        .group(delayByDay)
        // .gap(1)
        // .stack(historicalDestination)
        // .x(d3.scale.ordinal().domain([ "Victoria", "Vauxhall", "Stratford", "Whitechapel", "Woodford"]))
        // https://github.com/dc-js/dc.js/issues/384
        .ordering(function(d) {
		    if(d.key == "Mon") return 0;
		    else if(d.key == "Tue") return 1;
		    else if(d.key == "Wed") return 2;
		    else if(d.key == "Thu") return 3;
		    else if(d.key == "Fri") return 4;
		    else if(d.key == "Sat") return 5;
		    else if(d.key == "Sun") return 6;
		    // handle all days 
		})
        .x(d3.scale.ordinal())
    	.y(d3.scale.linear())
		.elasticY(true)
		.elasticX(false)
		.centerBar(false)
		.xUnits(dc.units.ordinal)
		.ordinalColors(['#404040'])
        // .xAxis().tickFormat(function(v) { return ""; })
        // .xAxisLabel("Day");

	delayLineChart
		.width(550)
		.height(280)
		.margins({top: 10, right: 10, bottom: 80, left: 50})
        .dimension(lineDim)
        .group(delayByLine)
        // .stack(historicalDestination)
        // .x(d3.scale.ordinal().domain([ "Victoria", "Vauxhall", "Stratford", "Whitechapel", "Woodford"]))
        .x(d3.scale.ordinal())
    	.y(d3.scale.linear())
		.elasticY(true)
		.elasticX(false)
		.centerBar(false)
		.xUnits(dc.units.ordinal)
        // .xAxis().tickFormat(function(v) { return ""; })
        .ordinalColors(['#4daf4a'])
        .xAxisLabel("Line");
		// .ordinalColors(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628'])





	delayLocationChart
		.width(window.innerWidth*0.9)
		.height(230)
		.margins({top: 10, right: 10, bottom: 20, left: 50})
        .dimension(locationDim)
        .group(delayByLocation)
        // .stack(historicalDestination)
        // .x(d3.scale.ordinal().domain([ "Victoria", "Vauxhall", "Stratford", "Whitechapel", "Woodford"]))
        .x(d3.scale.ordinal())
    	.y(d3.scale.linear())
		.elasticY(true)
		.elasticX(false)
		.centerBar(false)
		.xUnits(dc.units.ordinal)
		.xAxisLabel("Location")
        .xAxis()
        .tickFormat(function(v) { return ""; });

    delayYearChart
		.width(500)
		.height(230)
		.margins({top: 10, right: 10, bottom: 20, left: 50})
        .dimension(YearDim)
        .group(delayByYear)
        // .stack(historicalDestination)
        // .x(d3.scale.ordinal().domain([ "Victoria", "Vauxhall", "Stratford", "Whitechapel", "Woodford"]))
        .x(d3.scale.ordinal())
    	.y(d3.scale.linear())
		.elasticY(true)
		.elasticX(false)
		.centerBar(false)
		.xUnits(dc.units.ordinal)
		// .xAxisLabel("Year")
        .xAxis().tickFormat(function(d) { return d; });

    delayMonthChart
		.width(550)
		.height(280)
		.margins({top: 10, right: 10, bottom: 20, left: 50})
        .dimension(monthDim)
        .group(delayByMonth)
        .ordering(function(d) {
        	return monthNames.indexOf(d.key)
		})
        // .stack(historicalDestination)
        // .x(d3.scale.ordinal().domain([ "Victoria", "Vauxhall", "Stratford", "Whitechapel", "Woodford"]))
        .x(d3.scale.ordinal())
    	.y(d3.scale.linear())
		.elasticY(true)
		.elasticX(false)
		.centerBar(false)
		.xUnits(dc.units.ordinal)
		.ordinalColors(['#e34a33'])
		// .xAxisLabel("Year")
        .xAxis().tickFormat(function(d) { return d; });



	timeChart
		.width(550)
		.height(230)
		.margins({top: 10, right: 10, bottom: 40, left: 50})
		.dimension(timeDim)
		.group(delayByHour, "Observed")
		// .ordinalColors(["orange"])
		// .stack(histArrivalPer15min, "historical")
		.transitionDuration(500)
		.renderArea(true)
		// .elasticX(true)
		.elasticY(true)
		.x(d3.scale.linear().domain([0, 24]))
		// .x(d3.time.scale().domain([0, 24]))
		.xUnits(d3.time.hour)
	    .renderHorizontalGridLines(true)
		// .legend(dc.legend().x(60).y(10).itemHeight(13).gap(5))
		.xAxisLabel("Hour")
		.yAxis().ticks(4);
		// .xAxis().ticks(5);


	delayCauseChart
		.width(window.innerWidth*0.9)
		.height(230)
		.margins({top: 10, right: 10, bottom: 40, left: 50})
        .dimension(causeDim)
        .group(delayByCause)
        // .stack(historicalDestination)
        // .x(d3.scale.ordinal().domain([ "Victoria", "Vauxhall", "Stratford", "Whitechapel", "Woodford"]))
        .x(d3.scale.ordinal())
    	.y(d3.scale.linear().domain([0, 15]))
		.elasticY(true)
		.elasticX(false)
		.centerBar(false)
		.xUnits(dc.units.ordinal)
		.xAxisLabel("Cause Factor")
		.ordinalColors(['#e41a1c'])

        .xAxis().tickFormat(function(v) { return ""; });



	// var timeChart = dc.lineChart("#time-chart");
	// var travelTimeChart = dc.barChart("#resource-type-row-chart");
	// var destinationChart = dc.barChart("#poverty-level-row-chart");
	// var usChart = dc_leaflet.choroplethChart("#us-chart");
	// var totalHistDemandND = dc.numberDisplay("#number-projects-nd");
	// var totalDemandND = dc.numberDisplay("#total-donations-nd");
	// var histOverview = dc.lineChart("#second_time_chart");
	// debugger;
	// usChart.width(1000)
	// 	.height(450)
	// 	.dimension(stateDim)
	// 	.group(totalDemandByStation)
	// 	.center([ 51.4963, -0.143 ])
	// 	.zoom(10)
	// 	.geojson(statesJson)
	// 	.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
	// 	.colorDomain([0, max_state])
	// 	.colorAccessor(function(d,i) {
 //              return d.value;
 //          })
	// 	// .featureKeyAccessor(function(feature) {
 //  //             return feature.properties.destination;
 //  //         })
 //        .renderPopup(true)
	// 	.popup(function(d,feature) {
 //              return feature.properties.name+" : "+d.value;
 //          })
	// 	.legend(dc_leaflet.legend().position('bottomright'));

	// 	//https://github.com/dc-js/dc.js/issues/419
	// 	usChart.on("preRender", function(chart) {
 //            chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()));
 //        })
 //        usChart.on("preRedraw", function(chart) {
 //            chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()));
 //        })


	
		










	

	// var time1 = dc.lineChart("#second_time_chart")
	// 			.dimension(histarrivalTimeDim)
	// 			.group(histArrivalPer15min, "Historical")
	// 			.x(d3.time.scale().domain([minHistDate, maxHistDate]))
	// 			.xUnits(d3.time.hour)
	// 			.y(d3.scale.linear().domain([0, maxDemand]))
	// 			.colors('green')
	// 			// .renderHorizontalGridLines(true);
	// var time2 = dc.lineChart("#second_time_chart")
	// 			.dimension(histarrivalTimeDim)
	// 			.group(medtArrivalPer15min, "Median Day")
	// 			// .x(d3.scale.linear().domain([minDate, maxDate]))
	// 			.x(d3.time.scale().domain([minHistDate, maxHistDate]))
	// 			.xUnits(d3.time.hour)
	// 			.y(d3.scale.linear().domain([0, maxDemand]))
	// 			.colors('red')
	// 			// .renderHorizontalGridLines(true);
	// var time3 = dc.lineChart("#second_time_chart")
	// 			.dimension(histarrivalTimeDim)
	// 			.group(obsArrivalPer15min, "Observed")
	// 			.colors('blue')
	// 			// .x(d3.scale.linear().domain([minDate, maxDate]))
	// 			.x(d3.time.scale().domain([minHistDate, maxHistDate]))
	// 			.xUnits(d3.time.hour)
	// 			.y(d3.scale.linear().domain([0, maxDemand]))

	// var histOverview = dc.compositeChart("#second_time_chart");
	// 	histOverview
	// 	.width(450)
	// 	.height(300)
	// 	.margins({top: 10, right: 50, bottom: 30, left: 50})
	// 	.transitionDuration(500)
	// 	.dimension(histarrivalTimeDim)
	// 	.brushOn(false)
	// 	.elasticY(true)
	// 	// .x(d3.scale.linear().domain([minDate, maxDate]))
	// 	.x(d3.time.scale().domain([minDate, maxDate]))
	// 	.xUnits(d3.time.hour)
	// 	.y(d3.scale.linear().domain([0, maxDemand]))
	// 	.legend(dc.legend().x(60).y(10).itemHeight(13).gap(5))
	// 	.compose([
	// 		time1,
	// 		time2,
	// 		time3

	// 		])
	// 	.xAxisLabel("Time")
	// 	.yAxis().ticks(6);
	// histOverview.xAxis().tickFormat(d3.time.format("%H:%M"))
	// histOverview.xAxis().ticks(4);
		

	// // number of days i.e. 28
	// //http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
	// // totalHistDemandND
	// // 	.formatNumber(d3.format(".0f"))
	// // 	.valueAccessor(function(d){return d; })
	// // 	.group(totalHistoricalDemand)
	// 	// .formatNumber(d3.format(",d"));
	// // works fine
	// totalDemandND
	// 	.formatNumber(d3.format(".0f"))
	// 	.valueAccessor(function(d){return d; })
	// 	.group(totalDemand)
	// 	// .formatNumber(d3.format(",d"))

	// 	// .formatNumber(d3.format(".3s"));
	// //works
	

 // 	travelTimeChart
	//  	.width(450)
	// 	.height(300)
	// 	.dimension(travelTimeDim)
 //        .group(travelTimeGroup)
	// 	.margins({top: 10, right: 10, bottom: 30, left: 30})
 //        // .gap(10)
 //        // .x(d3.scale.ordinal().domain(["Bank", "victoria"]))
 //        .x(d3.scale.linear().domain([minTravelTime, maxTravelTime+1]))
 //    	.y(d3.scale.linear().domain([0, 800]))
	// 	.elasticY(true)
	// 	.elasticX(false)
	// 	.centerBar(false)
	// 	.ordinalColors(["red"])
	// 	.xAxisLabel("Minutes")

	// 	// .xUnits(function(d){return 30;})
	// 	// .xUnits(dc.units.fp.precision(binwidth))
	// 	// .on("preRedraw", function (chart) {
	//  //        chart.rescale();
	// 	// 	})
	// 	// travelTimeChart.on("preRender", function (chart) {
	// 	//     chart.rescale();
	// 	// 	})
	// 	.xAxis().tickFormat();



	// s = [[51.692322, 0.33403], [51.286839, -0.51035]]

 //    var projection = d3.geo.mercator()
 //    .center([ -0.143229499999988, 51.4963585 ])
 //    .scale(45000) //40000
 //    .translate([1000 / 2, 550 / 2]);

// ////////////////
// 	function zoomed() {
// 	    projection
// 	    .translate(d3.event.translate)
// 	    .scale(d3.event.scale);
// 	    usChart.render();
// 	}
// 	var zoom = d3.behavior.zoom()
//     .translate(projection.translate())
//     .scale(projection.scale())
//     .scaleExtent([450/2, 8 * 450])
//     .on("zoom", zoomed);

// var svg = d3.select("#us-chart")
//     .attr("width", 1000)
//     .attr("height", 450)
//     .call(zoom);
// ////////////////


	// var geondx = crossfilter(statesJson); 	
	// var facilities = geondx.dimension(function(d){ return d.geometry.coordinates;});
	// var facilitiesGroup = facilities.group().reduceCount();
	// dc.leafletMarkerChart("#us-chart","marker-select")
	//   .dimension(facilities)
	//   .group(facilitiesGroup)
	//   .width(1000)
	//     .height(300)
	//   .center([42.69,25.42])
	//   .zoom(7)
	//   .renderPopup(true)
	//   .popup(function(d, marker){
	//     return d.key + " : " + d.value;
	//   })
	//   .cluster(false);
	

	// canary wharf with the most long (delayed) travel times
    dc.renderAll();

};