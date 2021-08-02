//BLUECITY_ARDUINO_I2c_SLAVE


//AGREGANDO LIBRERIAS
#include <Wire.h>
//LIBRERIA DEL SERVO, QUE SERA ELIMINADA EN EL DESPLIGUE EN EL ENTORNO REAL
#include <Servo.h> 



//INICIALIZANDO VARIABLES GLOBALES

//############ SETEANDO PINES!!!!!###################################

//ON-OFF COMPLETO DEL BOX, pero NO de arduino, asi que podremos activarlo cuando queramos
int boxPower = 3; //ACTIVAR-DESACTIVAR CORRIENTE DEL BOX

//ON-OFF del CARGADOR DEL BOX
int chargerPower = 4; //ACTIVAR-DESACTIVAR CORRIENTE DEL CARGADOR

//LEDS
int freeLed = 12; //Declarando como 12 para usar nombre para referirnos al pin 12
int reservedLed = 11; //Declarando como 11 para usar nombre para referirnos al pin 11
int occupiedLed = 10; //Declarando como 10 para usar nombre para referirnos al pin 10

//CERRADURA
int deadlock = 9; //Cerradura

//SENSORES
int doorSensor = 7 ;//Sensor de presencia de la Puerta
int scooterSensor = 6; //Sensor de presencia de la patineta


///#########################################
//PARA MI EMULADOR FISICO, EMPLEARE UN SERVO, PARA EMULAR LA CERRADURA,
//Y UN LED en el PIN CORRESPONDIENTE A LA CERRADURA que se encendera o apagra, 
// este actua como lo hara en la realidad, ALIMENTANDO O NO AL ELECTROMIMAN.
Servo myservo;  // create servo object to control a servo 
// a maximum of eight servo objects can be created 

int pos = 0;    // variable to store the servo position 
// ###########################################


//##########ESTABLECIENDO VARIABLES GLOBALES ########################################

//Este RESPONSECode, es el codigo a traves del cual sabremos el estado de nuestro BOX 
String RESPONSEcode="000"; //CODIGO de ESTADO QUE SERA DEVUELTO A LA "Rpi" (3bytes)

//ESTE COMMAND, es el codigo que RECIBIMOS DE LA "Rpi" con la accion a realizar
char command; //COMANDO QUE SE RECIBE DESDE LA "Rpi"(I2C_Master)

String mssg =""; //MENSAJE QUE ALMACENAREMOS DEL MASTER I2C, SE UTILIZA PARA SETEAR LOS "milisegundos" DE DELAYS de apertura Y cierre DE LA PEURTA

boolean doorStateChanged = false; //Variable que determina si la puerta se ha abierto

//TEMPORIZADOR con "MILLIS" para controlar el tiempo de apertura y cierre de la puerta
unsigned long intervalDoorOpened = 2000;//Tiempo minimo de apertura de puerta
unsigned long intervalDoorClosed = 1000; //Tiempo minimo de cierre de puerta
unsigned long oldTime=0;
unsigned long actualTime;
boolean firstTime = true;
//#################################################################



//******************************************************************
//DECLARANDO e INICIALIZANDO PINES, EVENTOS y OTROS
void setup()
{
  //INICIALIZANDO I2C_SLAVE (address, and events Receive and Request)
  Wire.begin(15);                // join i2c bus with address #4
  Wire.onReceive(receiveEvent); // register event
  Wire.onRequest(requestEvent); // register event

    //Inicializando SERIAL PARA LECTURA DE DATOS "Debug"
  Serial.begin(9600);           // start serial for output

  //INICIALIZANDO BOX ¡¡APAGADOO!!
  pinMode(boxPower, OUTPUT); 
  digitalWrite(boxPower,HIGH);//Es al a inversa HIGH es apagado, LOW encendido

  //INICIALIZANDO CARGADOR ¡¡APAGADOO!! SOLO SE ENCENDERA SI ESTA OCUPADO
  pinMode(chargerPower, OUTPUT); 
  digitalWrite(chargerPower,HIGH);//Es al a inversa HIGH es apagado, LOW encendido

  //INICIALIZANDO LEDs de ESTADO DEL BOX
  pinMode(freeLed, OUTPUT); //Definiendo el pin 12 como SALIDA
  digitalWrite(freeLed,LOW); //Estableciendo en PIN12 como INACTIVO (la luz estara apagada)
  pinMode(reservedLed, OUTPUT);
  digitalWrite(reservedLed,LOW);
  pinMode(occupiedLed, OUTPUT); 
  digitalWrite(occupiedLed,LOW); 

  //INICIALIZANDO CERRADURA
  pinMode(deadlock, OUTPUT); 
  digitalWrite(deadlock,LOW);

  //Inicializando SENSORES
  pinMode(doorSensor, INPUT);
  pinMode(scooterSensor, INPUT);


  //####DEFINIENDO SERVOMOTOR
  myservo.attach(2);  // attaches the servo on pin 2 to the servo object
  myservo.write(0); 
}
//******************************************************************


