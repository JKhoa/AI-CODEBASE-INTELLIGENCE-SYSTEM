with open('web/app/api/scan/route.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("Authorization: Bearer  ", "Authorization: \Bearer \\ ")

with open('web/app/api/scan/route.js', 'w', encoding='utf-8') as f:
    f.write(code)
