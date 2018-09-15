/*
  Meowbot Arduino Code

  github.com/jefforulez/meowbot

  Based on:
  Arduino Yun Bridge example
  http://www.arduino.cc/en/Tutorial/Bridge

*/

#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>

BridgeServer server;

int MeowControl = 5 ;
int MeowEyes = 13 ;
int MeowDefaultMilliseconds = 1000 ;

void setup() {

  pinMode( MeowEyes, OUTPUT ) ;
  digitalWrite( MeowEyes, HIGH ) ;
  Bridge.begin() ;
  digitalWrite( MeowEyes, LOW ) ;

  server.listenOnLocalhost();
  server.begin();

  pinMode( MeowControl, OUTPUT );
  meow( MeowDefaultMilliseconds ) ;
}

void loop() {
  BridgeClient client = server.accept();

  if (client) {
    process(client);
    client.stop();
  }

  delay(50);
}

void process(BridgeClient client) {
  String command = client.readStringUntil('/');

  if ( command == "meow" )
  {
    int ms = client.parseInt();
    if ( ms < 1000 ) {
       ms = MeowDefaultMilliseconds ;
    }

    meow( ms ) ;

    client.print(F("meow "));
    client.println( ms ) ;

    return ;
  }

  if ( command == "meowWithSound" )
  {
    int ms = client.parseInt();
    if ( ms < 1000 ) {
       ms = MeowDefaultMilliseconds ;
    }

    meowWithSound( ms ) ;

    client.print(F("meowWithSound "));
    client.println( ms ) ;

    return ;
  }

  client.println(F("usage: /arduino/meow/$MILLISECONDS"));
}

void meow( int ms ) {

  int blink_delay = 100 ;
  int blinks = ms / blink_delay ;

  for ( int i = 0 ; i < blinks ; ++i )
  {
    digitalWrite( MeowEyes, HIGH ) ;
    delay( blink_delay / 2 ) ;
    digitalWrite( MeowEyes, LOW ) ;
    delay( blink_delay / 2 ) ;
  }

}

void meowWithSound( int ms ) {

  int blink_delay = 100 ;
  int blinks = ms / blink_delay ;

  // start audio
  digitalWrite( MeowControl,HIGH) ;

  for ( int i = 0 ; i < blinks ; ++i )
  {
    digitalWrite( MeowEyes, HIGH ) ;
    delay( blink_delay / 2 ) ;
    digitalWrite( MeowEyes, LOW ) ;
    delay( blink_delay / 2 ) ;
  }

  // stop audio
  digitalWrite( MeowControl,LOW) ;

  for ( int i = 0 ; i < blinks ; ++i )
  {
    digitalWrite( MeowEyes, HIGH ) ;
    delay( blink_delay / 2 ) ;
    digitalWrite( MeowEyes, LOW ) ;
    delay( blink_delay / 2 ) ;
  }

}

