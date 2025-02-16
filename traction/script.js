class Variable{
    constructor(name, value, unit, display, isCalc, reqs, formula){
        this.name = name;
        this.value = value;
        this.unit = unit;
        this.isCalc = isCalc;
        this.display = display;
        this.reqs = reqs;
        this.formula = formula;
    }
    calculate(){
        this.value = this.formula();
    }
}

let Nu = new Variable("Nu", undefined, undefined,true, false, ["never"], undefined);
let Nserr = new Variable("Nserr", undefined, undefined,true, false, ["never"], undefined);
let fc28 = new Variable("fc28", undefined, undefined,true, false, ["never"], undefined);
let fe = new Variable("fe", undefined, undefined,true, false, ["never"], undefined);
let a = new Variable("a", undefined, undefined,true, false, ["never"], undefined);
let b = new Variable("b", undefined, undefined,true, false, ["never"], undefined);
let r = new Variable("r", undefined, undefined,true, false, ["never"], undefined);
let Sst = new Variable("Sst", undefined, undefined,false, false, ["fc28", "fe"], () => {
    if(fc28.value < 60*1000000){
        ft28 = 600000 + 0.06*fc28.value;
    }else{
        ft28 = 0.275*Math.pow(fc28.value/1000000,2/3)*1000000;
    }
    let sigmaSt = 1000000*Math.min(2*fe.value/3000000, Math.max(0.5*fe.value/1000000, 110*Math.sqrt(n*ft28/1000000))); 
    if(fiss === 1){
        return fe.value;
    }
    if(fiss === 3){ sigmaSt *= 0.8;}
    return sigmaSt;
});
let Asu = new Variable("Asu", undefined, undefined,false, false, ["Nu","fe"], () =>{
    let fsu = fe.value/1.15;
    return Nu.value/fsu;
});
let Asser = new Variable("Asser", undefined, undefined,false, false, ["Nserr", "Sst"], () => {
    return Nserr.value/Sst.value;
});
let Asb = new Variable("Asb", undefined, undefined,false, false, ["fc28", "fe"], () => {
    if(fc28.value < 60*1000000){
        ft28 = 600000 + 0.06*fc28.value;
    }else{
        ft28 = 0.275*Math.pow(fc28.value/1000000,2/3)*1000000;
    }
    return Ab()*ft28/fe.value;
});
let As = new Variable("As", undefined, undefined,true, false, ["Asu","Asser", "Asb"], () => {
    return Math.max(Asu.value, Asser.value, Asb.value);
});
let variables = [Nu,Nserr,fc28,fe,Sst,a,b,r,Asu,Asser,Asb,As];
let changed = true;
let n;
let fiss;
let shape;
let Asmin;
let Asmax;

let sigmaS;
let ft28;


let val;
function initialize(){
    document.getElementById("a").style.display = "flex";
    document.getElementById("b").style.display = "flex";
    document.getElementById("r").style.display = "flex";
}

function refresh(){
    shape = document.getElementById("shape").value;
    toggleDimensions();
    n = +document.getElementById("fe-type").value;
    fiss = +document.getElementById("fiss").value;
    for (let variable of variables){
        if(variable.display){    
            variable.unit = document.getElementById(variable.name+"-unit").value;
            val = document.getElementById(variable.name).value;
            variable.value = (val === "") ? undefined : + val * variable.unit;
        }
    }
    for(let i = 0;i<6;i++){
        checkCalc();
    }
    changed = true;
    for (let variable of variables){
        if(variable.display){
            if(document.getElementById(variable.name+"-button")){
                document.getElementById(variable.name+"-button").disabled = !variable.isCalc;
            }
        }
    }
    AsLimits()
    details();
}

function checkCalc(){
    let calc;
    let reqs;
    for (let i of variables){
        calc = true;
        reqs = getReqs(i.reqs);
        if(reqs != undefined){
            for(let j of reqs){
                if(!j.value && !j.isCalc){
                    calc=false;
                }
            }
        }else{
            calc = false;
        }
        i.isCalc = calc;
        if(calc && !i.display && i.formula){
            i.calculate();
        }
    }
}

function getReqs(reqs){
    let out = [];
    if(reqs[0] === "never"){
        return undefined;
    }
    for (let req of reqs){
        out.push(getVarFromName(req));
    }
    return out;
}

function getVarFromName(str){
    for (let i of variables){
        if(i.name === str){
            return i;
        }
    }
}

function calculateClick(id){
    let nam = id.slice(0,-7);
    refresh();
    let v = getVarFromName(nam);
    v.calculate();
    document.getElementById(nam).value = v.value / v.unit;
    refresh();
}

function unitChange(id){
    let nam = id.slice(0,-5);
    let v = getVarFromName(nam);
    document.getElementById(nam).value = v.value / v.unit;
    refresh();
}

function AsLimits(){
    let min1 = 4*p()*0.0001;
    let min2 = 0.002*Ab();
    Asmin = Math.max(min1, min2);
    Asmax = 0.05*Ab();
    let error = document.getElementById("As-error");
    error.innerText = "";
    if (As.value < Asmin){
        error.innerText = "As < Asmin = " + Asmin / As.unit;
        return false;
    }else if (As.value > Asmax){
        error.innerText = "As > Asmax = " + Asmax / As.unit;
        return false;
    }
    return true;
}

function Ab(){
    if(shape ==="rect"){
        return a.value*b.value;
    }else{
        return r.value*r.value*Math.PI;
    }
}

function p(){
    if(shape ==="rect"){
    return (2*a.value + 2*b.value);
    }else{
        return 2*Math.PI*r.value;
    }
}

function toggleDimensions(){
    if (shape === "rect"){
        document.getElementById("r").parentElement.style.display = "none";
        document.getElementById("a").parentElement.style.display = "flex";
        document.getElementById("b").parentElement.style.display = "flex";
    }else{
        document.getElementById("r").parentElement.style.display = "flex";
        document.getElementById("a").parentElement.style.display = "none";
        document.getElementById("b").parentElement.style.display = "none";
    }
}

function details(){
    document.getElementById("Asmin-detail").innerText = Math.round(Asmin*100000)/10;
    document.getElementById("Asmax-detail").innerText = Math.round(Asmax*100000)/10;
    document.getElementById("Ab-detail").innerText = Math.round(Ab()*10000000)/1000;
    document.getElementById("Asu-detail").innerText = Math.round(Asu.value*10000000)/1000;
    document.getElementById("Asser-detail").innerText = Math.round(Asser.value*10000000)/1000;
    document.getElementById("Asb-detail").innerText = Math.round(Asb.value*10000000)/1000;
    document.getElementById("ft28-detail").innerText = Math.round(ft28)/1000000;
    document.getElementById("Sst-detail").innerText = Math.round(Sst.value)/1000000;
}