//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
void loop()
{
  if (command != 'C'){
    deactivateCharger();
  }

  //OCCUPIEDBOX -- OPEN/CLOSE-DOOR_DETECTION 
  if (RESPONSEcode == "320" || RESPONSEcode == "321" && command == 'C'){
    doorOpen();
  }  

  if (RESPONSEcode == "300" || RESPONSEcode == "301" && command == 'C'){
    doorClose();
  }
  ///////////////////////////////////////////////

  
  //FREEBOX -- OPEN/CLOSE-DOOR_DETECTION 
  if (RESPONSEcode == "120" || RESPONSEcode == "121" || RESPONSEcode == "111" && command == 'A'){
    doorOpen();
  }  

  if (RESPONSEcode == "100" || RESPONSEcode == "101"  && command == 'A'){
    doorClose();
  }
  ///////////////////////////////////////////////


  //OCCUPIEDBOX -- OPEN/CLOSE-DOOR_DETECTION  FOR ERROR IN FREEBOX_CLOSING 
  if (RESPONSEcode == "256" && command == 'B'){
    doorOpen();
  }


  delay(100);
}

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//FUNCION-EVENTO PARA RESPONDER AL MASTER I2C

//Esta funcion, EJECUTARA lo que deba, dependiendo DEL COMANDO ENVIADO ANTERIORMENTE POR "EL MASTER i2C"
//DEBEMOS ESTAR CONSTANTEMENTE PREGUNTANDO DESDE EL "MASTER I2C" para que se ejecuten los comandos y tengamos un flujo constante del programa
// seria RECOMENDABLE preguntar (DESDE EL MAESTRO i2c) mas rapido (200-500ms) o mas lento(3000-5000ms) segun LA PRIORIDAD de la operacion a realizar
//seria prioritario todo lo que conlleve cambios de estado, no seria prioritario el ESCANEO CONSTANTE del BOX para determinar el estado de los sensores estando ya FIJO en un ESTADO.

