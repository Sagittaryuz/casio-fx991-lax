import SwiftUI
import UIKit

private struct Key: Identifiable {
    let title: String
    let action: String
    var secondary: String = ""
    var blue = false
    var id: String { action }
}
private let scientific: [[Key]] = [
    [Key(title:"OPTN",action:"optn",secondary:"QR"),Key(title:"CALC",action:"calc",secondary:"SOLVE"),Key(title:"∫",action:"integral",secondary:"d/dx"),Key(title:"x",action:"variableX",secondary:"Σ")],
    [Key(title:"□⁄□",action:"fraction",secondary:"a b/c"),Key(title:"√□",action:"sqrt",secondary:"∛"),Key(title:"x²",action:"square",secondary:"x³"),Key(title:"x□",action:"power",secondary:"□√"),Key(title:"log□",action:"log",secondary:"10ˣ"),Key(title:"ln",action:"ln",secondary:"eˣ")],
    [Key(title:"(−)",action:"negative",secondary:"log A"),Key(title:"° ′ ″",action:"dms",secondary:"FACT B"),Key(title:"x⁻¹",action:"inverse",secondary:"x! C"),Key(title:"sin",action:"sin",secondary:"sin⁻¹ D"),Key(title:"cos",action:"cos",secondary:"cos⁻¹ E"),Key(title:"tan",action:"tan",secondary:"tan⁻¹ F")],
    [Key(title:"STO",action:"store",secondary:"RECALL"),Key(title:"ENG",action:"eng",secondary:"←"),Key(title:"(",action:"(",secondary:"Abs"),Key(title:")",action:")",secondary:"x"),Key(title:"S⇔D",action:"toggle",secondary:"a b/c y"),Key(title:"M+",action:"memory",secondary:"M− M")]
]
private let numerical: [[Key]] = [
    [Key(title:"7",action:"7",secondary:"CONST"),Key(title:"8",action:"8",secondary:"CONV"),Key(title:"9",action:"9",secondary:"RESET"),Key(title:"DEL",action:"del",secondary:"INS UNDO",blue:true),Key(title:"AC",action:"clear",secondary:"OFF",blue:true)],
    [Key(title:"4",action:"4"),Key(title:"5",action:"5"),Key(title:"6",action:"6"),Key(title:"×",action:"*",secondary:"nPr"),Key(title:"÷",action:"/",secondary:"nCr")],
    [Key(title:"1",action:"1"),Key(title:"2",action:"2"),Key(title:"3",action:"3"),Key(title:"+",action:"+",secondary:"Pol"),Key(title:"−",action:"-",secondary:"Rec")],
    [Key(title:"0",action:"0",secondary:"Rnd"),Key(title:",",action:",",secondary:"Ran#"),Key(title:"×10ˣ",action:"exp",secondary:"π"),Key(title:"Ans",action:"ans",secondary:"%"),Key(title:"=",action:"equals",secondary:"≈")]
]
private enum Artwork {
    static let names = ["body-photo", "bezel-photo", "lcd-surface", "round", "direction-photo"]
    static let cache: [String: UIImage] = Dictionary(uniqueKeysWithValues: names.compactMap { name -> (String, UIImage)? in
        guard let path = Bundle.main.path(forResource: name, ofType: "webp"), let image = UIImage(contentsOfFile: path) else { return nil }
        return (name, image)
    })
}
private let modes = ["Calcular", "Complexos", "Base-N", "Matriz", "Vetor", "Estatística", "Distribuição", "Planilha", "Tabela", "Equação", "Desigualdade", "Proporção"]

