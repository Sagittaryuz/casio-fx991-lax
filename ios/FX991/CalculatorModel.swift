import Foundation
import JavaScriptCore

private struct EngineReply: Decodable {
    let ok: Bool
    let value: Double?
    let decimal: String?
    let exact: String?
    let error: String?
}

/// A serial queue owns the JS context, keeping expensive calculations off the UI thread.
struct NativeCatalogEntry: Decodable, Identifiable {
    let id: String
    let label: String
    let category: String
    let symbol: String?
    let value: Double?
    let unit: String?
}
private struct NativeCatalog: Decodable {
    let constants: [NativeCatalogEntry]
    let conversions: [NativeCatalogEntry]
}
private struct AdvancedReply: Decodable {
    let ok: Bool
    let result: String?
    let display: String?
    let snapshot: String?
    let error: String?
}

private enum Engine {
    static let queue = DispatchQueue(label: "fx991.engine", qos: .userInitiated)
    static var context: JSContext?
    static func calculate(_ payload: [String: Any], completion: @escaping (Result<EngineReply, Error>) -> Void) {
        run("nativeCalculate", payload: payload, completion: completion)
    }
    static func advanced(_ payload: [String: Any], completion: @escaping (Result<AdvancedReply, Error>) -> Void) {
        run("nativeAdvanced", payload: payload, completion: completion)
    }
    private static func run<T: Decodable>(_ function: String, payload: [String: Any], completion: @escaping (Result<T, Error>) -> Void) {
        queue.async {
            do {
                if context == nil {
                    guard let url = Bundle.main.url(forResource: "engine.bundle", withExtension: "js"),
                          let js = JSContext() else { throw NSError(domain: "Engine", code: 1) }
                    let source = try String(contentsOf: url, encoding: .utf8)
                    js.evaluateScript(source)
                    if let error = js.exception { throw NSError(domain: "Engine", code: 2, userInfo: [NSLocalizedDescriptionKey: error.toString()]) }
                    context = js
                }
                guard let js = context, let fn = js.objectForKeyedSubscript(function),
                      let text = fn.call(withArguments: [payload])?.toString(),
                      let data = text.data(using: .utf8) else { throw NSError(domain: "Engine", code: 3) }
                let answer = try JSONDecoder().decode(T.self, from: data)
                DispatchQueue.main.async { completion(.success(answer)) }
            } catch {
                DispatchQueue.main.async { completion(.failure(error)) }
            }
        }
    }
}

