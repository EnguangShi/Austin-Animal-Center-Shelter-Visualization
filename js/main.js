const parseTime = d3.timeParse("%m-%d");

let selectBreed;
let selectAge;
let selectTypeCondition;
let selectTime = [0, 0];
let dispatcher = d3.dispatch(
  "filterBreed",
  "filterAge",
  "filterTypeCondition",
  "filterTime"
);
let selectAnimalType = [];

// create line chart
d3.csv("data/aac_intakes.csv").then((data) => {
  d3.csv("data/aac_outcomes.csv").then((data2) => {
    let timeline = new timeLine(
      { parentElement: "#timeline" },
      data,
      data2,
      selectBreed,
      selectAge,
      selectTime,
      dispatcher
    );
    timeline.updateVis();

    let lines = new Line(
      { parentElement: "#line-chart" },
      data,
      data2,
      selectBreed,
      selectAge,
      dispatcher
    );
    lines.updateVis();
    dispatcher.on("filterTime", (time) => {
      if (time == null) {
        timeline.data = data;
        timeline.data2 = data2;
        timeline.selectTime = undefined;
      } else {
        selectTime = time;
        timeline.selectTime = time;
      }
      timeline.updateVis();
    });
  });
});

// load the intakes data
d3.csv("data/aac_intakes_outcomes.csv").then((data) => {
  data.forEach((d) => {
    // Preprocess age
    if (d.age_upon_outcome.includes("months")) {
      const months = parseInt(d.age_upon_outcome);
      d.age_upon_outcome = months <= 6 ? 0 : 1;
    } else {
      const years = parseInt(d.age_upon_outcome);
      d.age_upon_outcome = years;
    }

    // Preprocess age group
    if (d.age_upon_outcome < 3) d.age_group = "Baby";
    else if (d.age_upon_outcome < 5) d.age_group = "Young";
    else if (d.age_upon_outcome < 10) d.age_group = "Mature";
    else d.age_group = "Elder";

    // Preprocess days
    const days = parseInt(d.time_in_shelter.split(" ")[0]);
    d.time_in_shelter = days;
  });

  // create graphs
  let bubble = new BubbleChart(
    { parentElement: "#bubble-chart" },
    data,
    selectAge,
    selectTypeCondition,
    dispatcher
  );
  let barChart = new BarChart(
    { parentElement: "#bar-chart" },
    data,
    selectBreed,
    selectTypeCondition,
    dispatcher
  );
  let heatMap = new HeatMap(
    { parentElement: "#heat-map" },
    data,
    selectBreed,
    selectAge,
    dispatcher
  );
  bubble.updateVis();
  barChart.updateVis();
  heatMap.updateVis();

  d3.selectAll(".legend-btn").on("click", function (event) {
    // toggle status
    d3.select(this).classed("inactive", !d3.select(this).classed("inactive"));

    let selected = [];

    d3.selectAll(".legend-btn:not(.inactive)").each(function (d) {
      selected.push(d3.select(this).attr("data-category"));
    });

    selectedType = selected;

    bubble.data = data.filter((d) => {
      return selected.includes(d.animal_type);
    });

    barChart.data = data.filter((d) => {
      return selected.includes(d.animal_type);
    });

    heatMap.data = data.filter((d) => {
      return selected.includes(d.animal_type);
    });

    // All categories are shown when no categories are active
    if (selected.length == 0) {
      bubble.data = data;
      barChart.data = data;
      heatMap.data = data;
    } else {
      if (selectBreed != null) {
        if (!selected.includes(selectBreed.type)) {
          selectBreed = null;
          barChart.selectBreed = null;
          heatMap.selectBreed = null;
        }
      }
    }

    bubble.updateVis();
    barChart.updateVis();
    heatMap.updateVis();
  });

  dispatcher.on("filterBreed", (breed) => {
    if (breed == null) {
      selectBreed = null;
      barChart.selectBreed = undefined;
      heatMap.selectBreed = undefined;

      if (selectAnimalType.length != 0) {
        barChart.data = data.filter((d) => {
          return selectAnimalType.includes(d.animal_type);
        });
        heatMap.data = data.filter((d) => {
          return selectAnimalType.includes(d.animal_type);
        });
      } else {
        barChart.data = data;
        heatMap.data = data;
      }
      // lines.data = data;
      // lines.data2 = data;
      // lines.selectBreed = undefined;
    } else {
      selectBreed = breed;
      barChart.selectBreed = breed;
      heatMap.selectBreed = breed;
      //lines.selectBreed = breed;

      selectAge = null;
      selectTypeCondition = null;
      //   selectTime = null;

      // unselect all the filters
      heatMap.selectAge = null;
      //   heatMap.selectTime = null;
      barChart.selectTypeCondition = null;
      //   barChart.selectTime = null;
      //   lines.selectAge = null;
      //   lines.selectTypeCondition = null;
    }
    barChart.updateVis();
    heatMap.updateVis();
    //lines.updateVis();
  });

  dispatcher.on("filterAge", (age) => {
    if (age == null) {
      selectAge = null;
      bubble.selectAge = undefined;
      heatMap.selectAge = undefined;

      if (selectAnimalType.length != 0) {
        bubble.data = data.filter((d) => {
          return selectAnimalType.includes(d.animal_type);
        });
        heatMap.data = data.filter((d) => {
          return selectAnimalType.includes(d.animal_type);
        });
      } else {
        bubble.data = data;
        heatMap.data = data;
      }

      // lines.data = data;
      // lines.data2 = data;
      // lines.selectAge = undefined;
    } else {
      selectAge = age;
      bubble.selectAge = age;
      heatMap.selectAge = age;
      //lines.selectAge = age;

      selectBreed = null;
      selectTypeCondition = null;
      //   selectTime = null;

      // unselect all the filters
      heatMap.selectBreed = null;
      //   heatMap.selectTime = null;
      bubble.selectTypeCondition = null;
      //   bubble.selectTime = null;
      //   lines.selectBreed = null;
      //   lines.selectTypeCondition = null;
    }
    bubble.updateVis();
    heatMap.updateVis();
    //lines.updateVis();
  });

  dispatcher.on("filterTypeCondition", (typeCondition) => {
    if (typeCondition == null) {
      selectTypeCondition = null;
      bubble.selectTypeCondition = undefined;
      barChart.selectTypeCondition = undefined;

      if (selectAnimalType.length != 0) {
        bubble.data = data.filter((d) => {
          return selectAnimalType.includes(d.animal_type);
        });
        barChart.data = data.filter((d) => {
          return selectAnimalType.includes(d.animal_type);
        });
      } else {
        bubble.data = data;
        barChart.data = data;
      }

      // lines.data = data;
      // lines.data2 = data;
      // lines.selectTypeCondition = undefined;
    } else {
      selectTypeCondition = typeCondition;
      bubble.selectTypeCondition = typeCondition;
      barChart.selectTypeCondition = typeCondition;
      //lines.selectTypeCondition = typeCondition;

      selectBreed = null;
      selectAge = null;
      //   selectTime = null;

      // unselect all the filters
      barChart.selectBreed = null;
      barChart.selectTime = null;
      bubble.selectAge = null;
      bubble.selectTime = null;
      //   lines.selectBreed = null;
      //   lines.selectAge = null;
    }
    bubble.updateVis();
    barChart.updateVis();
    //lines.updateVis();
  });
});
