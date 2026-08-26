with open("src/App.jsx", "r") as f:
    code = f.read()

# Palitan ang sticky header styling para takpan ang guwang sa itaas
old_header_style = """            {/* FROZEN STICKY SOCIAL HEADER */}
            <div style={{ 
              position: "sticky", 
              top: 0, 
              zIndex: 900, 
              background: "rgba(248, 250, 252, 0.92)", 
              backdropFilter: "blur(10px)", 
              WebkitBackdropFilter: "blur(10px)", 
              padding: "10px 0 12px 0", 
              marginBottom: "12px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              borderBottom: "1px solid rgba(226, 232, 240, 0.6)"
            }}>"""

new_header_style = """            {/* FROZEN STICKY SOCIAL HEADER - ZERO GAP FIX */}
            <div style={{ 
              position: "sticky", 
              top: "-16px", 
              marginTop: "-16px",
              paddingTop: "24px",
              paddingBottom: "12px",
              paddingLeft: "16px",
              paddingRight: "16px",
              marginLeft: "-16px",
              marginRight: "-16px",
              zIndex: 900, 
              background: "#f8fafc", 
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
              marginBottom: "12px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              borderBottom: "1px solid #e2e8f0"
            }}>"""

code = code.replace(old_header_style, new_header_style)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Fixed header top gap completely!")