struct CalculatorView: View {
    @StateObject private var model = CalculatorModel()
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height
            ZStack {
                photo("body-photo").resizable().frame(width: width, height: height)
                VStack(spacing: 0) {
                    display.frame(height: height * 0.19).padding(.horizontal, width * 0.045).padding(.top, 10)
                    controls.frame(height: height * 0.13).padding(.horizontal, width * 0.045)
                    VStack(spacing: max(3, height * 0.008)) {
                        ForEach(Array(scientific.enumerated()), id: \.offset) { index, row in
                            if index == 0 { firstRow(row) } else { keyRow(row, numeric: false) }
                        }
                        ForEach(Array(numerical.enumerated()), id: \.offset) { _, row in keyRow(row, numeric: true) }
                    }.padding(.horizontal, width * 0.045).padding(.bottom, max(10, geometry.safeAreaInsets.bottom))
                }
            }.background(Color.black).ignoresSafeArea(edges: .bottom)
        }.preferredColorScheme(.dark)
    }
    private var display: some View {
        GeometryReader { proxy in
            ZStack {
                photo("bezel-photo").resizable()
                ZStack(alignment: .topLeading) {
                    photo("lcd-surface").resizable()
                    if model.setupVisible { setup }
                    else if model.menuVisible { menu }
                    else {
                        VStack(alignment:.leading, spacing: 0) {
                            HStack { Text(model.angle == "DEG" ? "D" : model.angle == "RAD" ? "R" : "G"); Text(model.shifted ? "S" : model.alpha ? "A" : ""); Spacer(); Text(model.status).lineLimit(1) }.font(.system(size: 8, weight:.bold, design:.monospaced))
                            ScrollView(.horizontal, showsIndicators:false) { Text(model.expression.isEmpty ? " " : model.expression).font(.system(size: 25, design: .monospaced)).lineLimit(1) }
                            Spacer(minLength: 0)
                            HStack { Spacer(minLength:0); Text(model.result).font(.system(size: 36, weight:.medium, design:.monospaced)).minimumScaleFactor(0.35).lineLimit(1).accessibilityIdentifier("result") }
                        }.padding(5).foregroundStyle(Color(red:0.05,green:0.1,blue:0.08))
                    }
                }.frame(width:proxy.size.width*0.87,height:proxy.size.height*0.67)
            }
        }.accessibilityElement(children: .contain)
    }
    private var setup: some View {
        HStack { ForEach(["DEG", "RAD", "GRAD"], id: \.self) { unit in
            Button(unit) { model.setAngle(unit) }.font(.system(size:14,weight:.bold)).foregroundStyle(.black).frame(maxWidth:.infinity)
        }}.accessibilityIdentifier("setup")
    }
    private var menu: some View {
        let start = model.menuIndex >= 8 ? 4 : 0
        return ScrollView { LazyVGrid(columns:Array(repeating:GridItem(.flexible(),spacing:2),count:4),spacing:2) {
            ForEach(Array(modes.enumerated()).filter { $0.offset >= start && $0.offset < start + 8 }, id: \.offset) { index, name in
                Button { model.selectMode(name) } label: { VStack(spacing:2) { Text("\(index+1)").font(.system(size:14,weight:.bold));Text(name).font(.system(size:9,weight:.bold)).lineLimit(1).minimumScaleFactor(0.6) }.frame(maxWidth:.infinity,minHeight:27).background(index == model.menuIndex ? Color.black.opacity(0.28) : Color.black.opacity(0.08)) }.buttonStyle(.plain)
            }
        }}.foregroundStyle(.black).padding(3).accessibilityIdentifier("modes")
    }
    private var controls: some View {
        GeometryReader { proxy in
            HStack(alignment:.top, spacing:0) {
                round("SHIFT", action:"shift", color:.yellow)
                round("ALPHA", action:"alpha", color:.pink)
                Spacer(minLength:proxy.size.width*0.32)
                round("MENU SETUP", action:"menu", color:.white)
                round("ON", action:"on", color:.white)
            }
            .frame(maxWidth:.infinity)
            direction.frame(width:proxy.size.width*0.31,height:proxy.size.width*0.20).position(x:proxy.size.width/2,y:proxy.size.height*0.91)
        }
    }
    private func round(_ title:String, action:String, color:Color) -> some View {
        GeometryReader { g in
            VStack(spacing:2) { Text(title).font(.system(size:8,weight:.bold)).foregroundStyle(color).lineLimit(1).minimumScaleFactor(0.5)
                Button { model.press(action) } label: { photo("round").resizable().aspectRatio(1,contentMode:.fit) }.buttonStyle(.plain).accessibilityLabel(title).accessibilityIdentifier("key-\(action)")
            }.frame(width:g.size.width)
        }.frame(maxWidth:.infinity)
    }
    private var direction: some View {
        GeometryReader { p in
            ZStack {
                photo("direction-photo").resizable()
                HStack(spacing:0) {
                    arrow("left", label:"Esquerda").frame(width:p.size.width*0.32)
                    VStack(spacing:0) { arrow("up",label:"Acima");arrow("down",label:"Abaixo") }.frame(width:p.size.width*0.36)
                    arrow("right",label:"Direita").frame(width:p.size.width*0.32)
                }
            }
        }
    }
    private func arrow(_ name:String,label:String) -> some View {
        Button { model.press(name) } label: { Color.clear.contentShape(Rectangle()) }.buttonStyle(.plain).accessibilityLabel(label).accessibilityIdentifier("key-\(name)")
    }
    private func firstRow(_ row:[Key]) -> some View {
        HStack(spacing:4) { key(row[0],numeric:false);key(row[1],numeric:false);Spacer().frame(maxWidth:.infinity);key(row[2],numeric:false);key(row[3],numeric:false) }
    }
    private func keyRow(_ row:[Key], numeric:Bool) -> some View { HStack(spacing:4) { ForEach(row) { key($0,numeric:numeric) } } }
    private func key(_ key:Key, numeric:Bool) -> some View {
        VStack(spacing:2) {
            Text(key.secondary.isEmpty ? " " : key.secondary).font(.system(size:8,weight:.bold)).foregroundStyle(Color(red:0.85,green:0.74,blue:0.4)).lineLimit(1).minimumScaleFactor(0.6)
            Button { model.press(key.action) } label: {
                Text(key.title).font(.system(size:numeric ? 23 : 14,weight:.bold)).foregroundStyle(key.blue ? .white : numeric ? .black : .white).frame(maxWidth:.infinity,maxHeight:.infinity)
                    .background(LinearGradient(colors:key.blue ? [.blue,Color(red:0,green:0.18,blue:0.5)] : numeric ? [.white,Color(white:0.78)] : [Color(white:0.32),Color(white:0.09)],startPoint:.top,endPoint:.bottom),in:RoundedRectangle(cornerRadius:5))
            }.buttonStyle(.plain).accessibilityLabel(key.title).accessibilityIdentifier("key-\(key.action)")
        }.frame(maxWidth:.infinity,maxHeight:.infinity)
    }
    private func photo(_ name:String) -> Image {
        guard let image = Artwork.cache[name] else { return Image(systemName:"square") }
        return Image(uiImage:image)
    }
}
