/*
  Arduino Yun Bridge example

  This example for the YunShield/YÃºn shows how 
  to use the Bridge library to access the digital and
  analog pins on the board through REST calls.
  It demonstrates how you can create your own API when
  using REST style calls through the browser.

  Possible commands created in this shetch:

  "/arduino/digital/13"     -> digitalRead(13)
  "/arduino/digital/13/1"   -> digitalWrite(13, HIGH)
  "/arduino/analog/2/123"   -> analogWrite(2, 123)
  "/arduino/analog/2"       -> analogRead(2)
  "/arduino/mode/13/input"  -> pinMode(13, INPUT)
  "/arduino/mode/13/output" -> pinMode(13, OUTPUT)

  This example code is part of the public domain

  http://www.arduino.cc/en/Tutorial/Bridge

*/

#include <Bridge.h>
#include <BridgeServer.h>
#include <BridgeClient.h>

// Listen to the default port 5555, the YÃºn webserver
// will forward there all the HTTP requests you send
BridgeServer server;

int MeowControl = 5 ;
int MeowDefaultMilliseconds = 1000 ; 

void setup() {
 
  // Bridge startup
  pinMode(13, OUTPUT);
  digitalWrite(13, HIGH);
  Bridge.begin();
  digitalWrite(13, LOW);

  // Listen for incoming connection only from localhost
  // (no one from the external network could connect)
  server.listenOnLocalhost();
  server.begin();

  // declare pin 5 to be an output
  pinMode( MeowControl, OUTPUT );
  meow( MeowDefaultMilliseconds ) ;
}

void loop() {
  // Get clients coming from server
  BridgeClient client = server.accept();

  // There is a new client?
  if (client) {
    // Process request
    process(client);

    // Close connection and free resources.
    client.stop();
  }

  delay(50); // Poll every 50ms
}

void process(BridgeClient client) {
  // read the command
  String command = client.readStringUntil('/');

  if ( command == "meow" ) 
  {
    int ms = client.parseInt();
    if ( ms < 1000 ) {
       ms = MeowDefaultMilliseconds ;
    }
   
    meow( ms ) ;

    // Send feedback to client
    client.print(F("meow "));
    client.println( ms ) ;

    return ;
  }

    // Send feedback to client
    client.println(F("usage: /arduino/meow/$MILLISECONDS"));
}

void meow( int ms ) {

  digitalWrite( 13, HIGH ) ;
  digitalWrite( MeowControl,HIGH) ;
  
  delay( ms ) ;
  
  digitalWrite( MeowControl,LOW) ;
  digitalWrite( 13, LOW ) ;

}