// this function is registered as an event, see setup()
void requestEvent()
{

  switch(command){

  case 'A': 
    freeBox(); //Realizar Proceso de LIBERACION del BOX
    break;

  case 'B': 
    reservedBox();//Realizar Proceso de RESERVA del BOX
    break;

  case 'C': 
    occupiedBox(); //Realizar Proceso de OCUPACION del BOX
    break;    

  case 'M':
     setCloseDoorMillis();//Setear MILISEGUNDOS para DELAY que determina que la puerta SE CONSIDERA CERRADA (Puerta HA SIDO DETECTADA POR EL SENSOR "n" milisegundos)
    break;
  
  case 'N':
    setOpenDoorMillis(); //Setear MILISEGUNDOS para DELAY que determina que la puerta SE CONSIDERA ABIERTA (Puerta A DEJADO DE SER DETECTADA POR EL SENSOR "n" milisegundos)
    break;
    
  case 'P':
     activateCharger();//ACTIVAR CORRIENTE "DEL ENCHUFE PARA el CARGADOR de la Patineta DEL BOX"
    break;
    
   case 'Q':
     deactivateCharger(); //CORTAR CORRIENTE "DEL ENCHUFE PARA el CARGADOR de la Patineta DEL BOX"
    break;
    
  case 'R':
     activateBox();//ACTIVAR CORRIENTE COMPLETA DEL BOX
    break;  
    
  case 'S': 
    deactivateBox(); //CORTAR CORRIENTE COMPLETA DEL BOX (solo quedara el ATEMEGA vivo)
    break;

  case 'T': 
    forceOccupiedBox();//Forzar a ESTADO OccupiedBOX
    break;

  case 'U':
    forceReservedBox();//Forzar a ESTADO ReservedBOX
    break;    

  case 'V':
     forceFreeBox(); //Forzar a ESTADO freeBOX
    break;
    
  case 'W':
     openDeadlock(); //Abrir CERRADURA
    break;
    
  case 'X':
    closeDeadlock(); //Cerrar CERRADURA
    break;
    
   case 'Y':
    onLEDS(); //Encender LOS LEDS DE ESTADO
    break;
    
  case 'Z':
    offLEDS(); //Apagar LOS LEDS DE ESTADO
    break;
    
  default:
    RESPONSEcode="999"; //Comando no existente
    Wire.write(RESPONSEcode.c_str());
    break; 
  }
  
}
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
//FUNCION-EVENTO PARA RECIBIR MENSAJE DEL MASTER I2C
//En esta funcion SOLO ESCUCHAREMOS y ALMACENAREMOS lo que Nos LLEGUE del I2C MASTER

// this function is registered as an event, see setup()
void receiveEvent(int howMany){
  
  doorStateChanged =false; //Poniendo el estado de la puerta a falso
   firstTime = true;
   
  mssg=""; //Aqui guardaremos todo el mensaje que llegue del MASTER

  if (Wire.available()){
    command = Wire.read(); // receive byte as a character
    Serial.println(command);    // print the character   
  }

 //DESECHANDO EL PRIMER CARACTER DESPUES DEL COMANDO
 // char c = Wire.read(); // receive byte as a character
     
  
  //MIENTRAS EXISTA MENSAJE, ITERAREMOS PARA ALMACENARLO ENTERO Y TRABAJAR CON EL POSTERIORMENTE
  while(0 < Wire.available()) // loop through all but the last
  {

    char c = Wire.read(); // receive byte as a character
    ////En el caso de QUERER LEER LOS byte como INT
       // int x = Wire.read() ;    // receive byte as an integer
        //Serial.println(x);         // print the integer


    mssg+=c; //Almacenando el caracter, en el mensaje

  }//Fin del WHILE

//  Serial.println(mssg);
}

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



///#####################################
//METODOS PARA TRABAJAR CON LOS BOXES

