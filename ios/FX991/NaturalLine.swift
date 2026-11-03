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
