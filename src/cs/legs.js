(function() {
  (function($) {
    var Legs;
    Legs = this.Legs = {
      VERSION: '0.0.2'
    };
    Legs.Class = function() {
      this.initialize = function() {};
      this.proxy = function(method) {
        return $.proxy(method, this);
      };
      this.ensure = function(obj, type, scope) {
        if ($.type(obj) !== type) {
          throw new Error("" + scope + " expected argument type \"" + type + "\" but got \"" + ($.type(obj)) + "\"");
        }
      };
    };
    Legs.Class.extend = function(attributes) {
      var New, prototype;
      this.initialize = function() {};
      New = function() {
        return this.initialize.apply(this, arguments);
      };
      New.extend = this.extend;
      New.create = this.create;
      New.include = this.include;
      prototype = new this();
      $.extend(true, prototype, attributes);
      New.prototype = prototype;
      return New;
    };
    Legs.Class.create = function(attributes) {
      return new (this.extend(attributes))();
    };
    Legs.Class.include = function(attributes) {
      return $.extend(true, this.prototype, attributes);
    };
    Legs.Events = Legs.Class.extend({
      initialize: function() {
        this.mappings = {};
        this.STARTUP_COMPLETE = 'startup complete';
      },
      callbacks: function(type) {
        return this.mappings[type] || (this.mappings[type] = []);
      },
      bind: function(type, callback) {
        this.ensure(type, 'string', 'Legs.Events.bind');
        return this.callbacks(type).push(callback);
      },
      unbind: function(type, callback) {
        var callbacks, index;
        this.ensure(type, 'string', 'Legs.Events.unbind');
        callbacks = this.callbacks(type);
        index = $.inArray(callback, callbacks);
        if (index > -1) {
          return callbacks.splice(index, 1);
        }
      },
      trigger: function(type) {
        var args;
        this.ensure(type, 'string', 'Legs.Events.trigger');
        args = $.makeArray(arguments);
        return $(this.callbacks(args.shift())).each(function(index, callback) {
          callback.apply(null, args);
        });
      }
    });
    Legs.Injector = Legs.Class.extend({
      initialize: function() {
        this.mappings = {};
      },
      mapValue: function(name, value) {
        return this.mappings[name] = (function() {
          return value;
        });
      },
      mapClass: function(name, clazz) {
        return this.mappings[name] = (function() {
          return new clazz();
        });
      },
      mapSingleton: function(name, clazz) {
        return this.mappings[name] = (function() {
          var instance;
          instance = new clazz();
          this.mapValue(name, instance);
          return instance;
        });
      },
      injectInto: function(subject) {
        var attribute;
        for (attribute in subject) {
          if (/^_/.test(attribute) && $.type(subject[attribute]) === 'string') {
            subject[attribute.substr(1)] = this.getInstance(subject[attribute]);
          }
        }
        return subject;
      },
      getInstance: function(name) {
        if (!this.mappings.hasOwnProperty(name)) {
          throw new Error("Legs.Injector cannot find any mapping named \"" + name + "\".");
        }
        return this.injectInto(this.mappings[name].call(this));
      },
      hasMapping: function(name) {
        return this.mappings.hasOwnProperty(name);
      }
    });
    Legs.Base = Legs.Class.extend({
      _events: 'events',
      _injector: 'injector',
      trigger: function() {
        return this.events.trigger.apply(this.events, arguments);
      }
    });
    Legs.Actor = Legs.Base.extend({});
    Legs.Command = Legs.Base.extend({
      execute: function() {}
    });
    Legs.CommandMap = Legs.Class.extend({
      initialize: function(events, injector) {
        this.events = events;
        this.injector = injector;
        this.mappings = {};
      },
      callbacks: function(type) {
        return this.mappings[type] || (this.mappings[type] = []);
      },
      mapEvent: function(type, commandClass, oneShot) {
        var callback, mapping;
        callback = function() {
          var command;
          command = this.injector.injectInto(new commandClass());
          if (oneShot === true) {
            this.unmapEvent(type, commandClass);
          }
          return command.execute.apply(command, arguments);
        };
        mapping = {
          commandClass: commandClass,
          callback: this.proxy(callback)
        };
        this.callbacks(type).push(mapping);
        return this.events.bind(type, mapping.callback);
      },
      unmapEvent: function(type, commandClass) {
        var mappings;
        mappings = this.callbacks(type);
        return $(mappings).each(this.proxy(function(index, mapping) {
          if (mapping.commandClass === commandClass) {
            mappings.splice(index, 1);
            return this.events.unbind(type, mapping.callback);
          }
        }));
      },
      hasEventCommand: function(type, commandClass) {
        var mapping, mappings, _i, _len;
        mappings = this.callbacks(type);
        for (_i = 0, _len = mappings.length; _i < _len; _i++) {
          mapping = mappings[_i];
          if (mapping.commandClass === commandClass) {
            return true;
          }
        }
        return false;
      },
      execute: function() {
        var args, command, commandClass;
        args = $.makeArray(arguments);
        commandClass = args.shift();
        command = this.injector.injectInto(new commandClass());
        return command.execute.apply(command, args);
      }
    });
    return Legs.Context = Legs.Class.extend({
      contextView: $(document),
      initialize: function() {
        this.events = Legs.Events.create(this.events);
        this.injector = new Legs.Injector();
        this.commandMap = new Legs.CommandMap(this.events, this.injector);
        this.startup();
        this.mapInjections();
        if (this.autoStartup) {
          this.postStartup();
        }
      },
      startup: function() {},
      postStartup: function() {
        return this.events.trigger(this.events.STARTUP_COMPLETE);
      },
      autoStartup: true,
      mapInjections: function() {
        this.injector.mapValue('events', this.events);
        this.injector.mapValue('injector', this.injector);
        this.injector.mapValue('commandmap', this.commandMap);
        return this.injector.mapValue('contextview', this.contextView);
      }
    });
  })(jQuery);
}).call(this);
