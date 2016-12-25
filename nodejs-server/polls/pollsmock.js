var exports = module.exports = {};

var test_poll = {
    "id":"new-building",
    "title":"New Building",
    "description":"A new building is proposed to be built in the city centre. Do you want it to be built?",
    "image":"img/feeds/logos/bbc.jpg",
    "published-date":"Mon, 19 Dec 2016 09:58:19 -0500",
    "due-date":"Tue, 20 Dec 2016 09:58:19 -0500"
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.generatePollsJson = function () {
    var categories = ['urbanism', 'finance', 'education'];
    var categories_json = [];
    for(var i = 0; i < categories.length; i++){
        var category = {
            "id":categories[i],
            "title":capitalizeFirstLetter(categories[i]),
            "color":"#63D0FF",
            "polls":[
                test_poll,
                test_poll,
                test_poll
            ]
        }
        categories_json.push(category);
    }
    return JSON.stringify(categories_json);
}
