/** CONST/CONV: fx-991LA X guide (pp. 38–39,46) and NIST CODATA 2010. */
const C = (category,id,symbol,label,value,unit='') => Object.freeze({category,id,symbol,label,value,unit});
export const CONSTANTS=Object.freeze([
 C('Universal','h','h','Constante de Planck',6.62606957e-34,'J s'),
 C('Universal','hbar','ℏ','Constante de Planck reduzida',1.054571726e-34,'J s'),
 C('Universal','c0','c₀','Velocidade da luz',299792458,'m/s'),
 C('Universal','epsilon0','ε₀','Permissividade do vácuo',1/(4e-7*Math.PI*299792458**2),'F/m'),
 C('Universal','mu0','μ₀','Permeabilidade do vácuo',4e-7*Math.PI,'N/A²'),
 C('Universal','Z0','Z₀','Impedância do vácuo',4e-7*Math.PI*299792458,'Ω'),
 C('Universal','G','G','Constante gravitacional',6.67384e-11,'m³/(kg s²)'),
 C('Universal','lP','lₚ','Comprimento de Planck',1.616199e-35,'m'),
 C('Universal','tP','tₚ','Tempo de Planck',5.39106e-44,'s'),
 C('Eletromagnético','muN','μN','Magneton nuclear',5.05078353e-27,'J/T'),
 C('Eletromagnético','muB','μB','Magneton de Bohr',9.27400968e-24,'J/T'),
 C('Eletromagnético','e','e','Carga elementar',1.602176565e-19,'C'),
 C('Eletromagnético','phi0','Φ₀','Quantum de fluxo magnético',2.067833758e-15,'Wb'),
 C('Eletromagnético','G0','G₀','Quantum de condutância',7.7480917346e-5,'S'),
 C('Eletromagnético','KJ','KJ','Constante de Josephson',483597.870e9,'Hz/V'),
 C('Eletromagnético','RK','RK','Constante de von Klitzing',25812.8074434,'Ω'),
 C('Atômico e nuclear','mp','mₚ','Massa do próton',1.672621777e-27,'kg'),
 C('Atômico e nuclear','mn','mₙ','Massa do nêutron',1.674927351e-27,'kg'),
 C('Atômico e nuclear','me','mₑ','Massa do elétron',9.10938291e-31,'kg'),
 C('Atômico e nuclear','mmu','mμ','Massa do múon',1.883531475e-28,'kg'),
 C('Atômico e nuclear','a0','a₀','Raio de Bohr',0.52917721092e-10,'m'),
 C('Atômico e nuclear','alpha','α','Constante de estrutura fina',7.2973525698e-3),
 C('Atômico e nuclear','re','rₑ','Raio clássico do elétron',2.8179403267e-15,'m'),
 C('Atômico e nuclear','lambdaC','λC','Comprimento de onda Compton',2.4263102389e-12,'m'),
 C('Atômico e nuclear','gammap','γₚ','Razão giromagnética do próton',2.675222005e8,'s⁻¹ T⁻¹'),
 C('Atômico e nuclear','lambdaCp','λCp','Compton do próton',1.32140985623e-15,'m'),
 C('Atômico e nuclear','lambdaCn','λCn','Compton do nêutron',1.3195909068e-15,'m'),
 C('Atômico e nuclear','Rinf','R∞','Constante de Rydberg',10973731.568539,'m⁻¹'),
 C('Atômico e nuclear','mup','μₚ','Momento magnético do próton',1.410606743e-26,'J/T'),
 C('Atômico e nuclear','mue','μₑ','Momento magnético do elétron',-9.28476430e-24,'J/T'),
 C('Atômico e nuclear','mun','μₙ','Momento magnético do nêutron',-0.96623647e-26,'J/T'),
 C('Atômico e nuclear','mumu','μμ','Momento magnético do múon',-4.49044807e-26,'J/T'),
 C('Atômico e nuclear','mtau','mτ','Massa do tau',3.16747e-27,'kg'),
 C('Físico-químico','u','u','Constante de massa atômica',1.660538921e-27,'kg'),
 C('Físico-químico','F','F','Constante de Faraday',96485.3365,'C/mol'),
 C('Físico-químico','NA','NA','Constante de Avogadro',6.02214129e23,'mol⁻¹'),
 C('Físico-químico','k','k','Constante de Boltzmann',1.3806488e-23,'J/K'),
 C('Físico-químico','Vm','Vm','Volume molar de gás ideal (100 kPa)',22.710953e-3,'m³/mol'),
 C('Físico-químico','R','R','Constante molar dos gases',8.3144621,'J/(mol K)'),
 C('Físico-químico','c1','c₁','Primeira constante de radiação',3.74177153e-16,'W m²'),
 C('Físico-químico','c2','c₂','Segunda constante de radiação',1.4387770e-2,'m K'),
 C('Físico-químico','sigma','σ','Constante de Stefan-Boltzmann',5.670373e-8,'W/(m² K⁴)'),
 C('Valores adotados','g','g','Aceleração padrão da gravidade',9.80665,'m/s²'),
 C('Valores adotados','atm','atm','Atmosfera padrão',101325,'Pa'),
 C('Valores adotados','RK90','RK-90','Valor convencional de von Klitzing',25812.807,'Ω'),
 C('Valores adotados','KJ90','KJ-90','Valor convencional de Josephson',483597.9e9,'Hz/V'),
 C('Outros','t','t','Conversão Celsius–Kelvin',273.15,'K')
]);
const conversions=[];
function pair(category,id,from,to,factor,forwardOffset=0,reverseOffset=0){
 conversions.push(Object.freeze({category,id:id+'-forward',label:`${from} → ${to}`,from,to,factor,offset:forwardOffset}));
 conversions.push(Object.freeze({category,id:id+'-reverse',label:`${to} → ${from}`,from:to,to:from,factor:1/factor,offset:reverseOffset}));
}
pair('Comprimento','in-cm','in','cm',2.54);
pair('Comprimento','ft-m','ft','m',0.3048);
pair('Comprimento','yd-m','yd','m',0.9144);
pair('Comprimento','mile-km','mile','km',1.609344);
pair('Comprimento','nmi-m','n mile','m',1852);
// NIST SP 811 (2008), tabela B.8: valor aproximado de parsec.
pair('Comprimento','pc-km','pc','km',3.085678e13);
pair('Área','acre-m2','acre (survey)','m²',4046.873);
pair('Volume','gal-us-l','gal (US)','L',3.785411784);
pair('Volume','gal-uk-l','gal (UK)','L',4.54609);
pair('Massa','oz-g','oz','g',28.349523125);
pair('Massa','lb-kg','lb','kg',0.45359237);
pair('Velocidade','kmh-ms','km/h','m/s',1/3.6);
pair('Pressão','atm-pa','atm','Pa',101325);
pair('Pressão','mmhg-pa','mmHg','Pa',133.3224);
pair('Pressão','kgfcm2-pa','kgf/cm²','Pa',98066.5);
pair('Pressão','lbf-in2-kpa','lbf/in²','kPa',6.894757293168361);
pair('Energia','kgfm-j','kgf m','J',9.80665);
pair('Energia','j-cal15','J','cal (15 °C)',1/4.1858);
pair('Potência','hp-kw','hp','kW',0.7456998715822702);
pair('Temperatura','f-c','°F','°C',5/9,-160/9,32);
export const CONVERSIONS=Object.freeze(conversions);
export function getConstant(id){const c=CONSTANTS.find(x=>x.id===String(id));if(!c)throw Error('Constante inválida');return c}
export function convert(id,value){const c=CONVERSIONS.find(x=>x.id===String(id));if(!c)throw Error('Conversão inválida');if(typeof value!=='number'||!Number.isFinite(value))throw Error('Math ERROR');const n=value*c.factor+c.offset;if(!Number.isFinite(n))throw Error('Math ERROR');return Object.is(n,-0)?0:n}
