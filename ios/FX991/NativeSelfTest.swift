#if DEBUG
import Foundation

/// Simulator-only model smoke test. The shipping Release build excludes this runner.
@MainActor enum NativeSelfTest {
    static func run() async {
        let calculator = CalculatorModel()
        var failures = [String]()
        func waitForResult() async {
            for _ in 0..<200 {
                if !calculator.calculating { return }
                try? await Task.sleep(nanoseconds: 50_000_000)
            }
            failures.append("Timed out waiting for engine")
        }
        for key in ["7", "+", "8", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.result != "15" { failures.append("7+8 expected 15, got \(calculator.result)") }
        calculator.press("menu"); calculator.press("4")
        for key in ["1", "down", "2", "down", "3", "down", "4", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.advancedResult != "-2" { failures.append("2×2 determinant expected -2, got \(calculator.advancedResult)") }
        for key in ["optn", "down", "equals", "1", "down", "2", "down", "3", "down", "4", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.advancedResult.contains("-2") { failures.append("2×2 inverse did not produce expected value: \(calculator.advancedResult)") }
        calculator.press("menu"); calculator.press("8")
        for key in ["4", "0", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.advancedResult != "40" { failures.append("Sheet A1 expected 40, got \(calculator.advancedResult)") }
        if UserDefaults.standard.string(forKey:"fx991lax.ios.sheet.v1") == nil { failures.append("Sheet was not saved") }
        calculator.press("on")
        if calculator.result != "0" || calculator.advancedMode != nil || UserDefaults.standard.string(forKey:"fx991lax.ios.sheet.v1") != nil { failures.append("ON did not clear calculator state") }
        let output: [String: Any] = ["passed":failures.isEmpty, "failures":failures]
        if let data = try? JSONSerialization.data(withJSONObject:output),
           let directory = FileManager.default.urls(for:.documentDirectory,in:.userDomainMask).first {
            try? data.write(to:directory.appendingPathComponent("native-selftest.json"),options:.atomic)
        }
    }
}
#endif