//METODO Box LIBRE ()
void freeBox(){  
//LED VERDE == ENCENDIDO (SI SE LIBERA EL BOX)
if(RESPONSEcode.substring(0,1) != "1"){
        digitalWrite(freeLed,HIGH); 
        digitalWrite(reservedLed,LOW); 
        digitalWrite(occupiedLed,LOW); 
}

//if (RESPONSEcode.substring(0,1) == "2")
 
if (RESPONSEcode.substring(0,1) != "3" && RESPONSEcode.substring(0,1) != "1"){ 
 RESPONSEcode = "156"; //CODIGO PARA LIBERAR EL BOX  !!SIN ABRIR LA PUERTA¡¡
}else{

  // 1- Si el codigo NO es 110 Ni ERRORES 15X , REALIZARA EL BUCLE.(si es 110 o 15x, significa que ya esta FREE correctamente o fue LIBERADO y ...HAY posibles PROBLEMAS!!(¿ Box Se encuentran bien?))
  if (RESPONSEcode.substring(0,2) != "11" && RESPONSEcode.substring(0,2) != "15"){

    //3-Este bloque, Controla PATINETA y CIERRA PUERTA y ESTABLECE ESTADO-BOX, se ejecutara en caso de TENER un CODIGO 10X 
     if (RESPONSEcode.substring(0,2) == "10"){
      
      //4- Si la puerta no se ha cerrado, comprobara sensor patineta para indicar el estado de esta y mandar info a la WEB
      if (digitalRead(scooterSensor) == 1){
        RESPONSEcode = "100"; //Puerta Abierta, NO PaTINETA
      }else{
        RESPONSEcode = "101"; // PUERTA ABIERTA, SI PATINETA
      }//4-FIN
      
      //5- Si la puerta se ha cerrado CERRAR-BOX, DEPENDIENDO DE la PATINETA, el ESTADO DEL BOX pasara a OCUPPIED o FREE
      if (doorStateChanged){               
        
       if (RESPONSEcode == "101"){        
        RESPONSEcode = "111"; //Si Puerta, SI patin DETECTED  [ESTE ES EL CODIGO MALO, CERRAREMOS LA PUERTA NADA MAS SE ABRA] EL BOX TAMBIEN QUEDA LIBERADO
                                        
       }else{
        closeDeadlock();
        RESPONSEcode = "110"; //SI puerta, NO Patineta [pasara a ser LIBERADO el BOX] EL CODIGO BUENO       
      }
           
    }//5-FIN     

    }//3-FIN   
    
    //2- DETERMINANDO SI SE HA ABIERTO LA PUERTA 
    if (RESPONSEcode.substring(0,2) != "10" && RESPONSEcode.substring(0,2) != "11"){
      
      if(doorStateChanged || RESPONSEcode == "130" ){
        RESPONSEcode= "130";//CODE= occupiedBox se ha abierto la PUERTA ,scooter no detected 
        if (RESPONSEcode == "130"){
          RESPONSEcode = "101";//Puerta abierta + patineta no detected
          doorStateChanged = false;
        }
      
      }else{
      //  openDeadlock();
        RESPONSEcode = "120"; //CODE= occupiedBox PUERTA CERRADA, SIN CAMBIOS
      }
      
    }//2-FIN

  }else{
    //COMPROBANDO ESTADO DEL BOX
    
    //1E-SI EL USUARIO HA INTENTADO CERRAR CON LA PATINETA DENTRO
    if (RESPONSEcode== "111"){
      
      //CERRAREMOS LA CERRADURA nada mas que la PUERTA SE ABRA, EL BOX QUEDAR DISPONIBLE PERO CON LA PUERTA ABIERTA
      if (doorStateChanged ){
         RESPONSEcode ="155";//CIERRE DE CERRADURA CON PUERTA ABIERTA, usuario intento cerrar con patineta dentro  ENVIAR A BBDD para avisar de esto
         closeDeadlock();
      }
         
    }else{//1E-SI EL PARKING SE YA CERRO DE ALGUNA MANERA 
    
    //SI PUERTA NO TECTADA (establecemos CODIGO de ERROR)
    if (digitalRead(doorSensor) == 1){
      
      //comprobando patineta (si la patineta NO es detectada)
      if (digitalRead(scooterSensor) == 1){
        RESPONSEcode = "150"; //Puerta no Detect, patin NO detect        
      
       }else{ //Patineta Si es detectada
         RESPONSEcode = "151"; //Puerta no Detect, patin SI detect 
       }
          
    }else{//PUERTA DETECTADA
      
      //comprobando patineta (si la patineta NO es detectada)
      if (digitalRead(scooterSensor) == 1){
        RESPONSEcode = "152"; //Puerta SI Detect, patin NO detect  //IGUAL que 110, pero para que no escriba en la BBDD(de la Rpi) el cambio de estado     
       }else{
         RESPONSEcode = "153"; //Puerta SI Detect, patin SI detect 
       }
      
    }
    
    
    
    }//1E-FIN
    
  }//1-FIN 
}
  Wire.write(RESPONSEcode.c_str());

}//Fin occupiedBox

//---------------------------

