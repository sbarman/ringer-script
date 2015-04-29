// create closure
// (function() {
  'use strict'

  // list of all traces to use as recordings 
  var allTraces = [];
  // list of scripts (processed traces)
  var allScripts = [];
  // list of all script ids
  var allIds = [];

  function loadTraces() {
    // load scripts from storage
    chrome.storage.local.get("allTraces", function(obj){
      if (obj && 'allTraces' in obj) {
        console.log(obj);
        allTraces = JSON.parse(obj.allTraces);
      }
      addTraces(allTraces);
    });
  }

  function saveTraces() {
    chrome.storage.local.set({"allTraces": JSON.stringify(allTraces)});
  }

  function setUp(){
    // apply jQuery UI theme on the buttons
    $("button").button(); 
    $("#start_recording").click(startRecording);
    $("#done_recording").click(doneRecording);
    $("#start_script").click(runScript);
  
    $("#script_text").val(
        "var parameterizedTrace = scripts[0].parameterizedTrace;\n" +
        "console.log(parameterizedTrace.getConfig());\n" +
        "parameterizedTrace.useFrame('frame', msg.frame_id);\n" +
        "var standard_trace = parameterizedTrace.getStandardTrace();\n" +
        "var config = parameterizedTrace.getConfig();\n" +
        "console.log(standard_trace,config);\n" +
        "SimpleRecord.replay(standard_trace, config);\n");

    loadTraces();
  }
  
  // run when the dom has finished loading
  $(setUp);

  function addTraces(traceList){
    traceList.forEach(function(t) {
      addTrace(t);
    });
  }
  
  function addTrace(trace) {
    allTraces.push(trace);
    saveTraces();

    trace = sanitizeTrace(trace);
    // console.log("trace:", trace);
    var parameterizedTrace = new ParameterizedTrace(trace);
    // console.log("paramaterized:", parameterizedTrace);
  
    var domEvents = _.filter(trace, function(obj){return obj.type === "dom";});
    var firstEvent = domEvents[0];
    var url = firstEvent.frame.URL;

    var id = getNewId(url, allIds);

    var script = {
      id: id,
      url: url,
      parameterizedTrace: parameterizedTrace,
    };

    allScripts.push(script);
    allIds.push(id);
 
    var removeButton = $('<button>Remove</button>');
    removeButton.button();
    removeButton.click(function() {removeScript(id);});

    var newDiv = $('<div>' + id + ":" + url + '</div>');
    newDiv.attr('id', id);
    newDiv.prepend(removeButton);
    $("#recordings").append(newDiv);
  }

  function getNewId(url, takenIds) {
    var blackList = ['www', 'http', 'com'];

    var id = "";
    var uri = URI(url);
    var domain = uri.domain()
    id = domain.split('.')[0];

    if (!id)
      id = "script";

    if (takenIds.indexOf(id) >= 0) {
      var index = 1;
      while (takenIds.indexOf(id + index) >= 0) {
        index++;
      }
      id = id + index;
    }

    return id;
  }

  function sanitizeTrace(trace){
    var sanitizedTrace = _.filter(trace, function(obj){
      return obj.state !== "stopped";
    });
    return sanitizedTrace;
  }

  function removeScript(id) {
    // TODO 
  }

  function runScript(){
    var text = $('#script_text').val();
    console.log(text);
    setTimeout(function() {
      var ids = loadScripts();
      eval(text);
      removeScripts(ids);
    },0);
  }

  function loadScripts() {
    var ids = [];
    allScripts.forEach(function(script) {
      window[script.id] = script.parameterizedTrace;
      ids.push(script.id);
    });
    return ids;
  }

  function removeScripts(ids) {
    ids.forEach(function(id) {
      if (id in window) {
        delete window[id];
      }
    });
  }
  
  function startRecording(){
    SimpleRecord.startRecording();
  }
  
  function doneRecording(){
    var trace = SimpleRecord.stopRecording();
    addTrace(trace);
  }
// })();


  
  
  // var currently_edited_script = null;
  // function editScript(script){
  //   currently_edited_script = script;
  //   document.getElementById("editing_controls").style.display = "inherit";
  //   displayScriptParameters(script);
  // }
  // 
  // function displayScriptParameters(script){
  //   var params = script.params;
  //   var paramsDiv =  $("#string_parameters").html("");
  //   for (var i = 0; i<params.length; i++){
  //     var param = params[i];
  //     var newDiv = $('<div>'+param.name+': <input type="text" class="stringParamName" id="'+param.name+'" placeholder="'+param.curr_value+'"><button class="update_params">Update</button></div>');
  //     paramsDiv.append(newDiv);
  //   }
  //   $(".update_params").click(updateParameters);
  // }
  // 
  // function makeNewStringParam(){
  //   var name = $("#newStringParamName").val();
  //   var original_value = $("#originalString").val();
  //   console.log(name, original_value);
  //   currently_edited_script.params.push({name:name,curr_value:""});
  //   currently_edited_script.parameterized_trace.parameterizeTypedString(name, original_value);
  //   displayScriptParameters(currently_edited_script); //show the new param which now needs to be set
  // }
  // 
  // function updateParameters(){
  //   var paramsDivs =  $(".stringParamName").html("");
  //   console.log(paramsDivs);
  //   var params = [];
  //   for (var i = 0; i<paramsDivs.length; i++){
  //     var paramDiv = $(paramsDivs[i]);
  //     console.log(paramDiv);
  //     var name = paramDiv.attr('id');
  //     console.log(name);
  //     var new_value = paramDiv.val();
  //     params.push({name:name,curr_value:new_value});
  //     currently_edited_script.parameterized_trace.useTypedString(name, new_value);
  //   }
  //   currently_edited_script.params = params;
  // }
   
