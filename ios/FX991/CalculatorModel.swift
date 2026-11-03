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
private enum Engine {
    static let queue = DispatchQueue(label: "fx991.engine", qos: .userInitiated)
    static var context: JSContext?
    static func calculate(_ payload: [String: Any], completion: @escaping (Result<EngineReply, Error>) -> Void) {
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
                guard let js = context, let fn = js.objectForKeyedSubscript("nativeCalculate"),
                      let text = fn.call(withArguments: [payload])?.toString(),
                      let data = text.data(using: .utf8) else { throw NSError(domain: "Engine", code: 3) }
                let answer = try JSONDecoder().decode(EngineReply.self, from: data)
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
        case "variableX": insert("x")
        case "toggle": if let exact = lastExact { showExact.toggle(); result = showExact ? exact : lastDecimal }
        case "angle": angle = angle == "DEG" ? "RAD" : angle == "RAD" ? "GRAD" : "DEG"
        case "left": cursor = max(0, cursor - 1)
        case "right": cursor = min(expression.count, cursor + 1)
        case "up", "down", "optn", "calc", "integral", "dms", "eng": status = "AINDA NÃO DISPONÍVEL"
        default: insert(action)
        }
    }
    static let modes = ["Calcular", "Complexos", "Base-N", "Matriz", "Vetor", "Estatística", "Distribuição", "Planilha", "Tabela", "Equação", "Desigualdade", "Proporção"]
    func setAngle(_ value: String) { angle = value; setupVisible = false; status = "CALCULAR" }
    func selectMode(_ name: String) {
        menuVisible = false
        status = name == "Calcular" ? "CALCULAR" : "\(name.uppercased()): EM DESENVOLVIMENTO"
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
    }
}
