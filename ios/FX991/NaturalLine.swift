import SwiftUI

/// Displays supported top-level fractions as a stack while retaining source offsets for the caret.
struct NaturalLine: View {
    let text: String
    let size: CGFloat
    var cursor: Int? = nil
    var body: some View { render(Array(text), cursor:cursor, size:size) }
    private func render(_ chars: [Character], cursor: Int?, size: CGFloat) -> AnyView {
        var depth = 0, slash: Int?
        for (index, char) in chars.enumerated() {
            if char == "(" { depth += 1 }
            else if char == ")" { depth -= 1 }
            else if char == "/" && depth == 0 { slash = index }
        }
        guard let cut = slash, cut > 0, cut + 1 < chars.count else {
            return AnyView(DigitLine(text:String(chars),size:size,cursor:cursor))
        }
        func strip(_ input: [Character], offset: Int, position: Int?) -> ([Character], Int?) {
            var begin = 0, end = input.count
            if input.first == "(" && input.last == ")" {
                var level = 0, closesAtEnd = false
                for (index, char) in input.enumerated() {
                    if char == "(" { level += 1 }
                    if char == ")" { level -= 1; if level == 0 { closesAtEnd = index == input.count - 1; break } }
                }
                if closesAtEnd { begin = 1; end -= 1 }
            }
            let local = position.flatMap { p -> Int? in
                guard p >= offset && p <= offset + input.count else { return nil }
                return max(0,min(end - begin,p - offset - begin))
            }
            return (Array(input[begin..<end]),local)
        }
        let numerator = strip(Array(chars[0..<cut]),offset:0,position:cursor)
        let denominator = strip(Array(chars[(cut+1)..<chars.count]),offset:cut+1,position:cursor)
        return AnyView(VStack(spacing:0) {
            render(numerator.0,cursor:numerator.1,size:size*0.7)
            Rectangle().frame(height:1)
            render(denominator.0,cursor:denominator.1,size:size*0.7)
        }.fixedSize())
    }
}
