( ( $ ) ->
  #-----------------------------------
  #  Core
  #-----------------------------------

  Legs = this.Legs = { VERSION : '0.0.2' }

  #-----------------------------------
  #  Class
  #-----------------------------------

  Legs.Class = ( ) ->
    # Set up a placeholder constructor
    this.initialize = ( ) ->

    # Sugar method to proxy another function in this scope
    this.proxy = ( method ) -> $.proxy( method, this )

    # Sugar method to help debug bogus arguments
    this.ensure = ( obj, type, scope ) ->
      if $.type( obj ) != type
        throw new Error "#{scope} expected argument type \"#{type}\" but got \"#{$.type( obj )}\""
    return

  Legs.Class.extend = ( attributes ) ->
    this.initialize = ( ) ->

    # Create the new class
    New = ( ) -> this.initialize.apply( this, arguments )

    # Clone this extend method
    New.extend = this.extend

    # Clone this create method
    New.create = this.create

    # Clone this include method
    New.include = this.include

    # Begin building the prototype off of this class
    prototype = new this( )

    # Set all of the properties on the prototype
    $.extend( true, prototype, attributes )

    # Set the prototype appropriately
    New.prototype = prototype

    # Return the new class
    return New

  Legs.Class.create = ( attributes ) ->
    new ( this.extend( attributes ) )( )

  Legs.Class.include = ( attributes ) ->
    $.extend( true, this.prototype, attributes )

  #-----------------------------------
  #  Events
  #-----------------------------------

  Legs.Events = Legs.Class.extend(
    initialize : ( ) ->
      this.mappings = { }
      this.STARTUP_COMPLETE = 'startup complete'
      return

    callbacks : ( type ) ->
      this.mappings[ type ] || ( this.mappings[ type ] = [ ] )

    bind : ( type, callback ) ->
      this.ensure( type, 'string', 'Legs.Events.bind' )
      this.callbacks( type ).push( callback )

    unbind : ( type, callback ) ->
      this.ensure( type, 'string', 'Legs.Events.unbind' )

      callbacks = this.callbacks( type )
      index     = $.inArray( callback, callbacks )

      callbacks.splice( index, 1 ) if index > -1

    trigger : ( type ) ->
      this.ensure( type, 'string', 'Legs.Events.trigger' )

      args = $.makeArray( arguments )

      $( this.callbacks( args.shift( ) ) ).each(
        ( index, callback ) -> callback.apply( null, args ); return
      )
  )

  #-----------------------------------
  #  Injector
  #-----------------------------------

  Legs.Injector = Legs.Class.extend(
    initialize : ( ) ->
      this.mappings = { }
      return

    mapValue : ( name, value ) ->
      this.mappings[ name ] = ( ( ) -> value )

    mapClass : ( name, clazz ) ->
      this.mappings[ name ] = ( ( ) -> new clazz( ) )

    mapSingleton : ( name, clazz ) ->
      this.mappings[ name ] = ( ( ) ->
        instance = new clazz( )

        this.mapValue( name, instance )

        return instance
      )

    injectInto : ( subject ) ->
      for attribute of subject
        if ( /^_/.test( attribute ) && $.type( subject[ attribute ] ) == 'string' )
          subject[ attribute.substr( 1 ) ] = this.getInstance( subject[ attribute ] )

      return subject

    getInstance : ( name ) ->
      unless this.mappings.hasOwnProperty( name )
        throw new Error "Legs.Injector cannot find any mapping named \"#{name}\"." 

      return this.injectInto( this.mappings[ name ].call( this ) )

    hasMapping : ( name ) ->
      this.mappings.hasOwnProperty( name )
  )

  #-----------------------------------
  #  Base
  #-----------------------------------

  Legs.Base = Legs.Class.extend(
    _events   : 'events'
    _injector : 'injector'
    trigger   : ( ) -> this.events.trigger.apply( this.events, arguments )
  )

  #-----------------------------------
  #  Actor
  #-----------------------------------

  Legs.Actor = Legs.Base.extend( { } )

  #-----------------------------------
  #  Command
  #-----------------------------------

  Legs.Command = Legs.Base.extend(
    execute : ( ) ->
  )

  #-----------------------------------
  #  Command Map
  #-----------------------------------

  Legs.CommandMap = Legs.Class.extend(
    initialize : ( events, injector ) ->
      this.events   = events
      this.injector = injector
      #
      #  TODO add super( ) support to Legs.Class
      #
      this.mappings = { }
      return

    #
    #  TODO create superclass and share this method with Legs.Events
    #
    callbacks : ( type ) ->
      return this.mappings[ type ] || ( this.mappings[ type ] = [ ] )

    mapEvent : ( type, commandClass, oneShot ) ->
      callback = ( ) ->
        command = this.injector.injectInto( new commandClass( ) )

        this.unmapEvent( type, commandClass ) if oneShot == true

        command.execute.apply( command, arguments )

      mapping =
        commandClass : commandClass
        callback     : this.proxy( callback )

      this.callbacks( type ).push( mapping )
      this.events.bind( type, mapping.callback )

    unmapEvent : ( type, commandClass ) ->
      mappings = this.callbacks( type )

      $( mappings ).each( this.proxy( ( index, mapping ) ->
        if mapping.commandClass == commandClass
          mappings.splice( index, 1 )
          this.events.unbind( type, mapping.callback )
      ) )

    hasEventCommand : ( type, commandClass ) ->
      mappings = this.callbacks( type )

      for mapping in mappings
        return true if mapping.commandClass == commandClass

      return false

    execute : ( ) ->
      args         = $.makeArray( arguments )
      commandClass = args.shift( )
      command      = this.injector.injectInto( new commandClass( ) )

      command.execute.apply( command, args )
  )

  #-----------------------------------
  #  Context
  #-----------------------------------

  Legs.Context = Legs.Class.extend(
    contextView : $( document )

    initialize : ( ) ->
      # Merge in any user defined events
      this.events = Legs.Events.create( this.events )
      #
      #  TODO would be nice to have *all* of these use the create( ) factory method
      #
      this.injector   = new Legs.Injector( )
      this.commandMap = new Legs.CommandMap( this.events, this.injector )

      this.startup( )
      this.mapInjections( )
      this.postStartup( ) if this.autoStartup
      return

    startup : ( ) ->

    postStartup : ( ) ->
      this.events.trigger( this.events.STARTUP_COMPLETE )

    autoStartup : true

    mapInjections : ( ) ->
      this.injector.mapValue( 'events', this.events )
      this.injector.mapValue( 'injector', this.injector )
      this.injector.mapValue( 'commandmap', this.commandMap )
      this.injector.mapValue( 'contextview', this.contextView )
  )
)(jQuery)