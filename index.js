const CSVToJSON = require("csvtojson");
const JSONToCSV = require("json2csv").parse;
const FileSystem = require("fs");

// Invoking csv returns a promise
const converter = CSVToJSON()
  .fromFile("./volunteer_attendance_data.csv")
  .then(json => {
    const dateArray = [];
    const shiftArray = [];

    json.forEach(data => {
      dateArray.push(data.date);
      shiftArray.push(data.shift);
    });

    const uniqueDate = dateArray.reduce((a, b) => {
      if (a.indexOf(b) < 0) a.push(b);
      return a;
    }, []);

    const uniqueShift = shiftArray.reduce((a, b) => {
      if (a.indexOf(b) < 0) a.push(b);
      return a;
    }, []);

    const filteredDate = []

    uniqueDate.forEach(function (data) {
      filteredDate.push(json.filter(function (item) {
        return item.date === data;
      }));
    });

    const filteredShift = []

    for (let i = 0; i < filteredDate.length; i++) {
      uniqueShift.forEach(function (data) {
        filteredShift.push(filteredDate[i].filter(function (item) {
          return item.shift === data;
        }));
      });
    };

    const shiftArr = [];

    filteredShift.forEach(data => {
      if (data.length !== 0) {
        shiftArr.push(data);
      }
    });

    const name = shiftArr.map(data =>
      data.map(item =>
        item.volunteerName
      )
    );

    function pairwise(list) {
      if (list.length < 2) { return []; }
      const first = list[0],
        rest = list.slice(1),
        pairs = rest.map(function (data) { return [first, data]; });
      return pairs.concat(pairwise(rest));
    };

    const pairResult = [];

    name.forEach(pairName => {
      const pairFind = pairwise(pairName);
      pairResult.push(pairFind);
    });

    const result = pairResult.flat();

    const obj = result.map(data => {
      //Sorting array of string
      data.sort((a, b) =>
        a.localeCompare(b) //Using String.prototype.localCompare()
      );
      return { node: data }
    });

    const hashMap = {};

    for (let weight of obj) {
      //if that node exists
      if (weight.node in hashMap) {
        //up the prev count
        hashMap[weight.node] = hashMap[weight.node] + 1;
      } else {
        hashMap[weight.node] = 1;
      }
    };

    //Iterate through those keys of the map and format it for outputArray
    const outputArray = [];
    Object.keys(hashMap).forEach(key => {
      outputArray.push({
        node: key,
        count: hashMap[key]
      })
    });

    const output = [];
    outputArray.forEach(data => {
      const dataSplit = data.node.split(',');
      output.push({
        node1: dataSplit[0],
        node2: dataSplit[1],
        weight: data.count
      });
    });

    console.table(output);

    const csv = JSONToCSV(output, { fields: ["node1", "node2", "weight"] });
    FileSystem.writeFileSync("./output.csv", csv);
  }
);
