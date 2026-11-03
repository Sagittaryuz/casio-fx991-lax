import SwiftUI

/// Natural rendering of common expression structures. Offsets always refer to the original source.
struct NaturalLine: View {
    let text: String
    let size: CGFloat
    var cursor: Int? = nil
    var onSelect: ((Int) -> Void)? = nil
    var body: some View { render(Array(text), start:0, size:size) }

    private func render(_ chars: [Character], start: Int, size: CGFloat) -> AnyView {
        // Only unwrap parentheses enclosing the entire subexpression.
        if chars.first == "(", chars.last == ")", chars.count >= 2 {
            var depth = 0, complete = true
            for (i, char) in chars.enumerated() {
                if char == "(" { depth += 1 }
                if char == ")" { depth -= 1; if depth == 0 && i < chars.count - 1 { complete = false; break } }
                if depth < 0 { complete = false; break }
            }
            if complete && depth == 0 {
                return AnyView(HStack(spacing:0) {
                    leaf(["("],start:start,size:size)
                    render(Array(chars.dropFirst().dropLast()),start:start + 1,size:size)
                    leaf([")"],start:start + chars.count - 1,size:size)
                }.fixedSize())
            }
        }
        var depth = 0, additive: Int?, product: Int?, power: Int?
        for (i, char) in chars.enumerated() {
            if char == "(" { depth += 1; continue }
            if char == ")" { depth -= 1; continue }
            guard depth == 0, i > 0, i + 1 < chars.count else { continue }
            if (char == "+" || char == "-") && !"+-*/^(;".contains(chars[i-1]) { additive = i }
            if char == "*" || char == "/" { product = i }
            if char == "^" && power == nil { power = i }
        }
        if let cut = additive ?? product {
            let left = Array(chars[..<cut]), right = Array(chars[(cut+1)...])
            if chars[cut] == "/" {
                return AnyView(VStack(spacing:0) {
                    render(left,start:start,size:size * 0.7)
                    Rectangle().frame(height:1)
                    render(right,start:start + cut + 1,size:size * 0.7)
                }.fixedSize())
            }
            return AnyView(HStack(spacing:0) {
                render(left,start:start,size:size)
                leaf([chars[cut]],start:start + cut,size:size)
                render(right,start:start + cut + 1,size:size)
            }.fixedSize())
        }
        if let cut = power {
            return AnyView(HStack(alignment:.top,spacing:0) {
                render(Array(chars[..<cut]),start:start,size:size)
                render(Array(chars[(cut+1)...]),start:start + cut + 1,size:size * 0.65)
            }.fixedSize())
        }
        if chars.count >= 7, String(chars.prefix(4)) == "mix(", chars.last == ")" {
            var depth = 0, separators: [Int] = []
            for i in 4..<(chars.count - 1) {
                if chars[i] == "(" { depth += 1 }
                else if chars[i] == ")" { depth -= 1 }
                else if chars[i] == ";" && depth == 0 { separators.append(i) }
            }
            if separators.count == 2 {
                let a = separators[0], b = separators[1]
                return AnyView(HStack(spacing:2) {
                    render(Array(chars[4..<a]),start:start + 4,size:size)
                    VStack(spacing:0) {
                        render(Array(chars[(a + 1)..<b]),start:start + a + 1,size:size * 0.7)
                        Rectangle().frame(height:1)
                        render(Array(chars[(b + 1)..<(chars.count - 1)]),start:start + b + 1,size:size * 0.7)
                    }.fixedSize()
                }.fixedSize())
            }
        }
        // Two-argument templates use a semicolon in the native editor; only split
        // at the outer level so nested expressions retain their source offsets.
        for (prefix, isRoot) in [("nthroot(", true), ("logbase(", false)] {
            let prefixCount = prefix.count
            guard chars.count > prefixCount + 1, String(chars.prefix(prefixCount)) == prefix, chars.last == ")" else { continue }
            var level = 0, separator: Int?
            for i in prefixCount..<(chars.count - 1) {
                if chars[i] == "(" { level += 1 }
                else if chars[i] == ")" { level -= 1 }
                else if chars[i] == ";" && level == 0 { separator = i; break }
            }
            guard let split = separator else { continue }
            let first = Array(chars[prefixCount..<split]), second = Array(chars[(split + 1)..<(chars.count - 1)])
            return AnyView(HStack(alignment:.bottom,spacing:0) {
                if isRoot {
                    render(first,start:start + prefixCount,size:size * 0.55).offset(y:-size * 0.35)
                    leaf(["√"],start:start + prefixCount - 1,size:size)
                    VStack(spacing:0) { Rectangle().frame(height:1); render(second,start:start + split + 1,size:size * 0.85) }
                } else {
                    leaf(Array("log"),start:start,size:size)
                    render(first,start:start + prefixCount,size:size * 0.6).offset(y:size * 0.2)
                    leaf(["("],start:start + split,size:size)
                    render(second,start:start + split + 1,size:size)
                    leaf([")"],start:start + chars.count - 1,size:size)
                }
            }.fixedSize())
        }
        if chars.count >= 6, String(chars.prefix(5)) == "cbrt(", chars.last == ")" {
            let inner = Array(chars.dropFirst(5).dropLast())
            return AnyView(HStack(alignment:.bottom,spacing:0) {
                Text("3").font(.system(size:size * 0.55)).offset(y:-size * 0.35).accessibilityHidden(true)
                leaf(["√"],start:start + 4,size:size)
                VStack(spacing:0) { Rectangle().frame(height:1); render(inner,start:start + 5,size:size * 0.85) }
            }.fixedSize())
        }
        if chars.count >= 6, String(chars.prefix(5)) == "sqrt(", chars.last == ")" {
            let inner = Array(chars.dropFirst(5).dropLast())
            return AnyView(HStack(alignment:.bottom,spacing:0) {
                leaf(["√"],start:start + 4,size:size)
                VStack(spacing:0) { Rectangle().frame(height:1); render(inner,start:start + 5,size:size * 0.85) }
            }.fixedSize())
        }
        return leaf(chars,start:start,size:size)
    }
    private func leaf(_ chars: [Character], start: Int, size: CGFloat) -> AnyView {
        let localCursor = cursor.flatMap { value -> Int? in
            guard value >= start && value <= start + chars.count else { return nil }
            return value - start
        }
        guard let onSelect = onSelect else { return AnyView(DigitLine(text:String(chars),size:size,cursor:localCursor)) }
        return AnyView(HStack(spacing:0) {
            ForEach(Array(chars.enumerated()),id: \.offset) { index, char in
                Button { onSelect(start + index) } label: {
                    HStack(spacing:0) {
                        if localCursor == index { Rectangle().frame(width:1,height:size).accessibilityHidden(true) }
                        DigitLine(text:String(char),size:size)
                    }.contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel("Selecionar antes de \(String(char))")
            }
            Button { onSelect(start + chars.count) } label: {
                Rectangle().fill(localCursor == chars.count ? Color.primary : Color.clear)
                    .frame(width:max(5,size * 0.2),height:size).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel("Selecionar fim do trecho")
        }.fixedSize())
    }
}
