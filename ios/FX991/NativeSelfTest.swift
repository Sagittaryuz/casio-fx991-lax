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
        for key in ["fraction", "1", "down", "2", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.result != "1/2" { failures.append("Fraction expected 1/2, got \(calculator.result)") }
        calculator.press("on")
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
        calculator.press("menu"); calculator.press("8"); calculator.press("equals")
        for key in ["4", "0", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.advancedResult != "40" { failures.append("Sheet A1 expected 40, got \(calculator.advancedResult)") }
        if UserDefaults.standard.string(forKey:"fx991lax.ios.sheet.v1") == nil { failures.append("Sheet was not saved") }
        calculator.press("menu"); calculator.press("4")
        if calculator.advancedOperation != "Inversa" || calculator.advancedFields != ["1", "2", "3", "4"] { failures.append("Matrix state was not restored") }
        calculator.press("on")
        if calculator.result != "0" || calculator.advancedMode != nil || UserDefaults.standard.string(forKey:"fx991lax.ios.sheet.v1") != nil { failures.append("ON did not clear calculator state") }
        for key in ["shift", "7", "down", "down", "equals"] { calculator.press(key) }
        if !calculator.expression.contains("299792458") { failures.append("CONST did not insert c₀: \(calculator.expression)") }
        calculator.press("on")
        for key in ["shift", "8", "equals", "5", "0", "0", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.advancedResult != "1270" { failures.append("500 in → cm expected 1270, got \(calculator.advancedResult)") }
        calculator.press("ans")
        if calculator.result != "1270" || calculator.advancedMode != nil { failures.append("Conversion result was not applied") }
        calculator.press("on")
        for key in ["1", "2", ",", "5", "equals"] { calculator.press(key) }
        await waitForResult()
        calculator.press("dms"); calculator.press("equals")
        await waitForResult()
        if !calculator.advancedResult.contains("30′") { failures.append("DMS conversion failed: \(calculator.advancedResult)") }
        calculator.press("on")
        for key in ["shift", "menu", "2", "2", "3", "sin", "3", "0", ")", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.result != "0,500" { failures.append("FIX 3 expected 0,500, got \(calculator.result)") }
        calculator.press("on")
        for key in ["menu", "6", "1", "down", "2", "down", "3", "down", "4", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.advancedResult.contains("2,5") { failures.append("Statistics mean expected 2,5, got \(calculator.advancedResult)") }
        for key in ["menu", "4", "menu", "6"] { calculator.press(key) }
        if calculator.advancedFields != ["1", "2", "3", "4"] { failures.append("Statistics rows were not restored") }
        calculator.press("on")
        for key in ["menu", "4", "1", "3", "left", "2"] { calculator.press(key) }
        if calculator.advancedFields.first != "123" { failures.append("Advanced field insertion failed") }
        calculator.press("on")
        for key in ["1", "3"] { calculator.press(key) }
        calculator.selectExpressionCursor(1); calculator.press("2"); calculator.press("equals")
        await waitForResult()
        if calculator.result != "123" { failures.append("Expression cursor insertion failed: \(calculator.result)") }
        calculator.selectExpressionCursor(0); calculator.press("4"); calculator.press("equals")
        await waitForResult()
        if calculator.result != "4123" { failures.append("Expression editing after result failed: \(calculator.result)") }
        calculator.press("on")
        for key in ["optn", "1", "1", "0", "0", "down", "1", "2", "5", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.advancedResult != "25" { failures.append("Delta percent expected 25, got \(calculator.advancedResult)") }
        calculator.press("on")
        for key in ["menu", "8", "right", "down", "equals", "4", "2", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.sheetGrid || calculator.sheetCells["B2"] != "42" { failures.append("Grid B2 did not save") }
        for _ in 0..<200 { if calculator.sheetValues["B2"] == "42" { break }; try? await Task.sleep(nanoseconds:50_000_000) }
        if calculator.sheetValues["B2"] != "42" { failures.append("Grid value was not evaluated") }
        for key in ["optn", "alpha", "dms", "3", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.sheetGrid || calculator.sheetCells["B3"] != "42" { failures.append("Sheet copy failed") }
        for key in ["optn", "optn", "down", "equals", "alpha", "dms", "4", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.sheetGrid || calculator.sheetCells["B4"] != "42" { failures.append("Sheet fill failed") }
        for key in ["optn", "alpha", "tan", "1", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.advancedMode != "PlanilhaAções" || calculator.sheetCells["B4"] != "42" { failures.append("Invalid copy changed sheet") }
        calculator.press("menu")
        if !calculator.sheetGrid || calculator.advancedMode != "Planilha" { failures.append("Sheet action cancel failed") }
        calculator.press("equals")
        if calculator.advancedFields != ["B2", "42"] { failures.append("Grid B2 did not restore") }
        calculator.press("on")
        for key in ["shift", "fraction", "1", "down", "1", "down", "2", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.result != "3/2" { failures.append("Mixed number navigation failed: \(calculator.result)") }
        calculator.press("on")
        for key in ["shift", "power", "3", "down", "2", "7", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.result != "3" { failures.append("Indexed root navigation failed: \(calculator.result)") }
        calculator.press("on")
        for key in ["shift", "negative", "2", "down", "8", "equals"] { calculator.press(key) }
        await waitForResult()
        if calculator.result != "3" { failures.append("Log base navigation failed: \(calculator.result)") }
        calculator.press("on")
        for key in ["1", "2", "3", "alpha", "del"] { calculator.press(key) }
        if calculator.expression != "12" { failures.append("Undo failed: \(calculator.expression)") }
        calculator.press("alpha"); calculator.press("del")
        if calculator.expression != "1" { failures.append("Second undo failed: \(calculator.expression)") }
        calculator.press("optn"); calculator.press("2")
        if calculator.expression != "12" { failures.append("First redo failed: \(calculator.expression)") }
        calculator.press("optn"); calculator.press("2")
        if calculator.expression != "123" { failures.append("Second redo failed: \(calculator.expression)") }
        calculator.press("clear"); calculator.press("alpha"); calculator.press("del")
        if calculator.expression != "123" { failures.append("Undo clear failed") }
        calculator.press("on")
        for key in ["menu", "2"] { calculator.press(key) }
        calculator.selectAdvancedOperation(4)
        for key in ["3", "+", "4", "alpha", "eng", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.advancedResult.contains("r=5") { failures.append("Complex polar failed: \(calculator.advancedResult)") }
        calculator.press("on")
        for key in ["menu", "5"] { calculator.press(key) }
        if let unitIndex = CalculatorModel.operations["Vetor"]?.firstIndex(of:"Unitário 2D") { calculator.selectAdvancedOperation(unitIndex) }
        else { failures.append("Vector operation missing") }
        for key in ["3", "down", "4", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.advancedResult.contains("0,6") || !calculator.advancedResult.contains("0,8") { failures.append("Vector normalization failed: \(calculator.advancedResult)") }
        calculator.press("on")
        for key in ["menu", "4"] { calculator.press(key) }
        if let scaleIndex = CalculatorModel.operations["Matriz"]?.firstIndex(of:"Escalar por número") { calculator.selectAdvancedOperation(scaleIndex) }
        else { failures.append("Matrix scaling operation missing") }
        for key in ["1", "down", "2", "down", "3", "down", "4", "down", "2", "equals"] { calculator.press(key) }
        await waitForResult()
        if !calculator.advancedResult.contains("2  4") || !calculator.advancedResult.contains("6  8") { failures.append("Matrix scaling failed: \(calculator.advancedResult)") }
        calculator.press("on")
        let output: [String: Any] = ["passed":failures.isEmpty, "failures":failures]
        if let data = try? JSONSerialization.data(withJSONObject:output),
           let directory = FileManager.default.urls(for:.documentDirectory,in:.userDomainMask).first {
            try? data.write(to:directory.appendingPathComponent("native-selftest.json"),options:.atomic)
        }
    }
}
#endif