@MainActor final class CalculatorModel: ObservableObject {
    @Published var expression = ""
    @Published var cursor = 0
    @Published var result = "0"
    @Published var angle = "DEG"
    @Published var shifted = false
    @Published var alpha = false
    @Published var menuVisible = false
    @Published var setupVisible = false
    @Published var setupPage = "root"
    @Published var displayFormat = "NORM"
    @Published var displayDigits = 1
    private var pendingFormat = "NORM"
    @Published var menuIndex = 0
    @Published var catalogKind: String? = nil
    @Published var catalogIndex = 0
    @Published var catalogItems: [NativeCatalogEntry] = []
    private var catalog: NativeCatalog?
    @Published var advancedMode: String? = nil
    @Published var advancedFields: [String] = []
    @Published var advancedLabels: [String] = []
    @Published var advancedIndex = 0
    @Published var advancedCursor = 0
    @Published var advancedResult = ""
    @Published var advancedNumeric: Double? = nil
    @Published var advancedOperation = ""
    @Published var mainOptionsOpen = false
    @Published var sheetGrid = false
    @Published var sheetColumn = 0
    @Published var sheetRow = 1
    @Published var sheetCells: [String:String] = [:]
    @Published var sheetValues: [String:String] = [:]
    private var sheetGeneration = 0
    @Published var operationsOpen = false
    @Published var operationIndex = 0
    static let operations: [String: [String]] = [
        "Complexos": ["Somar", "Subtrair", "Multiplicar", "Dividir", "Retangular → polar", "Polar → retangular"],
        "Base-N": ["Converter", "Somar", "Subtrair", "Multiplicar", "Dividir", "AND", "OR", "XOR", "XNOR", "NOT"],
        "Matriz": ["Determinante", "Inversa", "Transposta", "Somar", "Multiplicar", "Determinante 3×3", "Inversa 3×3", "Transposta 3×3", "Somar 3×3", "Multiplicar 3×3", "Determinante 4×4", "Inversa 4×4", "Transposta 4×4", "Somar 4×4", "Multiplicar 4×4", "Subtrair", "Escalar por número", "Subtrair 3×3", "Escalar por número 3×3", "Subtrair 4×4", "Escalar por número 4×4"],
        "Vetor": ["Escalar", "Vetorial", "Somar", "Subtrair", "Norma", "Ângulo", "Escalar 2D", "Somar 2D", "Subtrair 2D", "Norma 2D", "Ângulo 2D", "Unitário", "Escalar por número", "Unitário 2D", "Escalar por número 2D"],
        "Estatística": ["1 variável", "Linear", "Quadrática", "Logarítmica", "Exponencial", "Potência", "Inversa"],
        "Tabela": ["Uma função", "Duas funções"],
        "DMS": ["Decimal → DMS", "DMS → decimal"],
        "Distribuição": ["Normal CDF", "Normal PDF", "Normal inversa", "Binomial PDF", "Binomial CDF", "Poisson PDF", "Poisson CDF"],
        "Equação": ["Grau 2", "Grau 3", "Grau 4", "Sistema 2×2", "Sistema 3×3", "Sistema 4×4"],
        "Desigualdade": [">=", ">", "<=", "<", "Grau 3 >=", "Grau 3 >", "Grau 3 <=", "Grau 3 <", "Grau 4 >=", "Grau 4 >", "Grau 4 <=", "Grau 4 <"], "Proporção": ["D", "C"]
    ]
    private let sheetKey = "fx991lax.ios.sheet.v1"
    private let angleKey = "fx991lax.ios.angle.v1"
    private let formatKey = "fx991lax.ios.format.v1"
    private let digitsKey = "fx991lax.ios.digits.v1"
    private struct ModeDraft {
        var operation: String
        var fields: [String]
        var selected: Int
        var cursor: Int
        var result: String
        var numeric: Double?
    }
    private var modeDrafts: [String: ModeDraft] = [:]
    private var sheetSnapshot: String? = UserDefaults.standard.string(forKey: "fx991lax.ios.sheet.v1")
    @Published var status = "CALCULAR"
    @Published var calculating = false
    private var ans = 0.0
    private var memory = 0.0
    private var variables = Dictionary(uniqueKeysWithValues: ["A","B","C","D","E","F","x","y","M"].map { ($0, 0.0) })
    private var storePending = false
    private var recallPending = false
    private var completed = false
    private struct EditSnapshot { let expression: String; let cursor: Int; let result: String; let completed: Bool; let exact: String?; let decimal: String; let showExact: Bool }
    private var undoStack: [EditSnapshot] = []
    private var redoStack: [EditSnapshot] = []
    private func currentEdit() -> EditSnapshot {
        EditSnapshot(expression:expression,cursor:cursor,result:result,completed:completed,exact:lastExact,decimal:lastDecimal,showExact:showExact)
    }
    private func rememberEdit() {
        undoStack.append(currentEdit()); if undoStack.count > 100 { undoStack.removeFirst() }
        redoStack.removeAll()
    }
    private func applyEdit(_ state: EditSnapshot) {
        expression = state.expression; cursor = state.cursor; result = state.result; completed = state.completed
        lastExact = state.exact; lastDecimal = state.decimal; showExact = state.showExact; status = "CALCULAR"
    }
    private func undoEdit() {
        guard let state = undoStack.popLast() else { status = "NADA PARA DESFAZER"; return }
        redoStack.append(currentEdit()); applyEdit(state)
    }
    private func redoEdit() {
        guard let state = redoStack.popLast() else { status = "NADA PARA REFAZER"; return }
        undoStack.append(currentEdit()); applyEdit(state)
    }
    private var lastExact: String?
    private var lastDecimal = "0"
    private var showExact = false
    private var generation = 0
    private let variableKeys: [String: String] = ["negative":"A", "dms":"B", "inverse":"C", "sin":"D", "cos":"E", "tan":"F", ")":"x", "toggle":"y", "memory":"M"]

