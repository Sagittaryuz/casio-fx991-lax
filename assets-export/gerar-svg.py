from pathlib import Path
from base64 import b64encode
p=Path(__file__).resolve().parent
tex=b64encode((p.parent / 'public' / 'face-texture.webp').read_bytes()).decode()
def svg(name,w,h,content,defs=''):
    s=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{defs}</defs>{content}</svg>'
    (p/(name+'.svg')).write_text(s)
def gradient(id,stops,kind='linear',args='x1="0" y1="0" x2="0" y2="1"'):
    return f'<{kind}Gradient id="{id}" {args}>'+''.join(f'<stop offset="{a}%" stop-color="{b}"/>' for a,b in stops)+f'</{kind}Gradient>'
metal=gradient('metal',[(0,'#67696c'),(10,'#f2f2f1'),(35,'#9b9c9e'),(68,'#dadadc'),(88,'#f6f6f5'),(100,'#65676a')],args='x1="0" y1="0" x2="1" y2=".15"')
frame='<path fill="url(#metal)" fill-rule="evenodd" d="M150 15 H1050 Q1185 15 1185 150 V2410 Q1185 2550 1040 2550 H160 Q15 2550 15 2410 V150 Q15 15 150 15 Z M165 47 Q47 47 47 165 V2395 Q47 2518 165 2518 H1035 Q1153 2518 1153 2395 V165 Q1153 47 1035 47 Z"/><path fill="none" stroke="#f5f5f5" stroke-opacity=".55" stroke-width="3" d="M150 19 H1050 Q1180 19 1180 150 V2410 Q1180 2545 1040 2545 H160 Q20 2545 20 2410 V150 Q20 19 150 19 Z"/>'
svg('01-moldura',1200,2570,frame,metal)
pattern=f'<pattern id="grain" width="1140" height="2470" patternUnits="userSpaceOnUse"><image width="1140" height="2470" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/webp;base64,{tex}"/></pattern>'
plate='<rect x="10" y="10" width="1120" height="2450" rx="135" fill="#1f2021"/><rect x="10" y="10" width="1120" height="2450" rx="135" fill="url(#grain)"/><rect x="10" y="10" width="1120" height="2450" rx="135" fill="#0a0a0a" opacity=".48"/><rect x="13" y="13" width="1114" height="2444" rx="132" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="6"/>'
svg('02-placa',1140,2470,plate,pattern)
bezel=gradient('bezel',[(0,'#080909'),(28,'#383d40'),(50,'#131516'),(100,'#080909')],args='x1="0" y1="0" x2="1" y2="1"')
lcd=gradient('lcd',[(0,'#d5e3df'),(60,'#b8ccc7'),(100,'#d0ded8')],args='x1="0" y1="0" x2="1" y2="1"')
grid='<pattern id="pixels" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 0H9 M0 0V9" stroke="#172822" stroke-opacity=".05" stroke-width="1"/></pattern>'
display='<rect x="10" y="10" width="1180" height="470" rx="38" fill="url(#bezel)" stroke="#050505" stroke-width="8"/><rect x="58" y="55" width="1084" height="380" rx="18" fill="url(#lcd)" stroke="#80968d" stroke-width="6"/><rect x="58" y="55" width="1084" height="380" rx="18" fill="url(#pixels)"/><path d="M80 70H1120" stroke="#fff" stroke-opacity=".33" stroke-width="4"/>'
svg('03-visor',1200,490,display,bezel+lcd+grid)
solar=gradient('solar',[(0,'#301819'),(45,'#130d0e'),(100,'#3b2021')],args='x1="0" y1="0" x2="1" y2="1"')
svg('04-painel-solar',700,230,'<rect x="7" y="7" width="686" height="216" rx="25" fill="url(#solar)" stroke="#111" stroke-width="8"/><path d="M145 17V215 M282 17V215 M419 17V215 M556 17V215" stroke="#070606" stroke-opacity=".36" stroke-width="5"/><path d="M25 20H675" stroke="#fff" stroke-opacity=".08" stroke-width="3"/>',solar)
for name,colors in [('05-tecla-clara',[(0,'#fff'),(45,'#ececf0'),(100,'#c9c9cf')]),('06-tecla-azul',[(0,'#2c7bdd'),(55,'#0750b5'),(100,'#003376')]),('07-tecla-escura',[(0,'#5b5e60'),(35,'#323538'),(100,'#191b1c')])]:
    grad=gradient('key',colors); shape='<rect x="17" y="21" width="466" height="238" rx="47" fill="#080909" opacity=".75"/><rect x="14" y="10" width="472" height="238" rx="47" fill="url(#key)" stroke="#101010" stroke-width="7"/><path d="M50 20 Q32 20 26 38 H474 Q468 20 450 20 Z" fill="#fff" opacity=".23"/>'
    svg(name,500,280,shape,grad)
radial=gradient('round',[(0,'#ededed'),(30,'#4e5255'),(65,'#161819'),(100,'#b9bcbc')],kind='radial',args='cx="50%" cy="46%" r="60%"')
svg('08-tecla-metalica',350,350,'<circle cx="175" cy="180" r="166" fill="#050606"/><circle cx="175" cy="170" r="153" fill="url(#round)" stroke="#080909" stroke-width="8"/><path d="M75 75 Q175 2 275 75" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>',radial)
directional=gradient('dir',[(0,'#25282a'),(30,'#d5d6d6'),(65,'#4a4e50'),(100,'#101112')],args='x1="0" y1="0" x2="1" y2="1"')
svg('09-direcional',700,490,'<path d="M350 8 L470 50 690 180 690 310 470 440 350 482 230 440 10 310 10 180 230 50 Z" fill="#090a0a"/><path d="M350 24 L464 62 580 142 350 218 120 142 236 62 Z M676 185 L676 305 484 421 380 245 580 151 Z M350 466 L236 428 120 348 350 272 580 348 464 428 Z M24 185 L120 151 320 245 216 421 24 305 Z" fill="url(#dir)" stroke="#17191a" stroke-width="6"/><path d="M350 148 L449 245 350 342 251 245 Z" fill="#111314" stroke="#080909" stroke-width="10"/><path d="M78 245l24-20v40z M622 245l-24-20v40z M350 54l-20 23h40z M350 436l-20-23h40z" fill="#131515"/>',directional)
