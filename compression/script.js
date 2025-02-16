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

let Nu = new Variable("Nu", undefined, undefined,true, false, ["Abr","beta","fe","fc28","As"], () => {
    let fbu = 0.85*fc28.value/1.5;
    let fsu = fe.value/1.15;
    let N = (Abr.value*fbu/0.9 + 0.85*As.value*fsu)/beta.value;
    return N;
});
let Nserr = new Variable("Nserr", undefined, undefined,true, false, ["As", "Abr", "fc28"], () => {
    let N = 0.6*fc28.value*(Ab() + 14*As.value);
    let Ai = Ab() + 14*As.value;
    let sB = N / Ai;
    let sS = 15*sB;
    let sSt;
    if(fiss > 1){
        sSt = 1000000*Math.min(2*fe.value/3000000, Math.max(0.5*fe.value/1000000, 110*Math.sqrt(n*ft28/1000000)));
        if (fiss === 3){
            sSt *= 0.8;
        }
    }else{
        sSt = fe.value/1.15;
    }
    if(sS > sSt){
        sB = sSt / 15;
        return sB*(Ab()+14*As.value);
    }else{
        return N;
    }
});
let fc28 = new Variable("fc28", undefined, undefined,true, false, ["never"], undefined);
let fe = new Variable("fe", undefined, undefined,true, false, ["never"], undefined);
let a = new Variable("a", undefined, undefined,true, false, ["never"], undefined);
let b = new Variable("b", undefined, undefined,true, false, ["never"], undefined);
let r = new Variable("r", undefined, undefined,true, false, ["never"], undefined);
let lf = new Variable("lf", undefined, undefined,true, false, ["never"], undefined);
let lambda = new Variable("lambda", undefined, undefined, false, false, ["lf", "Abr"], () => {
    if(shape === "rect"){
        return lf.value/(Math.sqrt((Math.max(a.value,b.value)*Math.pow(Math.min(a.value,b.value),3)/(12*a.value*b.value))))
    }else{
        return lf.value/(r.value/2);
    }
});
let beta = new Variable("beta", undefined, undefined, false, false, ["lambda"], () => {return (lambda.value <= 50) ? (1+0.2*Math.pow(lambda.value/35,2)) : 0.85*lambda.value*lambda.value/1500;});
let Abr = new Variable("Abr", undefined, undefined,false, false, ["a", "b"], () => {
    if(shape ==="rect"){
        return (a.value-0.02)*(b.value-0.02);
    }else{
        return Math.pow(r.value-0.01,2)*Math.PI;
    }
});
let As = new Variable("As", undefined, undefined,true, false, ["Abr","beta", "fe","fc28","Nu"], () => {
    let fbu = 0.85*fc28.value/1.5;
    let fsu = fe.value/1.15;
    let A = (beta.value*Nu.value - Abr.value*fbu/0.9)/(0.85*fsu);
    return A;
});
let variables = [Nu,Nserr,fc28,fe,a,b,r,lf,lambda,beta,Abr,As];
let changed = true;
let n;
let fiss;
let shape;

let sigmaB;
let sigmaS;
let sigmaSt;
let ft28;

let Asmin;
let Asmax;


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
    if(shape === "rect"){
        Abr.reqs = ["a", "b"];
    }else{
        Abr.reqs = ["r"];
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
    AsLimits();
    verifyELS();
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

function verifyELS(){
    let Ai = Ab() + 14*As.value;
    sigmaB = Nserr.value / Ai;
    sigmaS = 15*sigmaB;
    if(fc28.value < 60*1000000){
        ft28 = 600000 + 0.06*fc28.value;
    }else{
        ft28 = 0.275*Math.pow(fc28.value/1000000,2/3)*1000000;
    }
    sigmaSt = 1000000*Math.min(2*fe.value/3000000, Math.max(0.5*fe.value/1000000, 110*Math.sqrt(n*ft28/1000000)));
    let error = document.getElementById("As-error");
    if (sigmaB > (0.6*fc28.value)){
        error.innerHTML = "ELS non vérifié \n σ<sub>b</sub> > σ̅<sub>b</sub>";
        return;
    }
    if (fiss == 1){
        sigmaSt = fe.value;
        return;
    }
    if(fiss == 3){
        sigmaSt *= 0.8;
    }
    if(sigmaS > sigmaSt){
        error.innerHTML = "ELS non vérifié σ<sub>s</sub> > σ<sub>st</sub>";
        return;
    }
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
    document.getElementById("Ab-detail").innerText = Math.round(Ab()*100000)/10;
    document.getElementById("Abr-detail").innerText = Math.round(Abr.value*100000)/10;
    document.getElementById("lambda-detail").innerText = Math.round(lambda.value*100000)/100000;
    document.getElementById("beta-detail").innerText = Math.round(beta.value*100000)/100000;
    document.getElementById("Sb-detail").innerText =  Math.round(sigmaB)/1000000;
    document.getElementById("Sbr-detail").innerText = Math.round(0.6*fc28.value)/1000000;
    document.getElementById("Ss-detail").innerText =  Math.round(sigmaS)/1000000;
    document.getElementById("ft28-detail").innerText = Math.round(ft28)/1000000;
    document.getElementById("Sst-detail").innerText = Math.round(sigmaSt)/1000000;
}
