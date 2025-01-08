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

let Mu = new Variable("Mu", undefined, undefined,true, false, ["never"], undefined);
let Ms = new Variable("Ms", undefined, undefined,true, false, ["never"], undefined);
let fc28 = new Variable("fc28", undefined, undefined,true, false, ["never"], undefined);
let fe = new Variable("fe", undefined, undefined,true, false, ["never"], undefined);
let b = new Variable("b", undefined, undefined,true, false, ["never"], undefined);
let h = new Variable("h", undefined, undefined,true, false, ["never"], undefined);
let d = new Variable("d", undefined, undefined,true, false, ["never"], undefined);
let d1 = new Variable("d1", undefined, undefined,true, false, ["never"], undefined);
let ees = new Variable("ees", undefined, undefined,false, false, ["fe"], () => {
    return (fe.value/1.15)/200000000;
});
let a1 = new Variable("a1", undefined, undefined,false, false, ["ees"], () => {
    return 7/(7+2*ees.value);
});
let u1 = new Variable("u1", undefined, undefined,false, false, ["a1"], () => {
    return 0.8*a1.value*(1-0.4*a1.value);
});
let As = new Variable("As", undefined, undefined,true, false, ["Mu", "u1"], () => {
    let fsu = fe.value/1.15;
    if(u.value <= Uab || u.value <= u1.value){
        a = 1.25*(1-Math.sqrt(1-2*u.value));
        z = d.value*(1-0.4*a);
        Asc = 0;
        return Mu.value/(z*fsu);
    }else{
        a = a1.value;
        esc = ((d.value-d1.value)/d.value)*(3.5+ees.value)-ees.value;
        let Ssc;
        if(esc <= ees.value){
            Ssc = esc*200000000;
        }else{
            Ssc = fsu;
        }
        let Ss = fsu;
        Asc = (Mu.value - Mr.value)/((d.value-d1.value)*Ssc);
        z = d.value*(1-0.4*a);
        return Asc*Ssc/Ss + Mr.value/(z*Ss);
    }
});
let u = new Variable("u", undefined, undefined,false, false, ["Mu"], () => {
    let fbu = 0.85*fc28.value/1.5;
    return Mu.value/(b.value*d.value*d.value*fbu);
});
let Mr = new Variable("Mr", undefined, undefined,false, false, ["b", "h"], () => {
    let fbu = 0.85*fc28.value/1.5;
    return u1.value*b.value*d.value*d.value*fbu;
});
let variables = [Mu, Ms,fc28,fe,ees,a1,u,Mr,u1,b,h,d,d1,As];
let changed = true;
let Uab = 0.187;
let Asc;
let eb = 3.5;
let fiss;
let n;
let ft28;
let a;
let z;
let val;
let sigmaB;
let sigmaS;
let sigmaSt;
let esc;
let Asmin;
let Asmax;

function refresh(){
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
    for (let variable of variables){
        if(variable.display){
            if(document.getElementById(variable.name+"-button")){
                document.getElementById(variable.name+"-button").disabled = !variable.isCalc;
            }
        }
    }
    AsLimits()
    if(As.value){
        verifyELS();
    }
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
    let min1 = b.value*h.value/1000;
    if(fc28.value < 60*1000000){
        ft28 = 600000 + 0.06*fc28.value;
    }else{
        ft28 = 0.275*Math.pow(fc28.value/1000000,2/3)*1000000;
    }
    let min2 = 0.23*b.value*d.value*ft28/fe.value;
    Asmin = Math.max(min1, min2);
    Asmax = 0.05*b.value*h.value;
    let error = document.getElementById("As-error");
    error.innerText = "";
    if (As.value + Asc < Asmin){ error.innerText = "As < Asmin = " + Asmin / As.unit;}
    if (As.value + Asc > Asmax){ error.innerText = "As > Asmax = " + Asmax / As.unit;}
}

function details(){
    document.getElementById("Asmin-detail").innerText = Math.round(Asmin*100000)/10;
    document.getElementById("Asmax-detail").innerText = Math.round(Asmax*100000)/10;
    document.getElementById("z-detail").innerText = Math.round(z*10000000)/100000;
    document.getElementById("yan-detail").innerText = Math.round(x*10000000)/100000;
    document.getElementById("I-detail").innerText = Math.round(I*100000000000)/1000;
    document.getElementById("U-detail").innerText = Math.round(u.value*10000000)/10000000;
    document.getElementById("U1-detail").innerText = Math.round(u1.value*10000000)/10000000;
    document.getElementById("a-detail").innerText = Math.round(a*10000)/10000;
    document.getElementById("a1-detail").innerText = Math.round(a1.value*10000)/10000;
    document.getElementById("Asc-detail").innerText = Math.round(Asc*10000000)/1000;
    document.getElementById("ees-detail").innerText = Math.round(ees.value*10000)/10000;
    document.getElementById("esc-detail").innerText = Math.round(esc*10000)/10000;
    document.getElementById("Mr-detail").innerText = Math.round(Mr.value*10)/10000;
    document.getElementById("ft28-detail").innerText = Math.round(ft28)/1000000;
    document.getElementById("Sst-detail").innerText = Math.round(sigmaS)/1000000;
    document.getElementById("Sstr-detail").innerText = Math.round(sigmaSt)/1000000;
    document.getElementById("Sb-detail").innerText = Math.round(sigmaB)/1000000;
    document.getElementById("Sbr-detail").innerText = Math.round(0.6*fc28.value)/1000000;
}
let x;
let I;
function verifyELS(){
    let asc = Asc ? Asc : 0;
    let ax = b.value/2;
    let bx = 15*asc + 15*As.value;
    let cx = -15*(asc*d1.value + As.value * d.value);
    let delta = bx*bx - 4*ax*cx;
    let x1,x2;
    if (delta == 0){
        x = -bx/(2*ax);
    }else{
        x1 = (-bx-Math.sqrt(delta))/(2*ax);
        x2 = (-bx+Math.sqrt(delta))/(2*ax);
        if (x1 < 0 || x1 > h.value){x1=0;}
        if (x2 < 0 || x2 > h.value){x2=0;}
        x = x1+x2;
    }
    I = b.value*Math.pow(x,3)/3 + 15*asc*(x-d1.value)*(x-d1.value) + 15 * As.value*(d.value-x)*(d.value-x);
    sigmaB = Ms.value*x/I;
    sigmaS = 15*Ms.value*(d.value-x)/I;
    sigmaSt = 1000000*Math.min(2*fe.value/3000000, Math.max(0.5*fe.value/1000000, 110*Math.sqrt(n*ft28/1000000)));
    if(fiss == 3){
        sigmaSt *= 0.8;
    }
    if(fiss == 1){
        sigmaSt = fe.value/1.15;
    }
    let error = document.getElementById("As-error");
    if (sigmaB > 0.6*fc28.value){
        error.innerHTML = "ELS non vérifié \n σ<sub>b</sub> > σ̅<sub>b</sub>";
        return;
    }
    if(sigmaS > sigmaSt){
        error.innerHTML = "ELS non vérifié σ<sub>st</sub> > σ̅<sub>st</sub>";
        return;
    }
}
