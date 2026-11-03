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
    @Published var menuIndex = 0
    @Published var advancedMode: String? = nil
    @Published var advancedFields: [String] = []
    @Published var advancedLabels: [String] = []
    @Published var advancedIndex = 0
    @Published var advancedResult = ""
    @Published var advancedOperation = ""
    @Published var operationsOpen = false
    @Published var operationIndex = 0
    static let operations: [String: [String]] = [
        "Complexos": ["Somar", "Subtrair", "Multiplicar", "Dividir"],
        "Base-N": ["Converter", "Somar", "Subtrair", "Multiplicar", "Dividir", "AND", "OR", "XOR", "NOT"],
        "Matriz": ["Determinante", "Inversa", "Transposta", "Somar", "Multiplicar"],
        "Vetor": ["Escalar", "Vetorial", "Somar", "Subtrair", "Norma", "Ângulo"],
        "Distribuição": ["Normal CDF", "Normal PDF", "Normal inversa", "Binomial PDF", "Binomial CDF", "Poisson PDF", "Poisson CDF"],
        "Equação": ["Grau 2", "Grau 3", "Grau 4"],
        "Desigualdade": [">=", ">", "<=", "<"], "Proporção": ["D", "C"]
    ]
    private let sheetKey = "fx991lax.ios.sheet.v1"
    private let angleKey = "fx991lax.ios.angle.v1"
    private var sheetSnapshot: String? = UserDefaults.standard.string(forKey: "fx991lax.ios.sheet.v1")
    @Published var status = "CALCULAR"
    @Published var calculating = false
    private var ans = 0.0
    private var memory = 0.0
    private var variables = Dictionary(uniqueKeysWithValues: ["A","B","C","D","E","F","x","y","M"].map { ($0, 0.0) })
    private var storePending = false
    private var recallPending = false
    private var completed = false
    private var lastExact: String?
    private var lastDecimal = "0"
    private var showExact = false
    private var generation = 0
    private let variableKeys: [String: String] = ["negative":"A", "dms":"B", "inverse":"C", "sin":"D", "cos":"E", "tan":"F", ")":"x", "toggle":"y", "memory":"M"]

    init() {
        let saved = UserDefaults.standard.string(forKey: angleKey) ?? "DEG"
        if ["DEG", "RAD", "GRAD"].contains(saved) { angle = saved }
    }
    func press(_ action: String) {
        if action == "on" { reset(); return }
        if calculating { generation += 1; calculating = false }
        if action == "shift" { shifted.toggle(); alpha = false; return }
        if action == "alpha" { alpha.toggle(); shifted = false; return }
        let shift = shifted, alt = alpha
        shifted = false; alpha = false
        if setupVisible {
            if action == "clear" || action == "menu" { setupVisible = false }
            else if action == "1" { setAngle("DEG") }
            else if action == "2" { setAngle("RAD") }
            else if action == "3" { setAngle("GRAD") }
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
        if advancedMode != nil {
            pressAdvanced(action, shifted: shift, alpha: alt)
            return
        }
        if shift && ["fraction", "power", "negative", "toggle", "7", "8", "9", "del", "clear", "optn", "dms", "eng"].contains(action) {
            status = "FUNÇÃO SHIFT NÃO DISPONÍVEL"; return
        }
        if alt && action == "calc" { insert("="); return }
        if alt && variableKeys[action] == nil { status = "FUNÇÃO ALPHA NÃO DISPONÍVEL"; return }
        if (alt || storePending || recallPending), let name = variableKeys[action] {
            if storePending { variables[name] = ans; if name == "M" { memory = ans }; storePending = false; status = "STO \(name)" }
            else if recallPending { insert(String(variables[name] ?? 0)); recallPending = false; status = "CALCULAR" }
            else { insert(name) }
            return
        }
        switch action {
        case "menu": if shift { setupVisible = true } else { menuIndex = 0; menuVisible = true }
        case "clear": expression = ""; cursor = 0; result = "0"; completed = false; generation += 1; calculating = false
        case "del": if cursor > 0 { let end = expression.index(expression.startIndex, offsetBy: cursor); let start = expression.index(before: end); expression.removeSubrange(start..<end); cursor -= 1 }; completed = false
        case "equals": evaluate()
        case "store": storePending = !shift; recallPending = shift; status = shift ? "RECALL" : "STO"
        case "memory": memory += shift ? -ans : ans; variables["M"] = memory; status = "M = \(memory)"
        case "ans": insert(shift ? "%" : "Ans")
        case "fraction": insert("()/()"); cursor = max(0, cursor - 4)
        case "sqrt": insert(shift ? "cbrt(" : "sqrt(")
        case "square": insert(shift ? "^3" : "^2")
        case "power": insert("^")
        case "inverse": insert(shift ? "!" : "^(-1)")
        case "negative": insert("-")
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
        case "up", "down", "optn", "dms", "eng": status = "AINDA NÃO DISPONÍVEL"
        default: insert(action)
        }
    }
    static let modes = ["Calcular", "Complexos", "Base-N", "Matriz", "Vetor", "Estatística", "Distribuição", "Planilha", "Tabela", "Equação", "Desigualdade", "Proporção"]
    func setAngle(_ value: String) { angle = value; UserDefaults.standard.set(value, forKey: angleKey); setupVisible = false; status = "CALCULAR" }
    func selectMode(_ name: String) {
        menuVisible = false
        if name == "Calcular" { advancedMode = nil; status = "CALCULAR" }
        else { openAdvanced(name) }
    }
    private func openAdvanced(_ name: String, operation: String? = nil) {
        let labels: [String: [String]] = [
            "Complexos": ["z₁", "z₂"], "Base-N": ["Valor", "Base origem", "Base destino"],
            "Matriz": ["a₁₁", "a₁₂", "a₂₁", "a₂₂"], "Vetor": ["A₁", "A₂", "A₃", "B₁", "B₂", "B₃"],
            "Estatística": ["x₁", "x₂", "x₃"], "Distribuição": ["x", "μ", "σ"],
            "Planilha": ["Célula", "Conteúdo"], "Tabela": ["f(x)", "Início", "Fim", "Passo"],
            "Equação": ["a", "b", "c"], "Desigualdade": ["a", "b", "c"],
            "Proporção": ["a", "b", "c"], "Integral": ["f(x)", "Inferior", "Superior"],
            "Derivada": ["f(x)", "x"], "Somatório": ["f(x)", "Início", "Fim"],
            "CALC": ["f(x,A,B)", "x", "A", "B"], "SOLVE": ["f(x)=0", "Inicial", "A", "B"],
            "Pol": ["x", "y"], "Rec": ["r", "θ"]
        ]
        guard var names = labels[name] else { status = "AINDA NÃO DISPONÍVEL"; return }
        let selected = operation ?? Self.operations[name]?.first ?? ""
        if name == "Base-N" && selected != "Converter" { names = selected == "NOT" ? ["Valor", "Base"] : ["Valor A", "Valor B", "Base"] }
        if name == "Matriz" && ["Somar", "Multiplicar"].contains(selected) { names += ["b₁₁", "b₁₂", "b₂₁", "b₂₂"] }
        if name == "Vetor" && selected == "Norma" { names = ["A₁", "A₂", "A₃"] }
        if name == "Distribuição" && selected.hasPrefix("Binomial") { names = ["x", "n", "p"] }
        if name == "Distribuição" && selected.hasPrefix("Poisson") { names = ["x", "λ"] }
        if name == "Equação" && selected == "Grau 3" { names = ["a", "b", "c", "d"] }
        if name == "Equação" && selected == "Grau 4" { names = ["a", "b", "c", "d", "e"] }
        advancedMode = name; advancedOperation = selected; operationsOpen = false; operationIndex = 0; advancedLabels = names
        advancedFields = Array(repeating: "", count: names.count)
        if name == "Planilha" { advancedFields[0] = "A1"; advancedIndex = 1 }
        else if name == "CALC" || name == "SOLVE" { advancedFields[0] = expression; advancedFields[1] = "0"; advancedFields[2] = "0"; advancedFields[3] = "0"; advancedIndex = 0 }
        else { advancedIndex = 0 }
        advancedResult = ""; status = "CALCULAR"
    }
    func selectAdvancedOperation(_ index: Int) {
        guard let kind = advancedMode, let options = Self.operations[kind], options.indices.contains(index) else { return }
        openAdvanced(kind, operation: options[index])
    }
    func selectAdvancedField(_ index: Int) {
        guard advancedFields.indices.contains(index) else { return }
        advancedIndex = index
    }
    private func pressAdvanced(_ action: String, shifted: Bool, alpha: Bool) {
        guard let kind = advancedMode, advancedFields.indices.contains(advancedIndex) else { return }
        let options = Self.operations[kind] ?? []
        if operationsOpen {
            if action == "clear" || action == "menu" { operationsOpen = false; return }
            if action == "up" || action == "left" { operationIndex = max(0, operationIndex - 1); return }
            if action == "down" || action == "right" { operationIndex = min(options.count - 1, operationIndex + 1); return }
            if action == "equals", options.indices.contains(operationIndex) { openAdvanced(kind,operation:options[operationIndex]); return }
            return
        }
        if action == "optn" {
            if options.isEmpty { status = "SEM OPÇÕES ADICIONAIS" }
            else { operationIndex = options.firstIndex(of:advancedOperation) ?? 0; operationsOpen = true }
            return
        }
        if action == "menu" { advancedMode = nil; menuIndex = 0; menuVisible = true; return }
        if action == "up" || action == "left" { advancedIndex = max(0, advancedIndex - 1); return }
        if action == "down" || action == "right" { advancedIndex = min(advancedFields.count - 1, advancedIndex + 1); return }
        if action == "equals" { runAdvanced(kind); return }
        if action == "clear" { advancedFields[advancedIndex] = ""; advancedResult = ""; return }
        if action == "del" { if !advancedFields[advancedIndex].isEmpty { advancedFields[advancedIndex].removeLast() }; return }
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
        advancedFields[advancedIndex] += text; status = "CALCULAR"
    }
    private func runAdvanced(_ kind: String) {
        generation += 1; let ticket = generation
        calculating = true; advancedResult = "CALCULANDO"
        var payload: [String: Any] = ["kind": kind, "operation": advancedOperation, "fields": advancedFields, "angle": angle]
        if let snapshot = sheetSnapshot { payload["snapshot"] = snapshot }
        Engine.advanced(payload) { [weak self] outcome in
            guard let self = self, self.generation == ticket, self.advancedMode == kind else { return }
            self.calculating = false
            switch outcome {
            case .success(let value) where value.ok:
                self.advancedResult = value.display ?? value.result ?? ""
                if let snapshot = value.snapshot { self.sheetSnapshot = snapshot; UserDefaults.standard.set(snapshot, forKey:self.sheetKey) }
            case .success(let value): self.advancedResult = value.error ?? "Erro"
            case .failure: self.advancedResult = "Erro do motor"
            }
        }
    }
    private func insert(_ text: String) {
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
        Engine.calculate(["expression": balanced, "angle": angle, "ans": ans, "memory": memory, "variables": variables]) { [weak self] outcome in
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
        ans = 0; memory = 0; for name in variables.keys { variables[name] = 0 }
        storePending = false; recallPending = false; completed = false; lastExact = nil; lastDecimal = "0"
        showExact = false; menuVisible = false; setupVisible = false; menuIndex = 0; calculating = false; status = "CALCULAR"
        advancedMode = nil; advancedFields = []; advancedLabels = []; advancedIndex = 0; advancedResult = ""; advancedOperation = ""; operationsOpen = false; operationIndex = 0
        sheetSnapshot = nil; UserDefaults.standard.removeObject(forKey:sheetKey); UserDefaults.standard.removeObject(forKey:angleKey)
    }
}
