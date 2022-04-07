let requestId

window.addEventListener("load",function(){
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width=704;
    canvas.height=396;

class Juego{
    constructor(width,height,canvas){
        this.width=width;
        this.height=height;
        this.gameOver=new GameOver(this);
        this.ganar=new Ganar(this);
        this.mapa= new Mapa(this);
        this.controlBala= new ControlBala(canvas);
        this.hero=new HeroElf(this,this.controlBala);
        this.crearenemigo=new InvocarEnemigo();
        this.comando = new Comandos();
        this.context=ctx;
        this.frames=0;
    }
    update(){
        this.hero.update(this.comando.keys);
        this.crearenemigo.update(this.hero);
        if(this.hero.death===true){
            requestId=undefined;
        }
        if(this.points>50){
            requestId=undefined;
        }
    } 

    draw(ctx){
        this.mapa.dibujarMapa(ctx)
        this.crearenemigo.dibujarEnemigos(ctx)
        this.hero.dibujarHeroe(ctx)
        if(this.hero.death===true){
            this.gameOver.dibujarFin(ctx);
        }
        if(this.points>50){
            this.ganar.dibujarGanar(ctx);
        }

    }

    score(ctx){
        this.frames++;
        this.points = Math.floor(this.frames / 30);
        ctx.font = '40px serif';
        ctx.fillStyle = 'black';
        ctx.fillText(`Score: ${this.points}`, 50, 50);


    }
}


class HeroElf{
    constructor(juego,controlBala){
        this.juego=juego;
        this.health=1;
        this.x=320;
        this.y=320;
        this.controlBala=controlBala;
        this.corteX=64;
        this.corteY=63;
        this.framyX=0
        this.framyY=0
        this.alto=74;
        this.ancho=71;
        this.death=false;
        this.image=new Image();
        this.image.src= "./img/walkElf.png";
        this.image.onload=()=>{
            this.cargado=true;
                }

    }

    update(comando){
        if(comando.includes("ArrowRight")) {
            this.x++;
            this.framyY=3;
        }
        else if(comando.includes("ArrowLeft")) {
            this.x--;
            this.framyY=1;
        }
        else if(comando.includes("ArrowUp")) {
            this.y--
            this.framyY=0;
            }
        
        else if(comando.includes("ArrowDown")) {
            this.y++;
            this.framyY=2
        }
        
        if(comando.includes("x")){
            this.shootPressed=true;
        }else{
            this.shootPressed=false;
        }
    }

    dibujarHeroe(ctx){
        this.cargado && ctx.drawImage(this.image, this.framyX*this.corteX, this.framyY*this.corteX, this.corteX, this.corteY, this.x, this.y, this.alto, this.ancho);
        this.shoot()
    }

    shoot(){
        if(this.shootPressed){
            //console.log("shoot");
            const speed =4;
            const delay=20;
            const damage=1;
            const bulletX=this.x;
            const bulletY=this.y;
            this.controlBala.disparo(bulletX,bulletY,speed,damage,delay);
        }
    }
    collition(item){
        return (this.x<item.x+item.ancho-50 &&
            this.x+this.ancho-50>item.x &&
            this.y<item.y+item.alto-20 &&
            this.y+this.alto-20>item.y)
    }
}


class Comandos{
    constructor(){
        this.keys=[];
        window.addEventListener("keydown", e=>{
            if((e.key==="ArrowDown"||
                e.key==="ArrowUp"||
                e.key==="ArrowLeft"||
                e.key==="ArrowRight"||
                e.key==="x")
            &&this.keys.indexOf(e.key)===-1){
                this.keys.unshift(e.key);
            }
            //console.log(e.key,this.keys)
        });
        window.addEventListener("keyup", e=>{
            if(e.key==="ArrowDown"||
            e.key==="ArrowUp"||
            e.key==="ArrowLeft"||
            e.key==="ArrowRight"||
            e.key==="x"){
                this.keys.splice(this.keys.indexOf(e.key),1);
            }
            //console.log(e.key,this.keys)
        });
    }
}

class Bala{
    colors=[
        "red",
        "blue",
        "yellow",
        "orange",
        "purple",
        "pink",
        "lightgreen"
    ]
    constructor(x,y,speed,damage){
        this.x=x;
        this.y=y;
        this.speed=speed;
        this.damage=damage;
        this.width=3;
        this.height=20;
        //this.color="black";
        this.color=this.colors[Math.floor(Math.random()*this.colors.length)]
    }
    draw(ctx){
        ctx.fillStyle=this.color;
        this.y-=this.speed;
        ctx.fillRect(this.x,this.y,this.width,this.height);
    }

    collideWith(sprite){
        if(this.x<sprite.x+sprite.width &&
            this.x+this.width>sprite.x &&
            this.y<sprite.y+sprite.height &&
            this.y+this.height>sprite.y
            ){
                sprite.daño(this.damage);
                return true
            }
            return false;
        }
}

class ControlBala{
    balas=[];
    timerTilNextBullet=0
    constructor(cnavas){
        this.canvas=canvas;
    }
    disparo(x,y,speed,damage,delay){
        if(this.timerTilNextBullet<=0){
            this.balas.push(new Bala(x,y,speed,damage));
            this.timerTilNextBullet=delay;
        }
        this.timerTilNextBullet--;
    }
    draw(ctx){
        //console.log(this.balas.length);
        this.balas.forEach((bullet)=>{
            if(this.isBulletOffScreen(bullet)){
            const index= this.balas.indexOf(bullet);
            this.balas.splice(index,1);
            }
            bullet.draw(ctx)
        });
        }
    collideWith(sprite){
            return this.balas.some(bullet=>{
                if(bullet.collideWith(sprite)){
                    this.balas.splice(this.balas.indexOf(bullet),1);
                    return true;
                }
                return false;
            })
        }
    isBulletOffScreen(bullet){
            return bullet.y<=-bullet.height  
    }
}


class InvocarEnemigo{
    constructor(){

        this.width=704;
        this.height=340;
        this.enemigo=[]
        this.agregarEnemigo();
        this.intervaloEntreEnemigos=80;
        this.cronometroEnemigo=0;
        
    }
    update(hero){
        this.enemigo=this.enemigo.filter(objeto=>!objeto.borrarEnemigo);

        if(this.cronometroEnemigo>this.intervaloEntreEnemigos){
            this.agregarEnemigo();
            this.cronometroEnemigo=0;
        }else{
            this.cronometroEnemigo++;
        }
        
        this.enemigo.forEach(objeto=>objeto.update(hero));
        //console.log(this.enemigo);
    }
    dibujarEnemigos(ctx){
        this.enemigo.forEach((objeto)=>{
            objeto.dibujarEnemigo(ctx)
        });
    }

    agregarEnemigo(){
        this.enemigo.push(new Enemigo(this));
    }
}


class Enemigo{
    constructor(invocarEnemigo){
        this.invocarEnemigo=invocarEnemigo;
        this.health=1;
        this.x=this.invocarEnemigo.width;
        this.y=Math.random()*this.invocarEnemigo.height;
        this.corteX=50;
        this.corteY=56;
        this.alto=64;
        this.ancho=68;
        this.borrarEnemigo=false;
        this.imageSrc=["./img/Cloudy.png","./img/Firey.png"]
        this.image=new Image();
        this.image.src=this.imageSrc[Math.floor(Math.random()*2)];
        this.velocidad=Math.random()*(0.6+1.5)+0.6;

        this.image.onload=()=>{
            this.cargado=true;
        }
        
    }

    update(hero){
        this.x-=this.velocidad;
        if(this.x<0-this.ancho){
            this.borrarEnemigo=true;
        }
        if(hero.collition({
            x:this.x,
            y:this.y,
            ancho:this.ancho,
            alto:this.alto
        })){hero.death=true}
    }
    dibujarEnemigo(ctx){

        this.cargado && ctx.drawImage(this.image, 0, 0, this.corteX, this.corteY, this.x, this.y, this.alto, this.ancho)

    }
    damage(damage){
        this.health-=damage
    }
}


class Mapa {
    constructor(){
        this.image=new Image();
        this.image.src="./img/MapaInicio.png";
        this.image.onload=()=>{
        this.cargado=true;
            }
    }
    dibujarMapa(ctx){
        this.cargado && ctx.drawImage(this.image, 0, 0)
    }
}

class GameOver {
    constructor(){
        this.image=new Image();
        this.image.src="./img/Mapafin.png";
        this.image.onload=()=>{
        this.cargado=true;
            }
    }
    dibujarFin(ctx){
        this.cargado && ctx.drawImage(this.image, 0, 0)
    }
}

class Ganar {
    constructor(){
        this.image=new Image();
        this.image.src="./img/MapaWin.png";
        this.image.onload=()=>{
        this.cargado=true;
            }
    }
    dibujarGanar(ctx){
        this.cargado && ctx.drawImage(this.image, 0, 0)
    }
}




const juego = new Juego(canvas.width, canvas.height);

document.getElementById('start-button').onclick = () => {
    
            console.log(juego);
            if(!requestId){
                requestId=requestAnimationFrame(animar)
            }

};

function animar(){
    ctx.clearRect(0,0, canvas.width, canvas.height)
    juego.update();
    juego.draw(ctx);
    juego.controlBala.draw(ctx);
    juego.score(ctx);
    
    if(requestId){
        requestId=requestAnimationFrame(animar);
    }

}

});
