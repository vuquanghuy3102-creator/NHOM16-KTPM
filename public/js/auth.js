document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm).entries());

      try {
        const result = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify(data)
        });
        saveSession(result.data.token, result.data.user);
        location.href = result.data.user.role === "ADMIN" ? "/admin.html" : "/";
      } catch (error) {
        showMessage("formMessage", error.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(registerForm).entries());

      if (data.password !== data.confirmPassword) {
        return showMessage("formMessage", "Password confirmation does not match");
      }

      delete data.confirmPassword;

      try {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify(data)
        });
        showMessage("formMessage", "Registration successful. You can now login.", "success");
        registerForm.reset();
      } catch (error) {
        showMessage("formMessage", error.message);
      }
    });
  }
});
