import re

with open('web/app/signup/page.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

new_submit = '''  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const data = await signup({ email, password, name });
      if (!data?.session && data?.user) {
        setErr('Vui lòng kiểm tra hộp thư email của bạn để xác nhận tài khoản!');
        return;
      }
      router.replace(next);
    } catch (e) {
      setErr(e?.payload?.detail || e.message || 'Đăng ký thất bại');
    } finally {
      setBusy(false);
    }
  };'''

code = re.sub(r'  const submit = async \(e\) => \{.*?\};\n', new_submit + '\n', code, flags=re.DOTALL)

with open('web/app/signup/page.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
