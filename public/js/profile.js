async function loadProfile() {
  if (!getToken()) {
    location.href = "/login.html";
    return;
  }

  try {
    const result = await api("/customers/profile");
    const p = result.data;
    document.getElementById("email").value = p.email || "";
    document.getElementById("fullName").value = p.full_name || "";
    document.getElementById("phone").value = p.phone || "";
    document.getElementById("address").value = p.address || "";
    document.getElementById("dateOfBirth").value = p.date_of_birth || "";
    document.getElementById("identityNumber").value = p.identity_number || "";
  } catch (error) {
    showMessage("profileMessage", error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();

  document.getElementById("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await api("/customers/profile", {
        method: "PUT",
        body: JSON.stringify(data)
      });
      showMessage("profileMessage", "Profile updated successfully", "success");
    } catch (error) {
      showMessage("profileMessage", error.message);
    }
  });

  document.getElementById("passwordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    if (data.newPassword !== data.confirmPassword) {
      return showMessage("passwordMessage", "New password confirmation does not match");
    }

    delete data.confirmPassword;

    try {
      await api("/customers/change-password", {
        method: "PUT",
        body: JSON.stringify(data)
      });
      showMessage("passwordMessage", "Password changed successfully", "success");
      event.currentTarget.reset();
    } catch (error) {
      showMessage("passwordMessage", error.message);
    }
  });
});