//METODO Box RESERVADO
void reservedBox(){

   //Encender LED naranja
   //SI VIENE CON ERROR 111- desde el ESTADo FreeBOX()
  if (RESPONSEcode == "111"){
    RESPONSEcode = "256";//CERRADURA ABIERTA, usuario esta intentando dejar patineta en OCCUPIED dando un mal funcionamiento del FREEBOX, al intentar cerrar el box con la patineta dentro
    //CUANDO GENERAMOS ESTE ERROR, La puerta cerradura esperara a que se abra pa puerta, para cerrarse con esta abierta y asi evitar que dejen nada dentro en el estado OCCUPIED
  }
  
  
  if (RESPONSEcode == "256"){
      //CERRAREMOS LA CERRADURA nada mas que la PUERTA SE ABRA, EL BOX QUEDAR DISPONIBLE PERO CON LA PUERTA ABIERTA
            digitalWrite(freeLed,LOW); 
           digitalWrite(occupiedLed,LOW); 
           digitalWrite(reservedLed,HIGH);
      if (doorStateChanged){
         RESPONSEcode ="255";//CIERRE DE CERRADURA CON PUERTA ABIERTA, usuario en FreeBox intento cerrar con patineta dentro o dejar inutilizado este 
         closeDeadlock();

      }
    
  }else{
 
  if(RESPONSEcode.substring(0,1) != "2") { 
   closeDeadlock(); //Cerramos la cerradura 
  digitalWrite(freeLed,LOW); 
  digitalWrite(occupiedLed,LOW); 
  digitalWrite(reservedLed,HIGH);
  RESPONSEcode = "230"; //Si se pone en ESTE ESTADO por PRIMERA VEZ, (Cuando recibamos este, cambiaremos el estado a RESERVED en la BBDD de la Raspi)
}else{

  //1- Si la PUERTA esta ABIERTA
  if (digitalRead(doorSensor) == 1){
    
    //2A- PATINETA NO es Detectada
    if (digitalRead(scooterSensor)== 1 ){
      RESPONSEcode = "200"; //No puerta y NO patin detectados
    
    }else{//2A- PATINETA SI es Detectada
      RESPONSEcode = "201"; //NO puerta y SI patin detectados
    }//2A-Fin
    
  }else{ //1-Si la puerta esta CERRADA 
  
    //2B-Si la PATINETA NO es Detectada
    if (digitalRead(scooterSensor)== 1 ){
      RESPONSEcode = "210"; //SI PUERTA y NO PATIN DETECTADOS!! ==> Este cdigo seria el QUE DEBIERA SALIR SIEMPRE, lo demas supondria una alerta
    
    }else{//2B-Si la PATINETA SI es Detectada
      RESPONSEcode = "211"; //SI puerta y SI patin detectados
    }//2B-FIN
  
  }//1-FIN
  
}

}//FIN RESPONSEcode == "256"
  
  Wire.write(RESPONSEcode.c_str());

}//Fin reservedBox


//------------------------------------------------


