describe( 'Legs.CommandMap', function( )
{
  it( 'should be defined', function( )
  {
    expect( Legs.CommandMap ).toBeDefined( );
  } );
  
  it( 'should be a function', function( )
  {
    expect( Legs.CommandMap ).toBeType( 'function' );
  } );
  
  it( 'should be able to be instantiated', function( )
  {
    expect( ( new Legs.CommandMap( ) ) ).toBeType( 'object' );
  } );
  
  it( 'should be an instance of Legs.Class', function( )
  {
    expect( new Legs.CommandMap( ) ).toBeAnInstanceOf( Legs.Class );
  } );
  
  describe( 'instance methods', function( )
  {
    var events;
    var injector;
    var commandMap;
    
    beforeEach( function( )
    {
      events = new Legs.Events( );
      injector = new Legs.Injector( );
      commandMap = new Legs.CommandMap( events, injector );
      
      injector.mapValue( 'events', events );
      injector.mapValue( 'injector', injector );
    } );
    
    describe( 'mapEvent', function( )
    {
      it( 'should be defined', function( )
      {
        expect( commandMap.mapEvent ).toBeType( 'function' );
      } );
      
      it( 'should instantiate a command class when the mapped event is triggered', function( )
      {
        var spy = jasmine.createSpy( );
        
        var Command = Legs.Command.extend( { initialize : spy } );
        
        commandMap.mapEvent( 'test', Command );
        
        events.trigger( 'test' );
        
        expect( spy ).toHaveBeenCalled( );
      } );
      
      it( 'should instantiate a new command instance every time', function( )
      {
        var spy = jasmine.createSpy( );
        
        var Command = Legs.Command.extend( { initialize : spy } );
        
        commandMap.mapEvent( 'test', Command );
        
        events.trigger( 'test' );
        
        var one = spy.mostRecentCall.object;
        
        events.trigger( 'test' );
        
        var two = spy.mostRecentCall.object;
        
        expect( one ).not.toBe( two );
      } );
      
      it( 'should call the commands execute method', function( )
      {
        var spy = jasmine.createSpy( );
        
        var Command = Legs.Command.extend( { execute : spy } );
        
        commandMap.mapEvent( 'test', Command );
        
        events.trigger( 'test' );
        
        expect( spy ).toHaveBeenCalled( );
      } );
      
      it( 'should call the commands execute method in the scope of the command instance', function( )
      {
        var spy = jasmine.createSpy( );
        
        var Command = Legs.Command.extend( { execute : spy } );
        
        commandMap.mapEvent( 'test', Command );
        
        events.trigger( 'test' );
        
        expect( spy.mostRecentCall.object ).toBeAnInstanceOf( Command );
      } );
      
      it( 'should call the commands execute method with all arguments from the trigger', function( )
      {
        var spy = jasmine.createSpy( );
        
        var Command = Legs.Command.extend( { execute : spy } );
        
        commandMap.mapEvent( 'test', Command );
        
        events.trigger( 'test', 123, 'awesome', false );
        
        expect( spy ).toHaveBeenCalledWith( 123, 'awesome', false );
      } );
      
      it( 'should execute the command only once when using oneShot', function( )
      {
        var spy = jasmine.createSpy( );
        
        var Command = Legs.Command.extend( { execute : spy } );
        
        commandMap.mapEvent( 'test', Command, true );
        
        events.trigger( 'test' );
        events.trigger( 'test' );
        events.trigger( 'test' );
        
        expect( spy.callCount ).toEqual( 1 );
      } );
    } );
    
    describe( 'unmapEvent', function( )
    {
      it( 'should be defined', function( )
      {
        expect( commandMap.unmapEvent ).toBeType( 'function' );
      } );
      
      it( 'should unmap a command from triggering on an event type', function( )
      {
        var spy = jasmine.createSpy( );
        
        var Command = Legs.Command.extend( { execute : spy } );
        
        commandMap.mapEvent( 'test', Command );
        
        commandMap.unmapEvent( 'test', Command );
        
        events.trigger( 'test' );
        
        expect( spy ).not.toHaveBeenCalled( );
      } );
    } );
    
  } );
  
  describe( 'command dependencies', function( )
  {
    var events;
    var injector;
    var commandMap;
    
    beforeEach( function( )
    {
      events = new Legs.Events( );
      injector = new Legs.Injector( );
      commandMap = new Legs.CommandMap( events, injector );
      
      injector.mapValue( 'events', events );
      injector.mapValue( 'injector', injector );
    } );
    
    it( 'should use the injector to fill the commands dependencies', function( )
    {
      var Command = Legs.Command.extend(
        {
          execute : function( )
          {
            expect( this.events ).toBe( events );
            expect( this.injector ).toBe( injector );
          }
        } );
      
      commandMap.mapEvent( 'test', Command );
      
      events.trigger( 'test' );
    } );
    
    it( 'should fill custom dependencies on the command', function( )
    {
      injector.mapValue( 'custom', 'sauce' );
      
      var Command = Legs.Command.extend(
        {
          _awesome : 'custom',
          
          execute : function( )
          {
            expect( this.awesome ).toEqual( 'sauce' );
          }
        } );
      
      commandMap.mapEvent( 'test', Command );
      
      events.trigger( 'test' );
    } );
  } );
} );