    init() {
        if let url = Bundle.main.url(forResource:"catalog",withExtension:"json"), let data = try? Data(contentsOf:url) {
            catalog = try? JSONDecoder().decode(NativeCatalog.self,from:data)
        }
        if let raw = sheetSnapshot, let data = raw.data(using:.utf8), let object = try? JSONSerialization.jsonObject(with:data) as? [String:Any], let cells = object["cells"] as? [String:String] { sheetCells = cells }
        let saved = UserDefaults.standard.string(forKey: angleKey) ?? "DEG"
        if ["DEG", "RAD", "GRAD"].contains(saved) { angle = saved }
        let format = UserDefaults.standard.string(forKey:formatKey) ?? "NORM"
        let digits = UserDefaults.standard.object(forKey:digitsKey) as? Int ?? 1
        if ["NORM", "FIX", "SCI"].contains(format), (0...9).contains(digits), format != "NORM" || [1,2].contains(digits) { displayFormat = format; displayDigits = digits }
    }
    func press(_ action: String) {
        if action == "on" { reset(); return }
        if calculating { generation += 1; calculating = false }
        if action == "shift" { shifted.toggle(); alpha = false; return }
        if action == "alpha" { alpha.toggle(); shifted = false; return }
        let shift = shifted, alt = alpha
        shifted = false; alpha = false
        if mainOptionsOpen {
            if action == "clear" || action == "menu" || action == "left" { mainOptionsOpen = false }
            else if action == "1" || action == "equals" { mainOptionsOpen = false; openAdvanced("Δ%") }
            else if action == "2" { mainOptionsOpen = false; redoEdit() }
            return
        }
        if setupVisible {
            if action == "clear" || action == "menu" { setupVisible = false }
            else if action == "left" { if setupPage == "root" { setupVisible = false } else { setupPage = "root" } }
            else if setupPage == "root" { if action == "1" { setupPage = "angle" } else if action == "2" { setupPage = "format" } }
            else if setupPage == "angle" { if action == "1" { setAngle("DEG") } else if action == "2" { setAngle("RAD") } else if action == "3" { setAngle("GRAD") } }
            else if setupPage == "format" { if action == "1" { chooseFormat("NORM") } else if action == "2" { chooseFormat("FIX") } else if action == "3" { chooseFormat("SCI") } }
            else if setupPage == "digits", let value = Int(action), (0...9).contains(value) { setFormatDigits(value) }
            return
        }
        if menuVisible {
            if action == "menu" || action == "clear" { menuVisible = false }
            else if action == "right" { menuIndex = min(11, menuIndex + 1) }
            else if action == "left" { menuIndex = max(0, menuIndex - 1) }
            else if action == "up" { menuIndex = max(0, menuIndex - 4) }
            else if action == "down" { menuIndex = min(11, menuIndex + 4) }
            else if action == "equals" { selectMode(Self.modes[menuIndex]) }
            else if let n = Int(action), (1...9).contains(n) { selectMode(Self.modes[n-1]) }
            else if alt, let index = ["negative":9,"dms":10,"inverse":11][action] { selectMode(Self.modes[index]) }
            return
        }
        if catalogKind != nil {
            if action == "menu" || action == "clear" { catalogKind = nil }
            else if action == "up" || action == "left" { catalogIndex = max(0,catalogIndex - 1) }
            else if action == "down" || action == "right" { catalogIndex = min(catalogItems.count - 1,catalogIndex + 1) }
            else if action == "equals" { selectCatalogItem(catalogIndex) }
            return
        }
        if advancedMode != nil {
            pressAdvanced(action, shifted: shift, alpha: alt)
            return
        }
        if shift && (action == "7" || action == "8") { openCatalog(action == "7" ? "CONST" : "CONV"); return }
        if shift && ["toggle", "9", "del", "clear", "optn"].contains(action) {
            status = "FUNÇÃO SHIFT NÃO DISPONÍVEL"; return
        }
        if alt && action == "del" { undoEdit(); return }
        if alt && action == "calc" { insert("="); return }
        if alt && variableKeys[action] == nil { status = "FUNÇÃO ALPHA NÃO DISPONÍVEL"; return }
        if (alt || storePending || recallPending), let name = variableKeys[action] {
            if storePending { variables[name] = ans; if name == "M" { memory = ans }; storePending = false; status = "STO \(name)" }
            else if recallPending { insert(String(variables[name] ?? 0)); recallPending = false; status = "CALCULAR" }
            else { insert(name) }
            return
        }
        switch action {
        case "menu": if shift { setupPage = "root"; setupVisible = true } else { menuIndex = 0; menuVisible = true }
        case "clear": rememberEdit(); expression = ""; cursor = 0; result = "0"; completed = false; generation += 1; calculating = false
        case "del": if cursor > 0 { rememberEdit(); let end = expression.index(expression.startIndex, offsetBy: cursor); let start = expression.index(before: end); expression.removeSubrange(start..<end); cursor -= 1 }; completed = false
        case "equals": evaluate()
        case "store": storePending = !shift; recallPending = shift; status = shift ? "RECALL" : "STO"
        case "memory": memory += shift ? -ans : ans; variables["M"] = memory; status = "M = \(memory)"
        case "ans": insert(shift ? "%" : "Ans")
        case "fraction": if shift { insert("mix(;;)"); cursor = max(0,cursor-3) } else { insert("()/()"); cursor = max(0, cursor - 4) }
        case "sqrt": insert(shift ? "cbrt(" : "sqrt(")
        case "square": insert(shift ? "^3" : "^2")
        case "power": if shift { insert("nthroot(;)"); cursor = max(0,cursor-2) } else { insert("^") }
        case "inverse": insert(shift ? "!" : "^(-1)")
        case "negative": if shift { insert("logbase(;)"); cursor = max(0,cursor-2) } else { insert("-") }
        case "sin", "cos", "tan": insert((shift ? "a" : "") + action + "(")
        case "log", "ln": insert(shift ? (action == "log" ? "10^" : "e^") : action + "(")
        case "exp": insert(shift ? "pi" : "*10^")
        case "variableX": if shift { openAdvanced("Somatório") } else { insert("x") }
        case "toggle": if let exact = lastExact { showExact.toggle(); result = showExact ? exact : lastDecimal }
        case "angle": angle = angle == "DEG" ? "RAD" : angle == "RAD" ? "GRAD" : "DEG"
        case "left": cursor = max(0, cursor - 1)
        case "right": cursor = min(expression.count, cursor + 1)
        case "integral": openAdvanced(shift ? "Derivada" : "Integral")
        case "calc": openAdvanced(shift ? "SOLVE" : "CALC")
        case "+": if shift { openAdvanced("Pol") } else { insert("+") }
        case "-": if shift { openAdvanced("Rec") } else { insert("-") }
        case "dms": openAdvanced(shift ? "FATOR" : "DMS")
        case "eng": openAdvanced("ENG"); if shift { advancedFields[1] = "-1" }
        case "up", "down": moveFraction(direction: action)
        case "optn": mainOptionsOpen = true
        default: insert(action)
        }
    }
    private func openCatalog(_ kind: String) {
        guard let catalog = catalog else { status = "CATÁLOGO INDISPONÍVEL"; return }
        catalogItems = kind == "CONST" ? catalog.constants : catalog.conversions
        guard !catalogItems.isEmpty else { status = "CATÁLOGO VAZIO"; return }
        catalogIndex = 0; catalogKind = kind; status = "CALCULAR"
    }
    func selectCatalogItem(_ index: Int) {
        guard let kind = catalogKind, catalogItems.indices.contains(index) else { return }
        let item = catalogItems[index]; catalogKind = nil
        if kind == "CONST", let value = item.value {
            let prior = expression.last
            let needsMultiply = !completed && prior.map { $0.isNumber || $0 == ")" || $0.isLetter } == true
            insert((needsMultiply ? "*" : "") + String(value))
        } else if kind == "CONV" {
            openAdvanced("CONV",operation:item.id)
            advancedFields[0] = completed ? String(ans) : expression
            advancedCursor = advancedFields[0].count
        }
    }
    static let modes = ["Calcular", "Complexos", "Base-N", "Matriz", "Vetor", "Estatística", "Distribuição", "Planilha", "Tabela", "Equação", "Desigualdade", "Proporção"]
    func chooseFormat(_ value: String) {
        guard ["NORM", "FIX", "SCI"].contains(value) else { return }
        if value == "NORM" { pendingFormat = value; setFormatDigits(1) }
        else { pendingFormat = value; setupPage = "digits" }
    }
    func setFormatDigits(_ value: Int) {
        guard (0...9).contains(value) else { return }
        displayFormat = pendingFormat; displayDigits = value
        UserDefaults.standard.set(displayFormat,forKey:formatKey); UserDefaults.standard.set(displayDigits,forKey:digitsKey)
        setupVisible = false; status = "CALCULAR"
    }
    func setAngle(_ value: String) { angle = value; UserDefaults.standard.set(value, forKey: angleKey); setupVisible = false; status = "CALCULAR" }
    func selectMode(_ name: String) {
        menuVisible = false
        if name == "Calcular" { advancedMode = nil; status = "CALCULAR" }
        else { openAdvanced(name) }
    }
    private func openAdvanced(_ name: String, operation: String? = nil) {
        // An operation can also be selected by tapping the LCD while a calculation is running.
        // Invalidate that calculation before replacing its fields.
        generation += 1; calculating = false
        let draft = operation == nil ? modeDrafts[name] : nil
        let labels: [String: [String]] = [
            "Complexos": ["z₁", "z₂"], "Base-N": ["Valor", "Base origem", "Base destino"],
            "Matriz": ["a₁₁", "a₁₂", "a₂₁", "a₂₂"], "Vetor": ["A₁", "A₂", "A₃", "B₁", "B₂", "B₃"],
            "Estatística": ["x₁", "x₂", "x₃"], "Distribuição": ["x", "μ", "σ"],
            "Planilha": ["Célula", "Conteúdo"], "Tabela": ["f(x)", "Início", "Fim", "Passo"],
            "Equação": ["a", "b", "c"], "Desigualdade": ["a", "b", "c"],
            "Proporção": ["a", "b", "c"], "Integral": ["f(x)", "Inferior", "Superior"],
            "Derivada": ["f(x)", "x"], "Somatório": ["f(x)", "Início", "Fim"],
            "CALC": ["f(x,A,B)", "x", "A", "B"], "SOLVE": ["f(x)=0", "Inicial", "A", "B"],
            "Pol": ["x", "y"], "Rec": ["r", "θ"],
            "Δ%": ["Valor inicial", "Valor final"], "DMS": ["Decimal"], "FATOR": ["Inteiro"], "ENG": ["Valor", "Deslocamento"], "CONV": ["Valor"]
        ]
        guard var names = labels[name] else { status = "AINDA NÃO DISPONÍVEL"; return }
        let selected = operation ?? draft?.operation ?? Self.operations[name]?.first ?? ""
        if name == "Complexos" && selected == "Retangular → polar" { names = ["z"] }
        if name == "Complexos" && selected == "Polar → retangular" { names = ["r", "θ"] }
        if name == "Desigualdade" && selected.hasPrefix("Grau 3") { names = ["a", "b", "c", "d"] }
        if name == "Desigualdade" && selected.hasPrefix("Grau 4") { names = ["a", "b", "c", "d", "e"] }
        if name == "Estatística" && selected != "1 variável" { names = ["x₁", "y₁", "x₂", "y₂", "x₃", "y₃"] }
        if name == "Tabela" && selected == "Duas funções" { names = ["f(x)", "g(x)", "Início", "Fim", "Passo"] }
        if name == "DMS" && selected == "DMS → decimal" { names = ["Graus", "Minutos", "Segundos"] }
        if name == "Base-N" && selected != "Converter" { names = selected == "NOT" ? ["Valor", "Base"] : ["Valor A", "Valor B", "Base"] }
        if name == "Matriz" {
            let dimension = selected.contains("3×3") ? 3 : selected.contains("4×4") ? 4 : 2
            names = (0..<(dimension * dimension)).map { "A\($0 / dimension + 1)\($0 % dimension + 1)" }
            if selected.hasPrefix("Escalar por número") { names.append("k") }
            else if selected.hasPrefix("Somar") || selected.hasPrefix("Multiplicar") || selected.hasPrefix("Subtrair") {
                names += (0..<(dimension * dimension)).map { "B\($0 / dimension + 1)\($0 % dimension + 1)" }
            }
        }
        if name == "Vetor" {
            let dimension = selected.hasSuffix("2D") ? 2 : 3
            names = (1...dimension).map { "A\($0)" }
            if selected.hasPrefix("Escalar por número") { names.append("k") }
            else if !selected.hasPrefix("Norma") && !selected.hasPrefix("Unitário") { names += (1...dimension).map { "B\($0)" } }
        }
        if name == "Distribuição" && selected.hasPrefix("Binomial") { names = ["x", "n", "p"] }
        if name == "Distribuição" && selected.hasPrefix("Poisson") { names = ["x", "λ"] }
        if name == "Equação" && selected == "Grau 3" { names = ["a", "b", "c", "d"] }
        if name == "Equação" && selected == "Grau 4" { names = ["a", "b", "c", "d", "e"] }
        if name == "Equação" && selected.hasPrefix("Sistema") {
            let dimension = selected.contains("3×3") ? 3 : selected.contains("4×4") ? 4 : 2
            names = (0..<(dimension * (dimension + 1))).map { i in i % (dimension + 1) == dimension ? "b\(i / (dimension + 1) + 1)" : "a\(i / (dimension + 1) + 1)\(i % (dimension + 1) + 1)" }
        }
        if name == "Planilha" { sheetGrid = true; refreshSheetValues() }
        advancedMode = name; advancedOperation = selected; operationsOpen = false; operationIndex = 0; advancedLabels = names
        advancedFields = Array(repeating: "", count: names.count)
        if name == "Planilha" { advancedFields[0] = "A1"; advancedIndex = 1 }
        else if name == "DMS" || name == "FATOR" || name == "ENG" { advancedFields[0] = completed ? String(ans) : expression; if name == "ENG" { advancedFields[1] = "0" }; advancedIndex = 0 }
        else if name == "CALC" || name == "SOLVE" { advancedFields[0] = expression; advancedFields[1] = "0"; advancedFields[2] = "0"; advancedFields[3] = "0"; advancedIndex = 0 }
        else { advancedIndex = 0 }
        advancedCursor = advancedFields[advancedIndex].count; advancedResult = ""; advancedNumeric = nil; status = "CALCULAR"
        if let draft = draft, draft.fields.count == advancedFields.count || (name == "Estatística" && draft.fields.count >= advancedFields.count) {
            if name == "Estatística" && draft.fields.count > advancedLabels.count {
                let paired = selected != "1 variável"
                advancedLabels = (0..<draft.fields.count).map { i in paired ? "\(i % 2 == 0 ? "x" : "y")\(i / 2 + 1)" : "x\(i + 1)" }
            }
            advancedFields = draft.fields; advancedIndex = min(draft.selected, advancedFields.count - 1); advancedCursor = min(draft.cursor, advancedFields[advancedIndex].count); advancedResult = draft.result; advancedNumeric = draft.numeric
        }
    }
    func selectAdvancedOperation(_ index: Int) {
        guard let kind = advancedMode, let options = Self.operations[kind], options.indices.contains(index) else { return }
        openAdvanced(kind, operation: options[index])
    }
    func advancedFieldText(_ index: Int) -> String {
        guard advancedFields.indices.contains(index) else { return "" }
        var value = advancedFields[index]
        if index == advancedIndex {
            let position = value.index(value.startIndex,offsetBy:min(advancedCursor,value.count))
            value.insert("│",at:position)
        }
        return value.isEmpty ? "□" : value
    }
    func selectAdvancedField(_ index: Int) {
        guard advancedFields.indices.contains(index) else { return }
        advancedIndex = index; advancedCursor = advancedFields[index].count
    }
    private func pressAdvanced(_ action: String, shifted: Bool, alpha: Bool) {
        if advancedMode == "Planilha" && sheetGrid {
            if action == "menu" { advancedMode = nil; menuIndex = 0; menuVisible = true }
            else if action == "left" { sheetColumn = max(0,sheetColumn - 1) }
            else if action == "right" { sheetColumn = min(4,sheetColumn + 1) }
            else if action == "up" { sheetRow = max(1,sheetRow - 1) }
            else if action == "down" { sheetRow = min(45,sheetRow + 1) }
            else if action == "equals" { editSheetCell(column:sheetColumn,row:sheetRow) }
            return
        }
        guard let kind = advancedMode, advancedFields.indices.contains(advancedIndex) else { return }
        let options = Self.operations[kind] ?? []
        if operationsOpen {
            if action == "clear" || action == "menu" { operationsOpen = false; return }
            if action == "up" || action == "left" { operationIndex = max(0, operationIndex - 1); return }
            if action == "down" || action == "right" { operationIndex = min(options.count - 1, operationIndex + 1); return }
            if action == "equals", options.indices.contains(operationIndex) { openAdvanced(kind,operation:options[operationIndex]); return }
            return
        }
        if kind == "Planilha" && action == "clear" && advancedFields[1].isEmpty { sheetGrid = true; return }
        if action == "optn" {
            if options.isEmpty { status = "SEM OPÇÕES ADICIONAIS" }
            else { operationIndex = options.firstIndex(of:advancedOperation) ?? 0; operationsOpen = true }
            return
        }
        if action == "menu" {
            modeDrafts[kind] = ModeDraft(operation:advancedOperation,fields:advancedFields,selected:advancedIndex,cursor:advancedCursor,result:advancedResult,numeric:advancedNumeric)
            advancedMode = nil; menuIndex = 0; menuVisible = true; return
        }
        if action == "left" { advancedCursor = max(0, advancedCursor - 1); return }
        if action == "right" { advancedCursor = min(advancedFields[advancedIndex].count, advancedCursor + 1); return }
        if action == "up" { advancedIndex = max(0, advancedIndex - 1); advancedCursor = advancedFields[advancedIndex].count; return }
        if action == "down" {
            if kind == "Estatística", advancedIndex == advancedFields.count - 1,
               !advancedFields[advancedIndex].isEmpty, advancedFields.count < 200 {
                let paired = advancedOperation != "1 variável"
                let row = paired ? advancedFields.count / 2 + 1 : advancedFields.count + 1
                advancedLabels.append("x\(row)"); advancedFields.append("")
                if paired { advancedLabels.append("y\(row)"); advancedFields.append("") }
            }
            advancedIndex = min(advancedFields.count - 1, advancedIndex + 1); advancedCursor = advancedFields[advancedIndex].count; return
        }
        if action == "ans", let value = advancedNumeric {
            ans = value; lastDecimal = String(format:"%.10g",locale:Locale(identifier:"en_US_POSIX"),value).replacingOccurrences(of:".",with:",")
            result = lastDecimal; lastExact = nil; showExact = false; completed = true
            modeDrafts[kind] = ModeDraft(operation:advancedOperation,fields:advancedFields,selected:advancedIndex,cursor:advancedCursor,result:advancedResult,numeric:advancedNumeric)
            advancedMode = nil; status = "CALCULAR"; return
        }
        if action == "equals" { runAdvanced(kind); return }
        if action == "clear" { advancedFields[advancedIndex] = ""; advancedCursor = 0; advancedResult = ""; advancedNumeric = nil; return }
        if action == "del" { if advancedCursor > 0 { var field = advancedFields[advancedIndex]; let end = field.index(field.startIndex,offsetBy:advancedCursor); let start = field.index(before:end); field.removeSubrange(start..<end); advancedFields[advancedIndex] = field; advancedCursor -= 1; advancedResult = ""; advancedNumeric = nil }; return }
        let alphaNames = ["negative":"A", "dms":"B", "inverse":"C", "sin":"D", "cos":"E", "tan":"F", "eng":"i", ")":"x"]
        let aliases = ["negative":"-", "variableX":"x", "fraction":"/", "power":"^", "square":"^2", "sin":"sin(", "cos":"cos(", "tan":"tan(", "sqrt":"sqrt(", "log":"log(", "ln":"ln("]
        let text: String
        if shifted { status = "FUNÇÃO SHIFT NÃO DISPONÍVEL"; return }
        if alpha, let value = alphaNames[action] { text = value }
        else if alpha && action == "calc" { text = "=" }
        else if alpha { status = "FUNÇÃO ALPHA NÃO DISPONÍVEL"; return }
        else if let value = aliases[action] { text = value }
        else if action.count == 1 && "0123456789,+-*/()".contains(action) { text = action }
        else { status = "TECLA NÃO DISPONÍVEL"; return }
        var field = advancedFields[advancedIndex]
        advancedCursor = min(max(0,advancedCursor),field.count)
        let location = field.index(field.startIndex,offsetBy:advancedCursor)
        field.insert(contentsOf:text,at:location); advancedFields[advancedIndex] = field; advancedCursor += text.count; advancedResult = ""; advancedNumeric = nil; status = "CALCULAR"
    }
    private func runAdvanced(_ kind: String) {
        generation += 1; let ticket = generation
        calculating = true; advancedResult = "CALCULANDO"; advancedNumeric = nil
        var payload: [String: Any] = ["kind": kind, "operation": advancedOperation, "fields": advancedFields, "angle": angle]
        if let snapshot = sheetSnapshot { payload["snapshot"] = snapshot }
        Engine.advanced(payload) { [weak self] outcome in
            guard let self = self, self.generation == ticket, self.advancedMode == kind else { return }
            self.calculating = false
            switch outcome {
            case .success(let value) where value.ok:
                self.advancedResult = value.display ?? value.result ?? ""
                if let raw = value.result, let number = Double(raw), number.isFinite { self.advancedNumeric = number }
                if let snapshot = value.snapshot {
                    self.sheetSnapshot = snapshot; UserDefaults.standard.set(snapshot, forKey:self.sheetKey)
                    if let data = snapshot.data(using:.utf8), let object = try? JSONSerialization.jsonObject(with:data) as? [String:Any], let cells = object["cells"] as? [String:String] { self.sheetCells = cells }
                    if kind == "Planilha" { self.sheetGrid = true; self.refreshSheetValues() }
                }
            case .success(let value): self.advancedResult = value.error ?? "Erro"
            case .failure: self.advancedResult = "Erro do motor"
            }
        }
    }
    private func refreshSheetValues() {
        sheetGeneration += 1; let ticket = sheetGeneration
        guard let snapshot = sheetSnapshot else { sheetValues = [:]; return }
        Engine.advanced(["kind":"PlanilhaVisualizar", "snapshot":snapshot, "angle":angle]) { [weak self] outcome in
            guard let self = self, self.sheetGeneration == ticket else { return }
            if case .success(let value) = outcome, value.ok, let raw = value.result, let data = raw.data(using:.utf8),
               let values = try? JSONDecoder().decode([String:String].self,from:data) { self.sheetValues = values }
        }
    }
    func editSheetCell(column: Int, row: Int) {
        guard (0...4).contains(column), (1...45).contains(row), advancedMode == "Planilha" else { return }
        sheetColumn = column; sheetRow = row
        let address = String(UnicodeScalar(65 + column)!) + String(row)
        advancedFields = [address, sheetCells[address] ?? ""]
        advancedIndex = 1; advancedCursor = advancedFields[1].count; advancedResult = ""; advancedNumeric = nil; sheetGrid = false
    }
    func selectExpressionCursor(_ position: Int) {
        generation += 1; calculating = false
        cursor = min(max(0,position),expression.count)
        completed = false; status = "CALCULAR"
    }
    private func moveFraction(direction: String) {
        let chars = Array(expression), length = chars.count
        var stack = [Int](), pairs = [Int: Int]()
        for (index, char) in chars.enumerated() {
            if char == "(" { stack.append(index) }
            else if char == ")", let start = stack.popLast() { pairs[start] = index }
        }
        let candidates = pairs.compactMap { start, end -> (Int, Int, Int)? in
            guard end + 2 < length, chars[end + 1] == "/", chars[end + 2] == "(",
                  let denominatorEnd = pairs[end + 2], cursor >= start, cursor <= denominatorEnd + 1 else { return nil }
            return (start, end, denominatorEnd)
        }.sorted { ($0.2 - $0.0) < ($1.2 - $1.0) }
        guard let fraction = candidates.first(where: { direction == "up" ? cursor >= $0.1 + 2 : cursor <= $0.1 + 1 }) else { status = "SEM FRAÇÃO SELECIONADA"; return }
        cursor = direction == "up" ? fraction.1 : fraction.2
    }
    private func insert(_ text: String) {
        rememberEdit()
        if completed { expression = ["+", "-", "*", "/", "^"].contains(text) ? "Ans" : ""; cursor = expression.count; completed = false }
        cursor = max(0, min(cursor, expression.count))
        let at = expression.index(expression.startIndex, offsetBy: cursor)
        expression.insert(contentsOf: text, at: at); cursor += text.count
        status = "CALCULAR"
    }
    private func evaluate() {
        let pending = expression.trimmingCharacters(in: .whitespaces)
        guard !pending.isEmpty else { return }
        let count = pending.filter { $0 == "(" }.count - pending.filter { $0 == ")" }.count
        let balanced = pending + String(repeating: ")", count: max(0, count))
        generation += 1; let ticket = generation
        calculating = true; status = "CALCULANDO"
        Engine.calculate(["expression": balanced, "angle": angle, "format": displayFormat, "digits": displayDigits, "ans": ans, "memory": memory, "variables": variables]) { [weak self] outcome in
            guard let self = self, self.generation == ticket else { return }
            self.calculating = false
            switch outcome {
            case .success(let response) where response.ok:
                guard let value = response.value, let decimal = response.decimal else { self.result = "Erro"; self.status = "ERRO DO MOTOR"; return }
                self.ans = value; self.lastDecimal = decimal.replacingOccurrences(of: ".", with: ",")
                self.lastExact = response.exact; self.showExact = response.exact != nil
                self.result = response.exact ?? self.lastDecimal; self.completed = true; self.status = "CALCULAR"
            default: self.result = "Erro"; self.status = "VERIFIQUE A EXPRESSÃO"
            }
        }
    }
    private func reset() {
        generation += 1; expression = ""; cursor = 0; result = "0"; angle = "DEG"; shifted = false; alpha = false
        ans = 0; memory = 0; displayFormat = "NORM"; displayDigits = 1; pendingFormat = "NORM"; setupPage = "root"; for name in variables.keys { variables[name] = 0 }
        storePending = false; recallPending = false; completed = false; lastExact = nil; lastDecimal = "0"
        showExact = false; undoStack.removeAll(); redoStack.removeAll(); menuVisible = false; setupVisible = false; menuIndex = 0; calculating = false; status = "CALCULAR"
        advancedMode = nil; advancedFields = []; advancedLabels = []; advancedIndex = 0; advancedCursor = 0; advancedResult = ""; advancedNumeric = nil; advancedOperation = ""; operationsOpen = false; operationIndex = 0
        mainOptionsOpen = false; sheetGrid = false; sheetColumn = 0; sheetRow = 1; sheetCells = [:]; sheetValues = [:]; sheetGeneration += 1
        modeDrafts.removeAll(); catalogKind = nil; catalogItems = []; catalogIndex = 0; sheetSnapshot = nil; UserDefaults.standard.removeObject(forKey:sheetKey); UserDefaults.standard.removeObject(forKey:angleKey); UserDefaults.standard.removeObject(forKey:formatKey); UserDefaults.standard.removeObject(forKey:digitsKey)
    }
}