//METODO Box OCUPADO (EL CARGADOR SE ENCENDERA CUANDO LA OCUPACION SEA HAGA EFECTIVA)
void occupiedBox(){ 
  //LED ROJO == ENCENDIDO (SI SE OCUPA EL BOX)

  // 1- Si el codigo NO es 311 Ni ERRORES 35X , REALIZARA EL BUCLE.(si es 311 o 35x, significa que ya esta OCCUPIED correctamente o fue occupado y ...HAY posibles PROBLEMAS!!(¿Patineta y Box Se encuentran bien?))
  if (RESPONSEcode != "311" && RESPONSEcode.substring(0,2) != "35"){

    //3-Este bloque, Controla PATINETA y CIERRA PUERTA y ESTABLECE ESTADO-BOX, se ejecutara en caso de TENER un CODIGO 30X 
     if (RESPONSEcode.substring(0,2) == "30"){
      
      //4- Si la puerta no se ha cerrado, comprobara sensor patineta para indicar el estado de esta y mandar info a la WEB
      if (digitalRead(scooterSensor) == 1){
        RESPONSEcode = "300"; //Puerta Abierta, NO PaTINETA
      }else{
        RESPONSEcode = "301"; // PUERTA ABIERTA, SI PATINETA
      }//4-FIN
      
      //5- Si la puerta se ha cerrado CERRAR-BOX, DEPENDIENDO DE la PATINETA, el ESTADO DEL BOX pasara a OCUPPIED o FREE
      if (doorStateChanged){  
        
        closeDeadlock();
        
       if (RESPONSEcode == "301"){        
        RESPONSEcode = "311"; //Si Puerta, SI patin DETECTED  [ESTE ES EL CODIGO BUENO, EL QUE SIEMPRE DEBERIA SALIR] 
        digitalWrite(freeLed,LOW); 
        digitalWrite(reservedLed,LOW); 
        digitalWrite(occupiedLed,HIGH); 
        activateCharger();
      
       }else{
        RESPONSEcode = "310"; //SI puerta, NO Patineta [pasara a ser LIBERADO el BOX]
        //NO HAY PATINETA, POR LO TANTO SE LIBERARA el BOX, no puede ocuparse si no existe patineta
        forceFreeBox(); //Forzando la liberacion del parking
      }
      
      
    }//5-FIN     

    }  //3-FIN   

    //2- DETERMINANDO SI SE HA ABIERTO LA PUERTA 
    if (RESPONSEcode.substring(0,2) != "30" && RESPONSEcode.substring(0,2) != "31"){
      
      if(doorStateChanged || RESPONSEcode == "330" ){
        RESPONSEcode= "330";//CODE= occupiedBox se ha abierto la PUERTA ,scooter no detected 
        if (RESPONSEcode == "330"){
          RESPONSEcode = "300";//Puerta abierta + patineta no detected
          doorStateChanged = false;
        }
      
      }else{
        RESPONSEcode = "320"; //CODE= occupiedBox PUERTA CERRADA, SIN CAMBIOS
      }
      
    }//2-FIN

  }else{
    //COMPROBANDO ESTADO DEL BOX
 //   RESPONSEcode = "311"; //Estable, cerrado correctamente (puerta y patin detectados)
    
    //SI PUERTA NO TECTADA (establecemos CODIGO de ERROR)
    if (digitalRead(doorSensor) == 1){
      
      //comprobando patineta (si la patineta NO es detectada)
      if (digitalRead(scooterSensor) == 1){
        RESPONSEcode = "350"; //Puerta no Detect, patin NO detect        
      
       }else{ //Patineta Si es detectada
         RESPONSEcode = "351"; //Puerta no Detect, patin SI detect 
       }
       
      
    }else{//PUERTA DETECTADA
      
      //comprobando patineta (si la patineta NO es detectada)
      if (digitalRead(scooterSensor) == 1){
        RESPONSEcode = "352"; //Puerta SI Detect, patin NO detect        
       }else{
         RESPONSEcode = "353"; //IGUAL que 311, pero para que no escriba en la BBDD(de la Rpi) el cambio de estado
       }
      
    }
 //#############################################################
 //CORTE DE CORRIENTE DE CARGADOR si SE Produce una ALERTA######
 //YA SEA EN puerta o patin, CORTAMOS ALIMENTACION DEL CARGADOR
 //¿MOSTRAR AL USUARIO POSIBILIDAD DE HABILITARLO BAJO SU CONSENTIMIENTO?

//   if (RESPONSEcode != "311" || RESPONSEcode != "353" ){
//      deactivateCharger();
//    }
//######################################################################
   
  }//1-FIN 

  Wire.write(RESPONSEcode.c_str());

}//Fin occupiedBox


////***********************************************************************+

//#################################################################
//## funciones QUE DETERMINAN (con un temporizador) SI LA PUERTA ESTA CERRADA O ABIERTA
//#########################################################
//Funcion que comprueba que la puerta se abra antes de pasar al siguiente paso
void doorOpen(){

  actualTime = millis();

  if (firstTime){
    openDeadlock();
    oldTime = actualTime+intervalDoorOpened;
    firstTime = false;
  }


  if (digitalRead(doorSensor)== 1 ){

    if(actualTime > oldTime){
      doorStateChanged = true;
      firstTime = true;
    }

  }else{
    doorStateChanged = false;
    oldTime= actualTime+intervalDoorOpened;
  }
}//FIN doorOpen


