function Controller() {
    this.model = new Model(Model.prototype.glennDbConfig);
    this.addSubmitHandler();
}

Controller.prototype.addSubmitHandler = function() {
    let that = this;
    $("#trainForm").submit(function(e) {
        e.preventDefault();
        that.processForm();
    });
}

Controller.prototype.processForm = function() {
    this.getData();
    this.clearForm();
    this.model.dbPushRecord();
}

Controller.prototype.getData = function() {
    let name = $("#trainName").val();
    let destination = $("#destination").val();
    let trainTime = $("#trainTime").val();
    let frequency = $("#frequency").val();

    // Update model with form data.
    this.model.setData(name, destination, trainTime, frequency);
}

Controller.prototype.clearForm = function() {
    $("#trainName").val('');
    $("#destination").val('');
    $("#trainTime").val('');
    $("#frequency").val('');
}

function Model(dbConfig) {
    this.dbConfig = dbConfig;
    this.dbInit();
    this.dbRef = this.getDbRef();
    this.addDbListener('child_added');
}
Model.prototype.name = "";
Model.prototype.destination = "";
Model.prototype.trainTime = "";
Model.prototype.frequency = "";
Model.prototype.calcData = {
    "nextArrival": 0,
    "minutesAway": 0
};
Model.prototype.dbConfig = {};
Model.prototype.glennDbConfig = {
    apiKey: "AIzaSyA_OqIBpJrkuthZcV4Xmfl3RbGrzcm1lcc",
    authDomain: "train-schedule-41ef7.firebaseapp.com",
    databaseURL: "https://train-schedule-41ef7.firebaseio.com",
    projectId: "train-schedule-41ef7",
    storageBucket: "",
    messagingSenderId: "652948785727"
};

Model.prototype.setData = function(name, destination, trainTime, frequency) {
    this.name = name;
    this.destination = destination;
    this.trainTime = trainTime;
    this.frequency = frequency;
}

Model.prototype.getData = function() {
    results = {};
    results.name = this.name;
    results.destination = this.destination;
    results.trainTime = this.trainTime;
    results.frequency = this.frequency;
    return results;
}

Model.prototype.dbInit = function() {
    console.log(this.dbConfig);
    firebase.initializeApp(this.dbConfig);
}

Model.prototype.getDbRef = function(childNode) {
    return firebase.database().ref(childNode);
}

Model.prototype.dbPushRecord = function() {
    console.log("Adding ", this.name);
    if (this.validInputData()) {
        this.dbRef.push({
            "name": this.name,
            "destination": this.destination,
            "trainTime": this.trainTime,
            "frequency": this.frequency
        });
    } else {
        console.log("Model.dbPushRecord: Invalid input data. Ignoring");
    }
}

Model.prototype.validInputData = function() {
    return (this.name && this.destination && this.trainTime && this.frequency);
}

Model.prototype.addDbListener = function(dbEvent = 'child_added') {
    let that = this;
    this.dbRef.on(dbEvent, function(childSnapshot) {
        console.log("child_added, updating view");
        let trainData = childSnapshot.val();
        console.log("addDbListener ", trainData);
        that.calcData = that.calcTimes(trainData);
        that.updateView(trainData);
    });
}

Model.prototype.updateView = function(dbData) {
    $("#tableBody").append(
        `<tr scope="row"></tr>
        <td>${dbData.name}</td> 
        <td>${dbData.destination}</td> 
        <td>${dbData.frequency}</td> 
        <td>${this.calcData.nextArrival}</td> 
        <td>${this.calcData.minutesAway}</td>`
    );
}

Model.prototype.calcTimes = function(trainData) {
    results = {};
    m = moment(trainData.trainTime, 'HH:mm');
    current = moment();
    while (m.valueOf() < current.valueOf()) {
        m.add(trainData.frequency, 'minutes');
    }
    results.nextArrival = m.format('hh:mm A');
    results.minutesAway = m.diff(current.subtract(1, 'minute'), 'minutes');
    return results;
}
