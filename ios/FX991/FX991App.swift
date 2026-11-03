import SwiftUI

@main
struct FX991App: App {
    init() {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("--native-selftest") {
            Task { @MainActor in await NativeSelfTest.run() }
        }
        #endif
    }
    var body: some Scene {
        WindowGroup { CalculatorView() }
    }
}
