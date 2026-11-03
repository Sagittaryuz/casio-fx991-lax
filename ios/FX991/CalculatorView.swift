import SwiftUI
import UIKit

private struct Key: Identifiable {
    let title: String
    let action: String
    var secondary: String = ""
    var blue = false
    var id: String { action }
}
/// Corner geometry follows the reviewed keys in the reference, including STO and M+.
private struct KeyOutline: Shape {
    let action: String
    func path(in rect: CGRect) -> Path {
        let small = min(5, min(rect.width,rect.height) / 4)
        let large = min(rect.width * 0.42, rect.height * 0.55)
        let tl = ["optn", "7"].contains(action) ? large : small
        let tr = ["variableX", "clear"].contains(action) ? large : small
        let bl = ["store", "0"].contains(action) ? large : small
        let br = ["memory", "equals"].contains(action) ? large : small
        var p = Path()
        p.move(to:CGPoint(x:rect.minX + tl,y:rect.minY))
        p.addLine(to:CGPoint(x:rect.maxX - tr,y:rect.minY))
        p.addQuadCurve(to:CGPoint(x:rect.maxX,y:rect.minY + tr),control:CGPoint(x:rect.maxX,y:rect.minY))
        p.addLine(to:CGPoint(x:rect.maxX,y:rect.maxY - br))
        p.addQuadCurve(to:CGPoint(x:rect.maxX - br,y:rect.maxY),control:CGPoint(x:rect.maxX,y:rect.maxY))
        p.addLine(to:CGPoint(x:rect.minX + bl,y:rect.maxY))
        p.addQuadCurve(to:CGPoint(x:rect.minX,y:rect.maxY - bl),control:CGPoint(x:rect.minX,y:rect.maxY))
        p.addLine(to:CGPoint(x:rect.minX,y:rect.minY + tl))
        p.addQuadCurve(to:CGPoint(x:rect.minX + tl,y:rect.minY),control:CGPoint(x:rect.minX,y:rect.minY))
        p.closeSubpath(); return p
    }
}

/// Vector glyphs adapted from the corresponding in-repository web key drawings.
private struct MathKeyGlyph: View {
    let action: String
    var body: some View {
        Canvas { context, size in
            let width: CGFloat = ["integral", "log"].contains(action) ? 50 : 40
            let scale = min(size.width / width, size.height / 28) * 0.72
            context.translateBy(x:(size.width - width * scale) / 2,y:(size.height - 28 * scale) / 2)
            context.scaleBy(x:scale,y:scale)
            var path = Path()
            func box(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat) { path.addRect(CGRect(x:x,y:y,width:w,height:h)) }
            func line(_ a:CGPoint,_ b:CGPoint) { path.move(to:a); path.addLine(to:b) }
            func text(_ value:String,_ x:CGFloat,_ y:CGFloat,_ font:Font) {
                context.draw(Text(value).font(font).foregroundColor(.white),at:CGPoint(x:x,y:y),anchor:.topLeading)
            }
            switch action {
            case "fraction":
                box(14,2,12,7); line(CGPoint(x:7,y:13),CGPoint(x:33,y:13)); box(14,17,12,7)
            case "sqrt":
                path.move(to:CGPoint(x:3,y:15)); path.addLines([CGPoint(x:8,y:14),CGPoint(x:12,y:22),CGPoint(x:17,y:5),CGPoint(x:36,y:5)]); box(20,9,12,11)
            case "integral":
                box(17,1,6,5); box(17,24,6,5); box(26,10,9,9)
                text("∫",5,0,.system(size:26,design:.serif)); text("dx",37,8,.system(size:12,design:.serif).italic())
            case "power":
                text("x",6,1,.system(size:23,design:.serif).italic()); box(23,3,10,9)
            case "log":
                text("log",1,4,.system(size:17,weight:.bold)); box(30,18,7,7); box(39,9,9,10)
            case "variableX": text("x",7,2,.system(size:25,design:.serif).italic())
            default: break
            }
            context.stroke(path,with:.color(.white),lineWidth:1.5)
        }.accessibilityHidden(true)
    }
}
private struct KeyAnchors: PreferenceKey {
    static var defaultValue: [String:Anchor<CGRect>] = [:]
    static func reduce(value: inout [String:Anchor<CGRect>],nextValue: () -> [String:Anchor<CGRect>]) {
        value.merge(nextValue(),uniquingKeysWith:{ _, new in new })
    }
}