//Funcion que comprueba que la puerta se CIERRE antes de pasar al siguiente paso
void doorClose(){

  actualTime = millis();

  if (firstTime){
    oldTime = actualTime+intervalDoorClosed;
    firstTime = false;
  }

  if (digitalRead(doorSensor)== 0 ){

    if(actualTime > oldTime){
      doorStateChanged = true;
      firstTime = true;
    }

  }
  else{   
    doorStateChanged = false;
    oldTime= actualTime+intervalDoorClosed;
  }

}//FIN doorClose


//-----------------------------------------

//####################################
//## funciones ABRIR-CERRAR CERRADURA

//METODOS PARA CERRADURA
void openDeadlock(){
  digitalWrite(deadlock,HIGH);
  myservo.write(90);  
}//Fin openDeadlock()


void closeDeadlock(){
  myservo.write(0); 
  digitalWrite(deadlock,LOW);  
}//Fin closeDeadlock()




//----------------------------------------

//#################################
//##FUNCIONES para ON-OFF TODOS LOS LEDS DE ESTADO

//METODOS PARA APAGAR-ENCENDER TODOS LOS LEDs
void offLEDS(){
  digitalWrite(freeLed,LOW); 
  digitalWrite(occupiedLed,LOW); 
  digitalWrite(reservedLed,LOW);
}

void onLEDS(){
  digitalWrite(freeLed,HIGH); 
  digitalWrite(occupiedLed,HIGH); 
  digitalWrite(reservedLed,HIGH);
}


//--------------------------------------

//#############################
//##FUNCIONES ON-OFF CARGADOR-Patineta del BOX

/////APAGAR Y ENCENDER EL CARGADOR
void deactivateCharger(){
  digitalWrite(chargerPower,HIGH);
}

void activateCharger(){
  digitalWrite(chargerPower,LOW);
}


//----------------------------------

//#############################
//##FUNCIONES ON-OFF CORRIENTE-COMPLETA del BOX (Arduino continuara VIVO)

/////APAGAR Y ENCENDER EL BOX COMPLETO
void deactivateBox(){
  digitalWrite(boxPower,HIGH);
}

void activateBox(){
  digitalWrite(boxPower,LOW);
}


//-----------------------------------------

//#########################################
//## FORZANDO ESTADOS DEL PARKING

void forceFreeBox(){
        //SE RESPETA el "RESPONSEcode" QUE YA TENGA ESTABLECIDO
        digitalWrite(freeLed,HIGH); 
        digitalWrite(reservedLed,LOW); 
        digitalWrite(occupiedLed,LOW); 
        command = 'A'; //ESTABLECIENDO como COMANDO 'A' == freeBOX
}


void forceReservedBox(){
        //SE RESPETA el "RESPONSEcode" QUE YA TENGA ESTABLECIDO
        digitalWrite(freeLed,LOW); 
        digitalWrite(reservedLed,HIGH); 
        digitalWrite(occupiedLed,LOW); 
        command = 'B'; //ESTABLECIENDO como COMANDO 'B' == reservedBOX
}


void forceOccupiedBox(){
        //SE RESPETA el "RESPONSEcode" QUE YA TENGA ESTABLECIDO
        digitalWrite(freeLed,LOW); 
        digitalWrite(reservedLed,LOW); 
        digitalWrite(occupiedLed,HIGH); 
        command = 'C'; //ESTABLECIENDO como COMANDO 'C' == occupiedBOX      digitalWrite(freeLed,HIGH); 
        digitalWrite(reservedLed,LOW); 
        digitalWrite(occupiedLed,LOW); 
        
        //AGREGAR el WireWrite al final de EJECUTAR ESTE METODO en caso de ser necesario
}


//--------------------------------------------------------------
//#########################################
//### FUNCIONES para ESTABLERCER delay EN REMOTO!!
void setOpenDoorMillis(){
  intervalDoorOpened = mssg.substring(1).toInt();
//  Wire.write(String(intervalDoorOpened).c_str());
}

void setCloseDoorMillis(){
  intervalDoorClosed = mssg.substring(1).toInt();
//  Serial.println(intervalDoorClosed);
//  Wire.write(String(intervalDoorClosed).c_str());
}




