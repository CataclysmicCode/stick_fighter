
class Car {

    constructor(name, build, image){
  
      this.name = name;
      this.build = build;
      this.image = image;
      
    }
  
    update(){
      
      this.display();
      
    }
  
    display(){
    
      
      
    }
  
}

var classic = new Car(
  "classic",
  function(){
    
    return {
      spring: 10,
      springDamping: 10,
      weight: 10,
      speed: 10,
      torque: 10,
      rotation: 10,
    };

    


  }
);


