require([
    "lib/warren"
],function(
	WarrenGraph
){
    var data = [
        ["Leporidae", "Lepus"],
        ["Lagomorpha", "Leporidae"],
        ["Eutheria", "Lagomorpha"],
        ["Leporidae", "Sylvilagus"],
        ["Sylvilagus", "Sylvilagus insonus"],
        ["Sylvilagus", "Sylvilagus bachmani"],
        ["Sylvilagus", "Sylvilagus palutris"],
        ["Leporidae", "Oryctolagus"]
    ];

    var graphOptions = {
        parentEl: document.getElementById("graph"),
        data: data
    };
    var g = new WarrenGraph(graphOptions);
    document.getElementById('data').innerText = "Data used:\n" + JSON.stringify(data, null, 2);
});
