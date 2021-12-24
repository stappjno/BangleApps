/**
 * 
 * Name: Tschuu
 * Description: App to control LEGO Duplo trains
 * Author: Claudio Götz
 * Version: 0.1
 * Contact: claudio.goetz@gmail.com
 * 
 */
var gatt;
var connected = 0;
var light_on = 1;
var light_color = 5;
var DevName="c4:64:e3:2e:b7:c0";
var serviceUUID="00001623-1212-efde-1623-785feabcd123";
var characteristicUUID="00001624-1212-efde-1623-785feabcd123";
var Characteristic_store;

var speedControl = 0;

var Characteristic_store;

  function search_train() {
  NRF.findDevices(function(devices) {
    
    let foundTrain = "";
    devices.map((device) => {
      if(device && device.services && device.services.includes(serviceUUID)){
        foundTrain = device.id.split(" ", 2)[0];
      }
    });
    
    if(foundTrain !=""){
      DevName = foundTrain;
      E.showMessage("Zug\ngefunden!\n\nVerbinde...");
      connect_train();
    }else{
      search_train();
      E.showMessage("Keinen\nZug gefunden\n\nEvt Zug neu einschalten?\n\nSuchen...");
    }
    
  }, 1000);

}

search_train();

function connect_train() {
  if (connected == 0) {
    NRF.connect(DevName).then(function(g) {
      console.log("Connecting...");
      gatt = g;
      return gatt.getPrimaryService(serviceUUID);
    }).then(function(service) {
      return service.getCharacteristic(characteristicUUID);
    }).then(function(characteristic) {
      Characteristic_store = characteristic;
        return characteristic.readValue();
      }).then(value => {
        console.log(value);
    }).then(function() {
      console.log("Train Connected");
      connected = 1;
      
      E.showMessage("Zug\nVERBUNDEN!");
      setTimeout(()=>{      
        light_color=1;
        light_state(true);
      },100);
      setTimeout(()=>{      
        light_color=10;
        light_state(true);
      },200);

      
      setTimeout(()=>E.showMenu(mainmenu), 1000);
  }, function(e){
      E.showMessage("Zug\nnicht\nverbunden.\n\nNeustart.");
      setTimeout(()=>restartOnError(), 1000);
    });
  }
}

function disconnect_train(){
    gatt.disconnect();
    E.showMessage("Zug\ngetrennt.");
    connected = 0;
}

function restartOnError(){
  connected = 0;
  E.showMessage("Neue Suche\nstartet...");
  setTimeout(()=>search_train(), 2000);
}

function play_horn() {
  //console.log("message = ", Characteristic_store);
  const prepval = new Uint8Array([0x0a, 0x00, 0x41, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x01]);
  const sendvalue = new Uint8Array([0x08, 0x00, 0x81, 0x01, 0x11, 0x51, 0x01, 0x09]);

  Characteristic_store.writeValue(prepval)
  .then(_ => {
    Characteristic_store.writeValue(sendvalue);
  }, function(e){
      E.showMessage("Zug\nnicht\nverbunden.\n\nNeustart.");
      setTimeout(()=>restartOnError(), 1000);
    });
}


function light_state(alwaysOn) {
  //console.log("message = ", Characteristic_store);
  const prepval = new Uint8Array([0x0a, 0x00, 0x41, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x01]);
  if (light_on == 0 || alwaysOn) {
    /*
    * 0 = Ausschalten
    * 1 = Pink
    * 2 = Violett
    * 3 = Blau (wie Pairing)
    * 4 = Hellblau
    * 5 = Türkis
    * 6 = Grün
    * 7 = Gelb
    * 8 = Orange
    * 9 = Rot
    * 10 = Weiss
    */
    const sendvalue = new Uint8Array([8, 0, 129, 17, 17, 81, 0, light_color]);
    light_on = 1;
  } else {
    const sendvalue = new Uint8Array([8, 0, 129, 17, 17, 81, 0, 0]);
    light_on = 0;
  }
  
  Characteristic_store.writeValue(prepval)
  .then(_ => {
    Characteristic_store.writeValue(sendvalue);
  }, function(e){
      E.showMessage("Zug\nnicht\nverbunden.\n\nNeustart.");
      setTimeout(()=>restartOnError(), 1000);
    });
}

function fill_water() {
  //console.log("message = ", Characteristic_store);
  const prepval = new Uint8Array([0x0a, 0x00, 0x41, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x01]);
  const sendvalue = new Uint8Array([0x08, 0x00, 0x81, 0x01, 0x11, 0x51, 0x01, 0x07]);

  Characteristic_store.writeValue(prepval)
  .then(_ => {
    Characteristic_store.writeValue(sendvalue)
    .then(_ => {
      console.log(sendvalue);
    }, function(e){
      E.showMessage("Zug\nnicht\nverbunden.\n\nNeustart.");
      setTimeout(()=>restartOnError(), 1000);
    });
  }, function(e){
      E.showMessage("Zug\nnicht\nverbunden.\n\nNeustart.");
      setTimeout(()=>restartOnError(), 1000);
    });
}

function train_controlMovement(direction, speed) {
  
  // set to stop
  let speedValue = 0;
  
  if(direction == "forward"){
    speedValue = speed;
  }else if(direction == "backward"){
    speedValue = 256 - speed;
  }
  //console.log("message = ", Characteristic_store);
  const prepval = new Uint8Array([10, 0, 65, 1, 1, 1, 0, 0, 0, 1]);

  // forward: 0-28 (too slow to move with friction)
  // forward: 28 (slow) to 100 (fastest)
  // stop: 101 - 155
  // backward: 156 (fastest) to 226 (slowest)
  // backward: 227 - 255 (too slow to move with friction)
  
  const sendvalue = new Uint8Array([8, 0, 129, 0, 1, 81, 0, speedValue]);
  console.log("move!", direction, speed);  
  Characteristic_store.writeValue(prepval)
  .then(_ => {
    Characteristic_store.writeValue(sendvalue);
  }, function(e){
      E.showMessage("Zug\nnicht\nverbunden.\n\nNeustart.");
      setTimeout(()=>restartOnError(), 1000);
    });
}

//connect_train();


//setWatch(() => {

  //speedControl = 0;
  //train_controlMovement("stop",0);
  
  //E.showMessage("Stop!\nNOW!");
  //setTimeout(()=>g.clear(), 1000);
//}, BTN, {repeat:true});


// First menu
var mainmenu = {
  "" : {
    "title" : "-- Tschuu --"
  },
  "Licht" : function() { light_state(false); },
  "Wasser" : function() { fill_water(); },
  "Horn" : function() { play_horn(); },
  "Speed" : {
    value : speedControl,
    min:-80,max:80,step:10,
    onchange : v => { 
      speedControl=v; 
      if(speedControl<-5){
        train_controlMovement("backward",Math.abs(speedControl-20));
      }else if(speedControl == 0){
        train_controlMovement("stop",0);
      }else if(speedControl > 5){
        train_controlMovement("forward",speedControl+20);
      }
    }
  },
  "Lichtfarbe" : {
    value : light_color,
    min:1,max:10,step:1,
    onchange : v => { 
      light_color=v;
      light_state(true);
    }
  },
  //"Schliessen" : function() { E.showMenu(); },
};