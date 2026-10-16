const API_BASE = "/api";

const I18N = {
  vi: {
    brand:"Pangu", nav_hotels:"Khách sạn", nav_bookings:"Đơn đặt phòng", nav_profile:"Thông tin cá nhân",
    nav_admin:"Quản trị", nav_login:"Đăng nhập", nav_register:"Đăng ký", nav_logout:"Đăng xuất", lang_button:"EN",
    hero_title:"Tìm kỳ nghỉ phù hợp tại Pangu", hero_subtitle:"Tìm theo tỉnh thành, so sánh giá và đặt phòng nhanh chóng.",
    province_label:"Tỉnh / Thành phố", province_placeholder:"Chọn tỉnh hoặc thành phố", price_label:"Khoảng giá",
    price_min:"Tối thiểu", price_max:"Tối đa", search_button:"Tìm kiếm", reset_button:"Đặt lại",
    hotels_title:"Hệ thống khách sạn Pangu", hotels_subtitle:"Chọn điểm đến và kiểm tra tình trạng phòng.",
    from:"Từ", per_night:"/ đêm", view_details:"Xem chi tiết", rooms:"phòng", loading_hotels:"Đang tải khách sạn...",
    no_hotels:"Không tìm thấy khách sạn phù hợp.", login_title:"Đăng nhập", email:"Email", password:"Mật khẩu",
    login_button:"Đăng nhập", register_title:"Đăng ký tài khoản", full_name:"Họ và tên", phone:"Số điện thoại",
    confirm_password:"Nhập lại mật khẩu", register_button:"Đăng ký", hotel_detail_rooms:"Kiểm tra phòng trống",
    hotel_detail_hint:"Chọn ngày nhận phòng, trả phòng và số khách.", check_in:"Ngày nhận phòng", check_out:"Ngày trả phòng",
    guests:"Số khách", check_rooms:"Kiểm tra phòng trống", rooms_title:"Danh sách phòng", book_room:"Đặt phòng này",
    select_dates:"Chọn ngày ở phía trên để kiểm tra tình trạng phòng", no_rooms:"Khách sạn này chưa có phòng.",
    no_available_rooms:"Không có phòng trống trong khoảng ngày đã chọn.", my_bookings:"Đơn đặt phòng của tôi",
    my_bookings_hint:"Xem lịch sử đặt phòng và hủy các đơn hợp lệ.", cancel_booking:"Hủy phòng", view_detail:"Xem chi tiết",
    personal_info:"Thông tin cá nhân", address:"Địa chỉ", dob:"Ngày sinh", identity:"Số CCCD/Hộ chiếu",
    update_profile:"Cập nhật thông tin", change_password:"Đổi mật khẩu", current_password:"Mật khẩu hiện tại",
    new_password:"Mật khẩu mới", confirm_new_password:"Nhập lại mật khẩu mới",
    footer:"Pangu Hotel Booking · Bài tập lớn Kiểm thử phần mềm"
  },
  en: {
    brand:"Pangu", nav_hotels:"Hotels", nav_bookings:"My Bookings", nav_profile:"Profile", nav_admin:"Admin",
    nav_login:"Login", nav_register:"Register", nav_logout:"Logout", lang_button:"VI",
    hero_title:"Find your perfect stay at Pangu", hero_subtitle:"Search by province, compare prices and book quickly.",
    province_label:"Province / City", province_placeholder:"Choose a province or city", price_label:"Price range",
    price_min:"Min", price_max:"Max", search_button:"Search", reset_button:"Reset",
    hotels_title:"Pangu hotels", hotels_subtitle:"Choose a destination and check room availability.",
    from:"From", per_night:"/ night", view_details:"View details", rooms:"rooms", loading_hotels:"Loading hotels...",
    no_hotels:"No hotels matched your search.", login_title:"Login", email:"Email", password:"Password",
    login_button:"Login", register_title:"Create account", full_name:"Full name", phone:"Phone",
    confirm_password:"Confirm password", register_button:"Register", hotel_detail_rooms:"Check room availability",
    hotel_detail_hint:"Select check-in, check-out and guests.", check_in:"Check-in", check_out:"Check-out",
    guests:"Guests", check_rooms:"Check available rooms", rooms_title:"Rooms", book_room:"Book this room",
    select_dates:"Select dates above to check availability", no_rooms:"This hotel has no rooms.",
    no_available_rooms:"No available rooms for the selected dates.", my_bookings:"My bookings",
    my_bookings_hint:"View booking history and cancel eligible bookings.", cancel_booking:"Cancel booking",
    view_detail:"View detail", personal_info:"Personal information", address:"Address", dob:"Date of birth",
    identity:"Identity number", update_profile:"Update profile", change_password:"Change password",
    current_password:"Current password", new_password:"New password", confirm_new_password:"Confirm new password",
    footer:"Pangu Hotel Booking · Software Testing Coursework"
  }
};

function getLang(){ return localStorage.getItem("pangu_lang") || "vi"; }
function t(key){ return I18N[getLang()]?.[key] ?? I18N.en[key] ?? key; }
function applyLanguage(){
  document.documentElement.lang = getLang();
  document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
  const btn=document.getElementById("languageToggle"); if(btn) btn.textContent=t("lang_button");
}
function toggleLanguage(){ localStorage.setItem("pangu_lang", getLang()==="vi"?"en":"vi"); location.reload(); }

function getToken(){ return localStorage.getItem("hotel_token"); }
function getCurrentUser(){ try{return JSON.parse(localStorage.getItem("hotel_user"))||null;}catch{return null;} }
function saveSession(token,user){ localStorage.setItem("hotel_token",token); localStorage.setItem("hotel_user",JSON.stringify(user)); }
function clearSession(){ localStorage.removeItem("hotel_token"); localStorage.removeItem("hotel_user"); }

async function api(path, options={}){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  const token=getToken(); if(token) headers.Authorization=`Bearer ${token}`;
  const response=await fetch(`${API_BASE}${path}`,{...options,headers});
  let body={}; try{body=await response.json();}catch{body={success:false,message:"Invalid server response"};}
  if(!response.ok){ const error=new Error(body.message||"Request failed"); error.status=response.status; error.body=body; throw error; }
  return body;
}
function showMessage(elementId,text,type="error"){ const el=document.getElementById(elementId); if(!el)return; el.textContent=text; el.className=`message show ${type}`; }
function money(value){ return Number(value||0).toLocaleString("vi-VN")+" VND"; }
function escapeHtml(value){ return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
async function logout(){ try{if(getToken())await api("/auth/logout",{method:"POST"});}catch{} clearSession(); location.href="/login.html"; }
function renderNav(){
  const user=getCurrentUser();
  document.querySelectorAll("[data-auth-only]").forEach(el=>el.classList.toggle("hidden",!user));
  document.querySelectorAll("[data-guest-only]").forEach(el=>el.classList.toggle("hidden",!!user));
  document.querySelectorAll("[data-admin-only]").forEach(el=>el.classList.toggle("hidden",!user||user.role!=="ADMIN"));
}
document.addEventListener("DOMContentLoaded",()=>{renderNav();applyLanguage();});
