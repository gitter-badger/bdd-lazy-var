(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){module.exports=require("./lib/interface/mocha/bdd_global_var")},{"./lib/interface/mocha/bdd_global_var":5}],2:[function(require,module,exports){var prop=require("./symbol").for;var lazyVarsPropName=prop("__lazyVars");function defineGetter(context,varName,options){options=options||{};var accessorName=(options.getterPrefix?options.getterPrefix:"")+varName;var varContext=options.defineOn||context;var vars=varContext[lazyVarsPropName]||{};if(!varContext[lazyVarsPropName]){varContext[lazyVarsPropName]=vars}if(accessorName in vars){return}if(accessorName in varContext){throw new Error(['Cannot create lazy variable "',varName,'" as variable with the same name exists on the provided context'].join(""))}vars[accessorName]=true;Object.defineProperty(varContext,accessorName,{configurable:true,get:function(){return context.get(varName)}})}module.exports=defineGetter},{"./symbol":7}],3:[function(require,module,exports){var lazyVar=require("./lazy_var");var Symbol=require("./symbol");var currentlyRetrievedVarField=Symbol.for("__definesVariable");function cleanUp(){lazyVar.cleanUp(this)}function getParentContextFor(varName,testContext){var metadata=lazyVar.metadataFor(testContext,varName);if(!metadata||!metadata.parent){throw new Error('Unknown parent variable "'+varName+'".')}return metadata.parent}function defaultOptions(options){options.suite=options.suite||"describe";options.setupSuite=options.setupSuite||"before";options.teardownSuite=options.teardownSuite||"after";options.setup=options.setup||"beforeEach";options.teardown=options.teardown||"afterEach";return options}function VariableContext(varName,context){this.name=varName;this.context=context;this.ownContext=context}VariableContext.prototype.isSame=function(anotherVarName){return this.name&&(this.name===anotherVarName||lazyVar.metadataFor(this.ownContext,this.name).hasAlias(anotherVarName))};VariableContext.EMPTY=new VariableContext(null,null);module.exports=function(context,state,options){options=defaultOptions(options||{});context.subject=function(name,definition){if(arguments.length===1){return context.def("subject",name)}else if(arguments.length===2){return context.def([name,"subject"],definition)}return context.get("subject")};context.get=function(varName){var testContext=state.currentTestContext;var variable=testContext[currentlyRetrievedVarField]||VariableContext.EMPTY;if(variable.isSame(varName)){var prevContext=variable.context;try{variable.context=getParentContextFor(varName,variable.context);return variable.context[varName]}finally{variable.context=prevContext}}try{testContext[currentlyRetrievedVarField]=new VariableContext(varName,testContext);return testContext[varName]}finally{delete testContext[currentlyRetrievedVarField]}};context.def=function(varName,definition){var suite=state.currentlyDefinedSuite;if(Array.isArray(varName)){context.def(varName[0],definition);return defineAliasesFor(suite,varName[0],varName.slice(1))}lazyVar.register(suite.ctx,varName,definition,getCurrentContext);detectParentDeclarationFor(suite,varName)};context.get.definitionOf=context.get.variable=function(varName){return context.get.bind(context,varName)};var suite=context[options.suite];context[options.suite]=function(title,runTests){return suite(title,function(){var previousDefinedSuite=state.currentlyDefinedSuite;state.currentlyDefinedSuite=this;context[options.setupSuite](registerSuite);context[options.setup](registerSuite);context[options.teardown](registerSuite);context[options.teardownSuite](registerSuite);runTests.apply(this,arguments);context[options.setupSuite](cleanUp);context[options.teardown](cleanUp);context[options.teardownSuite](cleanUp);state.currentlyDefinedSuite=previousDefinedSuite})};function registerSuite(){state.currentTestContext=this}function getCurrentContext(){return state.currentTestContext}function detectParentDeclarationFor(suite,varName){if(suite.parent&&lazyVar.isDefined(suite.parent.ctx,varName)){lazyVar.metadataFor(suite.ctx,varName).parent=suite.parent.ctx}if(typeof options.onDefineVariable==="function"){options.onDefineVariable(suite,varName,context)}}function defineAliasesFor(suite,varName,aliases){aliases.forEach(function(alias){lazyVar.registerAlias(suite.ctx,varName,alias);detectParentDeclarationFor(suite,alias)})}}},{"./lazy_var":6,"./symbol":7}],4:[function(require,module,exports){(function(global){var Mocha=typeof window!=="undefined"?window["Mocha"]:typeof global!=="undefined"?global["Mocha"]:null;var injectLazyVarInterface=require("../interface");function addInterface(rootSuite,options){var state={currentlyDefinedSuite:rootSuite};rootSuite.on("pre-require",function(context){var describe=context.describe;injectLazyVarInterface(context,state,options);context.describe.skip=function(title,fn){return describe.skip(title,function(){state.currentlyDefinedSuite=this;fn.apply(this,arguments)})};context.context=context.describe;context.context.only=context.describe.only=describe.only;context.xdescribe=context.xcontext=context.context.skip=context.describe.skip})}module.exports={createUi:function(name,options){options=options||{};options.inheritUi=options.inheritUi||"bdd";var ui=Mocha.interfaces[name]=function(rootSuite){Mocha.interfaces[options.inheritUi](rootSuite);return addInterface(rootSuite,options)};return ui}}}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"../interface":3}],5:[function(require,module,exports){var interfaceBuilder=require("../mocha");var defineGetterOnce=require("../../define_var");module.exports=interfaceBuilder.createUi("bdd-lazy-var/global",{onDefineVariable:function(suite,varName,context){defineGetterOnce(context,varName,{getterPrefix:"$"})}})},{"../../define_var":2,"../mocha":4}],6:[function(require,module,exports){var lazyVarsPropName=require("./symbol").for("__lazyVars");function VariableMetadata(definition,thisContext){this.value=definition;this.parent=null;this.aliases=null;if(typeof thisContext==="function"){Object.defineProperty(this,"context",{get:thisContext})}else{this.context=thisContext}}VariableMetadata.prototype.addAlias=function(name){this.aliases=this.aliases||{};this.aliases[name]=true};VariableMetadata.prototype.hasAlias=function(name){return this.aliases&&this.aliases[name]};VariableMetadata.prototype.buildAliasMetadata=function(aliasName){var aliasMetadata=new VariableMetadata(null,null);aliasMetadata.aliases=this.aliases;this.addAlias(aliasName);return aliasMetadata};var lazyVar={register:function(context,name,definition,thisContext){var hasOwnVariable=context.hasOwnProperty(name)&&context.hasOwnProperty(lazyVarsPropName);if(hasOwnVariable&&lazyVar.isDefined(context,name)){throw new Error('Cannot define "'+name+'" variable twice in the same suite.')}var metadata=lazyVar.metadataFor(context);metadata.defs[name]=new VariableMetadata(definition,thisContext||context);lazyVar.defineProperty(context,name,metadata)},metadataFor:function(context,varName){if(!context.hasOwnProperty(lazyVarsPropName)){var lazyVarsInPrototype=context[lazyVarsPropName]?context[lazyVarsPropName].defs:null;context[lazyVarsPropName]={defs:Object.create(lazyVarsInPrototype),created:{}}}return arguments.length===2?context[lazyVarsPropName].defs[varName]:context[lazyVarsPropName]},defineProperty:function(context,name,metadata){Object.defineProperty(context,name,{configurable:true,get:function(){if(!metadata.created.hasOwnProperty(name)){var definition=metadata.defs[name];var value=definition.value;metadata.created[name]=typeof value==="function"?value.call(definition.context):value}return metadata.created[name]}})},registerAlias:function(context,varName,aliasName){var metadata=lazyVar.metadataFor(context);metadata.defs[aliasName]=metadata.defs[varName].buildAliasMetadata(aliasName);metadata.defs[aliasName].addAlias(varName);Object.defineProperty(context,aliasName,{get:function(){return this[varName]}})},isDefined:function(context,name){var hasLazyVars=context&&context[lazyVarsPropName];return!!(hasLazyVars&&context[lazyVarsPropName].defs[name])},cleanUp:function(context){if(context.hasOwnProperty(lazyVarsPropName)){context[lazyVarsPropName].created={}}}};module.exports=lazyVar},{"./symbol":7}],7:[function(require,module,exports){var indentity=function(value){return value};module.exports={"for":typeof Symbol==="undefined"?indentity:Symbol.for}},{}]},{},[1]);