/// Redrawn from the menu vectors and mode order already used by the web app.
private struct MenuGlyph: View {
    let index: Int
    let ink: Color
    var body: some View {
        Canvas { ctx,size in
            let scale = min(size.width / 30,size.height / 21) * 0.88
            ctx.translateBy(x:(size.width - 30 * scale) / 2,y:(size.height - 21 * scale) / 2)
            ctx.scaleBy(x:scale,y:scale)
            var p = Path()
            func line(_ points:[CGPoint]) { guard let first = points.first else { return }; p.move(to:first); for pt in points.dropFirst() { p.addLine(to:pt) } }
            func box(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat) { p.addRect(CGRect(x:x,y:y,width:w,height:h)) }
            func txt(_ text:String,_ x:CGFloat,_ y:CGFloat) { ctx.draw(Text(text).font(.system(size:8,weight:.bold,design:.monospaced)).foregroundColor(ink),at:CGPoint(x:x,y:y),anchor:.topLeading) }
            switch index {
            case 0:
                line([CGPoint(x:4,y:4),CGPoint(x:9,y:9)]); line([CGPoint(x:9,y:4),CGPoint(x:4,y:9)])
                line([CGPoint(x:15,y:6),CGPoint(x:23,y:6)]); line([CGPoint(x:4,y:15),CGPoint(x:10,y:15)]); line([CGPoint(x:7,y:12),CGPoint(x:7,y:18)]); line([CGPoint(x:15,y:15),CGPoint(x:23,y:15)])
            case 1: box(4,3,10,14); txt("i",7,6); line([CGPoint(x:17,y:15),CGPoint(x:25,y:5),CGPoint(x:25,y:15),CGPoint(x:17,y:15)])
            case 2: txt("2 8",3,1); txt("10 16",1,11)
            case 3:
                line([CGPoint(x:5,y:2),CGPoint(x:2,y:2),CGPoint(x:2,y:18),CGPoint(x:5,y:18)]); line([CGPoint(x:25,y:2),CGPoint(x:28,y:2),CGPoint(x:28,y:18),CGPoint(x:25,y:18)])
                for y in [4,12] { for x in [8,17] { box(CGFloat(x),CGFloat(y),5,5) } }
            case 4:
                line([CGPoint(x:4,y:17),CGPoint(x:24,y:17),CGPoint(x:20,y:13)]);line([CGPoint(x:24,y:17),CGPoint(x:20,y:20)]);line([CGPoint(x:4,y:17),CGPoint(x:4,y:3),CGPoint(x:1,y:7)]);line([CGPoint(x:4,y:3),CGPoint(x:7,y:7)]);line([CGPoint(x:4,y:17),CGPoint(x:20,y:3),CGPoint(x:15,y:3)]);line([CGPoint(x:20,y:3),CGPoint(x:20,y:8)])
            case 5: line([CGPoint(x:3,y:2),CGPoint(x:3,y:18),CGPoint(x:26,y:18)]);box(7,14,4,4);box(13,7,4,11);box(19,11,4,7)
            case 6:
                line([CGPoint(x:2,y:18),CGPoint(x:27,y:18)]);p.move(to:CGPoint(x:5,y:17));p.addCurve(to:CGPoint(x:25,y:17),control1:CGPoint(x:10,y:-1),control2:CGPoint(x:20,y:-1));line([CGPoint(x:15,y:2),CGPoint(x:15,y:18)])
            case 7,8:
                box(3,2,24,17);line([CGPoint(x:3,y:7),CGPoint(x:27,y:7)]);line([CGPoint(x:3,y:12),CGPoint(x:27,y:12)]);line([CGPoint(x:3,y:16),CGPoint(x:27,y:16)]);line([CGPoint(x:15,y:2),CGPoint(x:15,y:19)])
                if index == 7 { line([CGPoint(x:9,y:2),CGPoint(x:9,y:19)]);line([CGPoint(x:22,y:2),CGPoint(x:22,y:19)]) }
            case 9: txt("x y",3,0);txt("= 0",4,10)
            case 10: txt("x y",3,0);txt("> 0",4,10)
            case 11: box(3,5,8,10);box(19,5,8,10);line([CGPoint(x:15,y:7),CGPoint(x:15,y:9)]);line([CGPoint(x:15,y:12),CGPoint(x:15,y:14)])
            default: break
            }
            ctx.stroke(p,with:.color(ink),lineWidth:1.6)
        }.accessibilityHidden(true)
    }
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
                photo("body-photo").resizable().frame(width:width,height:height + 16).offset(y:-16)
                    .frame(width:width,height:height,alignment:.top).clipped()
                VStack(spacing: 0) {
                    display.frame(height: height * 0.19).padding(.horizontal, width * 0.045).padding(.top, 10)
                    controls.frame(height: height * 0.13).padding(.horizontal, width * 0.045)
                    VStack(spacing: max(3, height * 0.008)) {
                        ForEach(Array(scientific.enumerated()), id: \.offset) { index, row in
                            if index == 0 { firstRow(row) } else { keyRow(row, numeric: false) }
                        }
                        ForEach(Array(numerical.enumerated()), id: \.offset) { _, row in keyRow(row, numeric: true) }
                    }.padding(.horizontal, width * 0.045).padding(.bottom, max(10, geometry.safeAreaInsets.bottom))
                }.frame(width:width,height:height,alignment:.top)
                .overlayPreferenceValue(KeyAnchors.self) { anchors in
                    GeometryReader { p in
                        if let upper = anchors["shift"], let lower = anchors["optn"] {
                            let center = (p[upper].midY + p[lower].midY) / 2
                            direction.frame(width:width * 0.91 * 0.31,height:width * 0.91 * 0.20)
                                .position(x:width / 2,y:center)
                        }
                    }
                }
            }.frame(width:width,height:height,alignment:.top).background(Color.black).ignoresSafeArea(edges: .bottom)
        }.preferredColorScheme(.dark)
        .onAppear {
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("--screenshot-menu") { model.press("menu") }
            #endif
        }
    }
    private var display: some View {
        GeometryReader { proxy in
            ZStack {
                photo("bezel-photo").resizable()
                ZStack(alignment: .topLeading) {
                    photo("lcd-surface").resizable()
                    if model.mainOptionsOpen { mainOptions }
                    else if model.setupVisible { setup }
                    else if model.catalogKind != nil { catalog }
                    else if model.menuVisible { menu }
                    else if model.advancedMode == "Planilha" && model.sheetGrid { sheetGrid }
                    else if model.advancedMode != nil { advanced }
                    else {
                        VStack(alignment:.leading, spacing: 0) {
                            HStack { Text(model.angle == "DEG" ? "D" : model.angle == "RAD" ? "R" : "G"); Text(model.shifted ? "S" : model.alpha ? "A" : ""); Spacer(); Text(model.status).lineLimit(1) }.font(.system(size: 8, weight:.bold, design:.monospaced))
                            ScrollView(.horizontal, showsIndicators:false) { NaturalLine(text:model.expression,size:24,cursor:model.cursor,onSelect:model.selectExpressionCursor).fixedSize() }
                            Spacer(minLength: 0)
                            HStack { Spacer(minLength:0); NaturalLine(text:model.result,size:min(36,proxy.size.width * 0.72 / CGFloat(max(1,model.result.count)) / 0.65)).accessibilityIdentifier("result") }
                        }.padding(5).foregroundStyle(Color(red:0.05,green:0.1,blue:0.08))
                    }
                }.frame(width:proxy.size.width*0.87,height:proxy.size.height*0.67)
            }
        }.accessibilityElement(children: .contain)
    }
    private var mainOptions: some View {
        VStack(alignment:.leading) {
            Text("OPTN").font(.system(size:10,weight:.bold))
            Button("1: Δ% (variação percentual)") { model.press("1") }
            Button("2: Refazer edição") { model.press("2") }
        }.font(.system(size:12,weight:.bold,design:.monospaced)).buttonStyle(.plain).padding(4).foregroundStyle(.black).accessibilityIdentifier("main-options")
    }
    private var sheetGrid: some View {
        let firstRow = min(max(1,model.sheetRow - 1),43)
        return VStack(spacing:1) {
            HStack(spacing:1) {
                Text(" ").frame(width:18)
                ForEach(0..<5,id: \.self) { col in Text(String(UnicodeScalar(65 + col)!)).frame(maxWidth:.infinity) }
            }
            ForEach(firstRow..<(firstRow + 3),id: \.self) { row in
                HStack(spacing:1) {
                    Text("\(row)").frame(width:18)
                    ForEach(0..<5,id: \.self) { col in
                        let address = String(UnicodeScalar(65 + col)!) + String(row)
                        let selected = row == model.sheetRow && col == model.sheetColumn
                        Button { model.editSheetCell(column:col,row:row) } label: {
                            Text(model.sheetValues[address] ?? model.sheetCells[address] ?? " ").lineLimit(1).frame(maxWidth:.infinity,minHeight:15)
                                .foregroundStyle(selected ? Color.white : Color.black)
                                .background(selected ? Color.black : Color.black.opacity(0.08))
                        }.buttonStyle(.plain).accessibilityLabel("Célula \(address), \(model.sheetValues[address] ?? model.sheetCells[address] ?? "vazia")")
                    }
                }
            }
            Text("\(String(UnicodeScalar(65 + model.sheetColumn)!))\(model.sheetRow)  =: editar  OPTN: ações").frame(maxWidth:.infinity,alignment:.leading)
        }.font(.system(size:10,weight:.medium,design:.monospaced)).padding(3).foregroundStyle(.black).accessibilityIdentifier("sheet-grid")
    }
    private var catalog: some View {
        VStack(alignment:.leading,spacing:2) {
            Text(model.catalogKind ?? "Catálogo").font(.system(size:10,weight:.bold))
            ScrollViewReader { reader in
                ScrollView(.vertical,showsIndicators:false) {
                    VStack(alignment:.leading,spacing:1) {
                        ForEach(Array(model.catalogItems.enumerated()),id: \.offset) { index,item in
                            Button { model.selectCatalogItem(index) } label: {
                                Text((item.symbol.map { $0 + " · " } ?? "") + item.label)
                                    .font(.system(size:11,weight:.medium,design:.monospaced)).lineLimit(1)
                                    .frame(maxWidth:.infinity,alignment:.leading)
                                    .foregroundStyle(index == model.catalogIndex ? Color.white : Color.black)
                                    .background(index == model.catalogIndex ? Color.black : Color.clear)
                            }.buttonStyle(.plain).id(index)
                        }
                    }
                }.onChange(of:model.catalogIndex) { index in reader.scrollTo(index,anchor:.center) }
            }
        }.padding(3).foregroundStyle(.black).accessibilityIdentifier("catalog")
    }
    private var advanced: some View {
        let captions = ["Complexos":"z₁ + z₂", "Base-N":"Conversão de base", "Matriz":"Determinante 2×2", "Vetor":"Produto escalar 3D", "Estatística":"Uma variável · 3 dados", "Distribuição":"Normal acumulada", "Planilha":"Editar célula", "PlanilhaAções":"Ações da planilha", "Tabela":"Tabela f(x)", "Equação":"ax² + bx + c = 0", "Desigualdade":"ax² + bx + c ≥ 0", "Proporção":"a:b = c:x", "Integral":"Integral definida", "Derivada":"Derivada numérica", "Somatório":"Somatório", "CALC":"Substituição x,A,B", "SOLVE":"Resolver para x", "Pol":"Retangular → polar", "Rec":"Polar → retangular", "DMS":"Graus, minutos e segundos", "FATOR":"Fatoração prima", "ENG":"Notação de engenharia", "CONV":"Conversão", "Δ%":"Variação percentual"]
        return VStack(alignment:.leading,spacing:2) {
            Text(model.advancedOperation.isEmpty ? (captions[model.advancedMode ?? ""] ?? "Modo") : model.advancedOperation).font(.system(size:10,weight:.bold)).lineLimit(1)
            if model.operationsOpen {
                ScrollViewReader { reader in
                    ScrollView(.vertical,showsIndicators:false) {
                        VStack(alignment:.leading,spacing:1) {
                            ForEach(Array((CalculatorModel.operations[model.advancedMode ?? ""] ?? []).enumerated()), id: \.offset) { i, name in
                                Button { model.selectAdvancedOperation(i) } label: { Text(name).font(.system(size:12,weight:.medium,design:.monospaced)).frame(maxWidth:.infinity,alignment:.leading).foregroundStyle(i == model.operationIndex ? Color.white : Color.black).background(i == model.operationIndex ? Color.black : Color.clear) }.buttonStyle(.plain).id(i)
                            }
                        }
                    }.onChange(of:model.operationIndex) { i in reader.scrollTo(i,anchor:.center) }
                }
            } else { ScrollViewReader { reader in
                ScrollView(.vertical,showsIndicators:false) {
                    VStack(alignment:.leading,spacing:1) {
                        ForEach(model.advancedFields.indices,id: \.self) { i in
                            Button { model.selectAdvancedField(i) } label: {
                                HStack(spacing:3) { Text(model.advancedLabels[i] + ":"); Text(model.advancedFieldText(i)).lineLimit(1); Spacer(minLength:0) }
                                    .font(.system(size:12,weight:.medium,design:.monospaced)).padding(.horizontal,2)
                                    .foregroundStyle(i == model.advancedIndex ? Color.white : Color.black)
                                    .background(i == model.advancedIndex ? Color.black : Color.clear)
                            }.buttonStyle(.plain).id(i)
                        }
                    }
                }.onChange(of:model.advancedIndex) { index in reader.scrollTo(index,anchor:.center) }
            }
            if model.status != "CALCULAR" { Text(model.status).font(.system(size:9,weight:.bold)).lineLimit(1) }
            if model.advancedNumeric != nil { Text("Ans: usar resultado").font(.system(size:8,weight:.medium)).lineLimit(1) }
            if !model.advancedResult.isEmpty { ScrollView(.horizontal,showsIndicators:false) { Text(model.advancedResult).font(.system(size:12,weight:.bold,design:.monospaced)).lineLimit(1).accessibilityIdentifier("advanced-result") } }
            }
        }.padding(3).foregroundStyle(.black).accessibilityIdentifier("advanced-mode")
    }
    private var setup: some View {
        ScrollView(.vertical,showsIndicators:false) {
            VStack(alignment:.leading,spacing:2) {
                if model.setupPage == "root" {
                    Button("1: Ângulo") { model.setupPage = "angle" }
                    Button("2: Formato") { model.setupPage = "format" }
                } else if model.setupPage == "angle" {
                    ForEach(Array(["DEG", "RAD", "GRAD"].enumerated()),id: \.offset) { index,unit in
                        Button("\(index + 1): \(unit)") { model.setAngle(unit) }
                    }
                } else if model.setupPage == "format" {
                    ForEach(Array(["NORM", "FIX", "SCI"].enumerated()),id: \.offset) { index,format in
                        Button("\(index + 1): \(format)") { model.chooseFormat(format) }
                    }
                } else {
                    Text("Casas / algarismos: 0–9")
                    HStack { ForEach(0..<10,id: \.self) { digit in Button("\(digit)") { model.setFormatDigits(digit) }.frame(maxWidth:.infinity) } }
                }
            }.font(.system(size:12,weight:.bold,design:.monospaced)).foregroundStyle(.black).buttonStyle(.plain).frame(maxWidth:.infinity,alignment:.leading)
        }.padding(3).accessibilityIdentifier("setup")
    }
    private var menu: some View {
        let start = model.menuIndex >= 8 ? 4 : 0
        let shortcut = Array("123456789ABC")
        return GeometryReader { p in
            VStack(alignment:.leading,spacing:2) {
                LazyVGrid(columns:Array(repeating:GridItem(.flexible(),spacing:2),count:4),spacing:1) {
                    ForEach(start..<(start + 8),id: \.self) { index in
                        let selected = index == model.menuIndex
                        let ink: Color = selected ? .white : .black
                        Button { model.selectMode(modes[index]) } label: {
                            ZStack(alignment:.bottomTrailing) {
                                MenuGlyph(index:index,ink:ink).padding(.horizontal,5)
                                Text(String(shortcut[index])).font(.system(size:8,weight:.bold,design:.monospaced)).padding(.horizontal,2)
                                    .foregroundStyle(selected ? Color.black : Color.white).background(selected ? Color.white : Color.black)
                            }.frame(maxWidth:.infinity).frame(height:max(10,p.size.height * 0.33))
                                .foregroundStyle(ink).background(selected ? Color.black : Color.clear)
                                .overlay(alignment:.bottom) { Rectangle().frame(height:0.5).foregroundStyle(.black) }
                        }.buttonStyle(.plain).accessibilityLabel("\(shortcut[index]): \(modes[index])")
                    }
                }
                HStack(spacing:3) {
                    Text("\(shortcut[model.menuIndex]):\(modes[model.menuIndex])").lineLimit(1)
                    Spacer(minLength:0); Text(start == 0 ? "▼" : "▲")
                }.font(.system(size:11,weight:.bold,design:.monospaced)).foregroundStyle(.black)
            }.padding(3)
        }.accessibilityIdentifier("modes")
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
        }
    }
    private func round(_ title:String, action:String, color:Color) -> some View {
        GeometryReader { g in
            VStack(spacing:2) { Text(title).font(.system(size:8,weight:.bold)).foregroundStyle(color).lineLimit(1).minimumScaleFactor(0.5)
                Button { model.press(action) } label: { photo("round").resizable().aspectRatio(1,contentMode:.fit) }.buttonStyle(.plain).accessibilityLabel(title).accessibilityIdentifier("key-\(action)")
                    .anchorPreference(key:KeyAnchors.self,value:.bounds) { [action:$0] }
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
                Group {
                    if ["fraction", "sqrt", "integral", "power", "log", "variableX"].contains(key.action) { MathKeyGlyph(action:key.action) }
                    else { Text(key.title).font(.system(size:numeric ? 23 : 14,weight:.bold)).foregroundStyle(key.blue ? .white : numeric ? .black : .white) }
                }.frame(maxWidth:.infinity,maxHeight:.infinity)
                    .background(LinearGradient(colors:key.blue ? [.blue,Color(red:0,green:0.18,blue:0.5)] : numeric ? [.white,Color(white:0.78)] : [Color(white:0.32),Color(white:0.09)],startPoint:.top,endPoint:.bottom),in:KeyOutline(action:key.action))
            }.buttonStyle(.plain).accessibilityLabel(key.title).accessibilityIdentifier("key-\(key.action)")
                .anchorPreference(key:KeyAnchors.self,value:.bounds) { [key.action:$0] }
        }.frame(maxWidth:.infinity,maxHeight:.infinity)
    }
    private func photo(_ name:String) -> Image {
        guard let image = Artwork.cache[name] else { return Image(systemName:"square") }
        return Image(uiImage:image)
    }
}
